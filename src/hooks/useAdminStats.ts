import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  publishedCourses: number;
  totalCompanies: number;
  totalJobs: number;
  totalApplications: number;
  totalProjects: number;
  totalResources: number;
}

export interface DailySeries {
  date: string;
  value: number;
}

export interface TopUser {
  user_id: string;
  display_name: string;
  xp: number;
  level: number;
  rank: number;
}

export interface TopCourse {
  id: string;
  title: string;
  icon: string;
  events: number;
}

const ACTIVE_WINDOW_MIN = 5;

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [signupSeries, setSignupSeries] = useState<DailySeries[]>([]);
  const [activitySeries, setActivitySeries] = useState<DailySeries[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sinceActive = new Date(Date.now() - ACTIVE_WINDOW_MIN * 60 * 1000).toISOString();

      const [
        profiles, courses, companies, jobs, apps, projects, resources,
        signups, activity, leaderboard, courseRows,
      ] = await Promise.all([
        supabase.from("profiles").select("user_id", { count: "exact", head: true }),
        supabase.from("courses").select("id, published"),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("job_applications").select("id", { count: "exact", head: true }),
        supabase.from("collab_projects").select("id", { count: "exact", head: true }),
        supabase.from("resources").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("created_at").gte("created_at", since30),
        supabase.from("user_activity").select("created_at, item_id, item_type").gte("created_at", since30),
        supabase.rpc("get_leaderboard", { _category: "overall", _timeframe: "weekly", _limit: 10 }),
        supabase.from("courses").select("id, title, icon"),
      ]);

      // Active users from last activity
      const { data: activeData } = await supabase
        .from("user_activity")
        .select("user_id")
        .gte("created_at", sinceActive);

      const courseList = (courses.data ?? []) as Array<{ id: string; published: boolean | null }>;
      const newStats: AdminStats = {
        totalUsers: profiles.count ?? 0,
        activeUsers: new Set((activeData ?? []).map((r) => r.user_id)).size,
        totalCourses: courseList.length,
        publishedCourses: courseList.filter((c) => c.published).length,
        totalCompanies: companies.count ?? 0,
        totalJobs: jobs.count ?? 0,
        totalApplications: apps.count ?? 0,
        totalProjects: projects.count ?? 0,
        totalResources: resources.count ?? 0,
      };
      setStats(newStats);

      // Build day buckets for last 30 days
      const days: string[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setUTCHours(0, 0, 0, 0);
        d.setUTCDate(d.getUTCDate() - i);
        days.push(d.toISOString().slice(0, 10));
      }

      const signupBuckets = new Map<string, number>(days.map((d) => [d, 0]));
      (signups.data ?? []).forEach((row: { created_at: string }) => {
        const key = row.created_at.slice(0, 10);
        if (signupBuckets.has(key)) signupBuckets.set(key, (signupBuckets.get(key) ?? 0) + 1);
      });
      setSignupSeries(days.map((d) => ({ date: d, value: signupBuckets.get(d) ?? 0 })));

      const activityBuckets = new Map<string, number>(days.map((d) => [d, 0]));
      (activity.data ?? []).forEach((row: { created_at: string }) => {
        const key = row.created_at.slice(0, 10);
        if (activityBuckets.has(key)) activityBuckets.set(key, (activityBuckets.get(key) ?? 0) + 1);
      });
      setActivitySeries(days.map((d) => ({ date: d, value: activityBuckets.get(d) ?? 0 })));

      setTopUsers(((leaderboard.data ?? []) as TopUser[]).slice(0, 10));

      // Top courses by activity events
      const courseMeta = new Map(((courseRows.data ?? []) as Array<{ id: string; title: string; icon: string }>)
        .map((c) => [c.id, c]));
      const eventsByCourse = new Map<string, number>();
      (activity.data ?? []).forEach((row: { item_id: string; item_type: string }) => {
        if (row.item_type !== "course") return;
        eventsByCourse.set(row.item_id, (eventsByCourse.get(row.item_id) ?? 0) + 1);
      });
      const top = Array.from(eventsByCourse.entries())
        .map(([id, events]) => {
          const meta = courseMeta.get(id);
          return meta ? { id, title: meta.title, icon: meta.icon || "📚", events } : null;
        })
        .filter((v): v is TopCourse => v !== null)
        .sort((a, b) => b.events - a.events)
        .slice(0, 6);
      setTopCourses(top);
    } catch (e) {
      console.warn("Failed to load admin stats:", e);
      setError(e instanceof Error ? e.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return { stats, signupSeries, activitySeries, topUsers, topCourses, loading, error, refresh: fetchAll };
};
