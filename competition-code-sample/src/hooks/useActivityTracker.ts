import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ContentTag, courseTags, resourceCategoryToTags, expertCategoryToTags } from "@/data/tags";

export type ActivityType = "course_view" | "lesson_complete" | "resource_open" | "resource_bookmark" | "expert_view" | "search";
export type ItemType = "course" | "resource" | "expert" | "search";

const activityTable = () => supabase.from("user_activity" as any);

export function useActivityTracker() {
  const { user } = useAuth();
  const recentRef = useRef<Set<string>>(new Set());

  const trackActivity = useCallback(
    async (activityType: ActivityType, itemId: string, itemType: ItemType, tags: ContentTag[] = []) => {
      if (!user) return;

      // Deduplicate within session (same action within 30s)
      const key = `${activityType}:${itemId}`;
      if (recentRef.current.has(key)) return;
      recentRef.current.add(key);
      setTimeout(() => recentRef.current.delete(key), 30_000);

      try {
        await activityTable().insert({
          user_id: user.id,
          activity_type: activityType,
          item_id: itemId,
          item_type: itemType,
          tags,
        });
      } catch (e) {
        console.error("Failed to track activity:", e);
      }
    },
    [user]
  );

  const trackCourseView = useCallback(
    (courseId: string) => {
      const tags = courseTags[courseId] || [];
      trackActivity("course_view", courseId, "course", tags);
    },
    [trackActivity]
  );

  const trackLessonComplete = useCallback(
    (lessonId: string, courseId: string) => {
      const tags = courseTags[courseId] || [];
      trackActivity("lesson_complete", lessonId, "course", tags);
    },
    [trackActivity]
  );

  const trackResourceOpen = useCallback(
    (resourceId: string, categories: string[]) => {
      const tags = categories.flatMap((c) => resourceCategoryToTags[c] || []);
      const unique = [...new Set(tags)] as ContentTag[];
      trackActivity("resource_open", resourceId, "resource", unique);
    },
    [trackActivity]
  );

  const trackExpertView = useCallback(
    (expertId: string, categories: string[]) => {
      const tags = categories.flatMap((c) => expertCategoryToTags[c] || []);
      const unique = [...new Set(tags)] as ContentTag[];
      trackActivity("expert_view", expertId, "expert", unique);
    },
    [trackActivity]
  );

  const trackSearch = useCallback(
    (query: string) => {
      trackActivity("search", query, "search", []);
    },
    [trackActivity]
  );

  return { trackCourseView, trackLessonComplete, trackResourceOpen, trackExpertView, trackSearch };
}
