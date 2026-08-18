import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { courses as staticCourses, Course } from "@/data/courses";
import { resources, Resource } from "@/data/resources";
import { experts, Expert } from "@/data/experts";
import { ContentTag, courseTags, resourceCategoryToTags, expertCategoryToTags } from "@/data/tags";
import { useProgress } from "@/hooks/useProgress";

const activityTable = () => supabase.from("user_activity" as any);

interface UserInterests {
  tagScores: Record<string, number>;
  viewedCourses: Set<string>;
  viewedResources: Set<string>;
  topTags: ContentTag[];
}

export function useRecommendations() {
  const { user } = useAuth();
  const { getCourseProgress } = useProgress();
  const [interests, setInterests] = useState<UserInterests>({
    tagScores: {},
    viewedCourses: new Set(),
    viewedResources: new Set(),
    topTags: [],
  });
  const [loaded, setLoaded] = useState(false);

  // Fetch user activity and compute tag scores
  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }

    const fetchActivity = async () => {
      try {
        const { data, error } = await activityTable()
          .select("activity_type, item_id, item_type, tags")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(200);

        if (error) throw error;

        if (!data) {
          setLoaded(true);
          return;
        }

        const tagScores: Record<string, number> = {};
        const viewedCourses = new Set<string>();
        const viewedResources = new Set<string>();

        const weights: Record<string, number> = {
          lesson_complete: 3,
          course_view: 2,
          resource_open: 2,
          resource_bookmark: 2.5,
          expert_view: 1.5,
          search: 1,
        };

        (data as any[]).forEach((row: { activity_type: string; item_id: string; item_type: string; tags: string[] }) => {
          const weight = weights[row.activity_type] || 1;
          (row.tags || []).forEach((tag: string) => {
            tagScores[tag] = (tagScores[tag] || 0) + weight;
          });
          if (row.item_type === "course") viewedCourses.add(row.item_id);
          if (row.item_type === "resource") viewedResources.add(row.item_id);
        });

        const topTags = Object.entries(tagScores)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag]) => tag as ContentTag);

        setInterests({ tagScores, viewedCourses, viewedResources, topTags });
      } catch (error) {
        console.warn("Failed to load recommendation activity:", error);
        setInterests({
          tagScores: {},
          viewedCourses: new Set(),
          viewedResources: new Set(),
          topTags: [],
        });
      } finally {
        setLoaded(true);
      }
    };

    void fetchActivity();
  }, [user]);

  // Score a content item by how well its tags match user interests
  const scoreItem = (itemTags: ContentTag[]): number => {
    if (interests.topTags.length === 0) return 0;
    return itemTags.reduce((sum, tag) => sum + (interests.tagScores[tag] || 0), 0);
  };

  // Recommended courses: unfinished, sorted by tag relevance
  const recommendedCourses = useMemo(() => {
    const allCourses = staticCourses;
    const scored = allCourses.map((course) => {
      const tags = courseTags[course.id] || [];
      const allLessonIds = course.chapters.flatMap((ch) => ch.lessons.map((l) => l.id));
      const progress = getCourseProgress(allLessonIds);
      return {
        course,
        score: scoreItem(tags),
        progress,
      };
    });

    // Filter out 100% complete, prioritize those with some progress, then tag score
    return scored
      .filter((s) => s.progress < 100)
      .sort((a, b) => {
        // Continue learning (in-progress) first
        if (a.progress > 0 && b.progress === 0) return -1;
        if (b.progress > 0 && a.progress === 0) return 1;
        return b.score - a.score;
      })
      .slice(0, 4)
      .map((s) => ({ ...s.course, progress: s.progress }));
  }, [interests, getCourseProgress]);

  // Continue learning: courses with progress > 0 and < 100
  const continueLearning = useMemo(() => {
    return staticCourses
      .map((course) => {
        const allLessonIds = course.chapters.flatMap((ch) => ch.lessons.map((l) => l.id));
        const progress = getCourseProgress(allLessonIds);
        return { ...course, progress };
      })
      .filter((c) => c.progress > 0 && c.progress < 100)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 4);
  }, [getCourseProgress]);

  // Recommended resources by tag relevance
  const recommendedResources = useMemo(() => {
    if (interests.topTags.length === 0) {
      return resources.filter((r) => r.popular).slice(0, 4);
    }
    const scored = resources.map((r) => {
      const tags = r.categories.flatMap((c) => resourceCategoryToTags[c] || []);
      return { resource: r, score: scoreItem(tags as ContentTag[]) };
    });
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((s) => s.resource);
  }, [interests]);

  // Recommended experts by tag relevance
  const recommendedExperts = useMemo(() => {
    if (interests.topTags.length === 0) {
      return experts.filter((e) => e.isLead).slice(0, 3);
    }
    const scored = experts.map((e) => {
      const tags = e.categories.flatMap((c) => expertCategoryToTags[c] || []);
      return { expert: e, score: scoreItem(tags as ContentTag[]) };
    });
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((s) => s.expert);
  }, [interests]);

  // Related resources for a specific course
  const getRelatedResources = (courseId: string): Resource[] => {
    const tags = courseTags[courseId] || [];
    if (tags.length === 0) return resources.filter((r) => r.popular).slice(0, 4);
    const scored = resources.map((r) => {
      const rTags = r.categories.flatMap((c) => resourceCategoryToTags[c] || []);
      const overlap = tags.filter((t) => rTags.includes(t)).length;
      return { resource: r, score: overlap };
    });
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((s) => s.resource);
  };

  // Related experts for a specific course
  const getRelatedExperts = (courseId: string): Expert[] => {
    const tags = courseTags[courseId] || [];
    if (tags.length === 0) return experts.filter((e) => e.isLead).slice(0, 3);
    const scored = experts.map((e) => {
      const eTags = e.categories.flatMap((c) => expertCategoryToTags[c] || []);
      const overlap = tags.filter((t) => (eTags as string[]).includes(t)).length;
      return { expert: e, score: overlap };
    });
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.expert);
  };

  return {
    recommendedCourses,
    continueLearning,
    recommendedResources,
    recommendedExperts,
    getRelatedResources,
    getRelatedExperts,
    topTags: interests.topTags,
    loaded,
  };
}
