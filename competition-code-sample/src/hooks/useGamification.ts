import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type LeaderboardCategory = "learner" | "engineer" | "contributor" | "overall";
export type Timeframe = "all" | "weekly";
export type XpSource =
  | "lesson_complete"
  | "scenario_decision"
  | "scenario_complete"
  | "assignment_graded"
  | "collab_task_done"
  | "daily_streak"
  | "badge_unlock"
  | "admin_grant";

export interface UserGamification {
  user_id: string;
  total_xp: number;
  learner_xp: number;
  engineer_xp: number;
  contributor_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  unlocked_at: string;
  badge: Badge;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  rank: number;
}

export interface XpTransaction {
  id: string;
  user_id: string;
  amount: number;
  source: XpSource;
  category: LeaderboardCategory;
  source_id: string | null;
  reason: string | null;
  created_at: string;
}

// Level n requires triangular XP: total for level n = 100 * n*(n-1)/2
export const xpForLevel = (level: number) => 100 * Math.max(level - 1, 0) * Math.max(level, 0) / 2;
export const xpProgress = (totalXp: number, level: number) => {
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const within = Math.max(0, totalXp - base);
  const span = Math.max(1, next - base);
  return { current: within, next: span, percent: Math.min(100, Math.round((within / span) * 100)) };
};

export function useGamification() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserGamification | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setStats(null);
      setBadges([]);
      return;
    }
    const [statsRes, badgesRes, catalogRes] = await Promise.all([
      supabase.from("user_gamification" as any).select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_badges" as any).select("*, badge:badges(*)").eq("user_id", user.id).order("unlocked_at", { ascending: false }),
      supabase.from("badges" as any).select("*").order("category"),
    ]);
    setStats((statsRes.data as unknown as UserGamification) ?? null);
    setBadges((badgesRes.data as unknown as UserBadge[]) ?? []);
    setAllBadges((catalogRes.data as unknown as Badge[]) ?? []);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const awardXp = useCallback(
    async (
      amount: number,
      source: XpSource,
      category: LeaderboardCategory = "overall",
      sourceId?: string,
      reason?: string,
    ) => {
      if (!user) return 0;
      const { data, error } = await supabase.rpc("award_xp" as any, {
        _user_id: user.id,
        _amount: amount,
        _source: source,
        _category: category,
        _source_id: sourceId ?? null,
        _reason: reason ?? null,
        _awarded_by: null,
        _dedupe: true,
      });
      if (error) {
        console.warn("awardXp failed:", error);
        return 0;
      }
      // best-effort refresh
      void refresh();
      return (data as unknown as number) ?? 0;
    },
    [user, refresh],
  );

  const recordDailyActivity = useCallback(async () => {
    if (!user) return null;
    const { data, error } = await supabase.rpc("record_daily_activity" as any, { _user_id: user.id });
    if (error) {
      console.warn("recordDailyActivity failed:", error);
      return null;
    }
    void refresh();
    return data;
  }, [user, refresh]);

  const checkAndUnlockMilestones = useCallback(
    async (kind: "lesson" | "scenario" | "collab_task" | "perfect_run" | "advanced_run", count?: number) => {
      if (!user) return;
      const tries: string[] = [];
      if (kind === "lesson") {
        if (count === 1) tries.push("first_steps");
        if (count && count >= 10) tries.push("lesson_10");
        if (count && count >= 50) tries.push("lesson_50");
      } else if (kind === "scenario") {
        if (count === 1) tries.push("first_scenario");
        if (count && count >= 5) tries.push("scenario_5");
      } else if (kind === "collab_task") {
        if (count && count >= 5) tries.push("task_done_5");
      } else if (kind === "perfect_run") {
        tries.push("perfect_run");
      } else if (kind === "advanced_run") {
        tries.push("scenario_advanced");
      }
      for (const code of tries) {
        await supabase.rpc("unlock_badge" as any, { _user_id: user.id, _badge_code: code });
      }
      void refresh();
    },
    [user, refresh],
  );

  return {
    stats,
    badges,
    allBadges,
    loading,
    refresh,
    awardXp,
    recordDailyActivity,
    checkAndUnlockMilestones,
  };
}

export async function fetchLeaderboard(
  category: LeaderboardCategory,
  timeframe: Timeframe,
  limit = 25,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc("get_leaderboard" as any, {
    _category: category,
    _timeframe: timeframe,
    _limit: limit,
  });
  if (error) {
    console.warn("leaderboard fetch failed:", error);
    return [];
  }
  return (data as unknown as LeaderboardEntry[]) ?? [];
}

export async function fetchRecentXp(userId: string, limit = 20): Promise<XpTransaction[]> {
  const { data, error } = await supabase
    .from("xp_transactions" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("xp tx fetch failed:", error);
    return [];
  }
  return (data as unknown as XpTransaction[]) ?? [];
}
