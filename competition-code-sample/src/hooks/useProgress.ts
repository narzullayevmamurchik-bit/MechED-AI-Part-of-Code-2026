import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProgressState {
  [lessonId: string]: boolean;
}

const STORAGE_KEY = "meched-progress";

// Type-safe helper until types are regenerated
const progressTable = () => supabase.from("user_progress" as any);

const readStoredProgress = (): ProgressState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const persistProgress = (next: ProgressState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage failures and keep UI responsive.
  }
};

export function useProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressState>(readStoredProgress);
  const [loaded, setLoaded] = useState(false);

  // Load progress from DB when user is authenticated
  useEffect(() => {
    let active = true;

    if (!user) {
      setLoaded(true);
      return;
    }

    const fetchProgress = async () => {
      try {
        const { data, error } = await progressTable()
          .select("lesson_id, completed")
          .eq("user_id", user.id);

        if (error) throw error;

        const dbProgress: ProgressState = {};
        const rows = ((data ?? []) as unknown as Array<{ lesson_id: string; completed: boolean }>);

        rows.forEach((row) => {
          if (row.completed) dbProgress[row.lesson_id] = true;
        });

        if (!active) return;

        setProgress(dbProgress);
        persistProgress(dbProgress);
      } catch (error) {
        console.warn("Failed to load progress, using cached data:", error);
      } finally {
        if (active) setLoaded(true);
      }
    };

    void fetchProgress();

    return () => {
      active = false;
    };
  }, [user]);

  // Realtime subscription — uses unique channels and explicit cleanup to avoid duplicate callbacks
  useEffect(() => {
    if (!user) return;

    let active = true;
    const channel = supabase
      .channel(`user-progress-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_progress",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!active) return;

          try {
            if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
              const row = payload.new as { lesson_id: string; completed: boolean };
              setProgress((prev) => {
                const next = { ...prev, [row.lesson_id]: row.completed };
                if (!row.completed) delete next[row.lesson_id];
                persistProgress(next);
                return next;
              });
            } else if (payload.eventType === "DELETE") {
              const row = payload.old as { lesson_id: string };
              setProgress((prev) => {
                const next = { ...prev };
                delete next[row.lesson_id];
                persistProgress(next);
                return next;
              });
            }
          } catch (error) {
            console.warn("Progress realtime handler error:", error);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("Progress realtime channel error:", err ?? status);
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const isCompleted = useCallback(
    (lessonId: string) => progress[lessonId] ?? false,
    [progress]
  );

  const toggleLesson = useCallback(
    async (lessonId: string) => {
      const wasCompleted = progress[lessonId] ?? false;
      const nowCompleted = !wasCompleted;
      const optimisticState = { ...progress, [lessonId]: nowCompleted };

      if (!nowCompleted) delete optimisticState[lessonId];

      // Optimistic update
      setProgress(optimisticState);
      persistProgress(optimisticState);

      if (!user) return;

      try {
        if (nowCompleted) {
          const { error } = await progressTable().upsert(
            { user_id: user.id, lesson_id: lessonId, completed: true },
            { onConflict: "user_id,lesson_id" }
          );

          if (error) throw error;

          // Gamification: award XP, update streak, check milestone badges
          try {
            await supabase.rpc("award_xp" as any, {
              _user_id: user.id,
              _amount: 20,
              _source: "lesson_complete",
              _category: "learner",
              _source_id: lessonId,
              _reason: "Completed a lesson",
              _awarded_by: null,
              _dedupe: true,
            });
            await supabase.rpc("record_daily_activity" as any, { _user_id: user.id });

            const { count } = await progressTable()
              .select("lesson_id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("completed", true);
            const total = count ?? 0;
            const codes: string[] = [];
            if (total === 1) codes.push("first_steps");
            if (total >= 10) codes.push("lesson_10");
            if (total >= 50) codes.push("lesson_50");
            for (const code of codes) {
              await supabase.rpc("unlock_badge" as any, { _user_id: user.id, _badge_code: code });
            }
          } catch (e) {
            console.warn("Lesson XP grant failed:", e);
          }
        } else {
          const { error } = await progressTable()
            .delete()
            .eq("user_id", user.id)
            .eq("lesson_id", lessonId);

          if (error) throw error;
        }
      } catch (error) {
        console.warn("Failed to sync lesson progress:", error);

        const rollbackState = { ...progress };
        if (!wasCompleted) delete rollbackState[lessonId];
        else rollbackState[lessonId] = true;

        setProgress(rollbackState);
        persistProgress(rollbackState);
      }
    },
    [progress, user]
  );

  const getCompletedCount = useCallback(
    (lessonIds: string[]) => lessonIds.filter((id) => progress[id]).length,
    [progress]
  );

  const getCourseProgress = useCallback(
    (lessonIds: string[]) => {
      if (lessonIds.length === 0) return 0;
      const completed = lessonIds.filter((id) => progress[id]).length;
      return Math.round((completed / lessonIds.length) * 100);
    },
    [progress]
  );

  return { isCompleted, toggleLesson, getCompletedCount, getCourseProgress, loaded };
}
