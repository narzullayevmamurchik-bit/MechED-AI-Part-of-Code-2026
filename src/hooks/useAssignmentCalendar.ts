import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useTeacher } from "@/hooks/useTeacher";

export type DerivedStatus = "pending" | "submitted" | "graded" | "overdue";

export interface CalendarEvent {
  id: string; // assignment id
  title: string;
  description: string;
  courseId: string;
  courseTitle: string;
  courseIcon: string;
  assignedAt: Date | null;
  deadline: Date | null;
  maxScore: number;
  status: DerivedStatus;
  // Teacher/admin aggregate fields
  submissionCount?: number;
  gradedCount?: number;
  // Student fields
  submissionId?: string | null;
  teacherScore?: number | null;
  aiScore?: number | null;
}

export type CalendarRole = "student" | "teacher" | "admin";

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const startOfLocalDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** Returns the effective [start, end] for an event as a true time range. */
export const eventRange = (e: CalendarEvent): [Date, Date] | null => {
  if (!e.deadline) return null;
  const end = e.deadline;
  const start = e.assignedAt ?? e.deadline;
  // Guard: if start somehow after end, swap so range is sane
  return start.getTime() <= end.getTime() ? [start, end] : [end, start];
};

/**
 * Bucket events into every day they overlap (assigned_at .. deadline).
 * Ensures multi-day assignments appear on each spanned day.
 */
export const bucketByRange = (events: CalendarEvent[]): Map<string, CalendarEvent[]> => {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const range = eventRange(e);
    if (!range) continue;
    const [start, end] = range;
    const cursor = startOfLocalDay(start);
    const last = startOfLocalDay(end);
    while (cursor.getTime() <= last.getTime()) {
      const key = dayKey(cursor);
      const arr = map.get(key);
      if (arr) arr.push(e);
      else map.set(key, [e]);
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  // Sort each day by start time, then deadline
  for (const arr of map.values()) {
    arr.sort((a, b) => {
      const ra = eventRange(a)!;
      const rb = eventRange(b)!;
      return ra[0].getTime() - rb[0].getTime() || ra[1].getTime() - rb[1].getTime();
    });
  }
  return map;
};

/** @deprecated Use bucketByRange — kept for backwards compatibility. */
export const bucketByDay = bucketByRange;

/** True if the event's range covers the given day. */
export const isSameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const isStartDay = (e: CalendarEvent, day: Date) => {
  const r = eventRange(e);
  return r ? isSameLocalDay(r[0], day) : false;
};

export const isEndDay = (e: CalendarEvent, day: Date) => {
  const r = eventRange(e);
  return r ? isSameLocalDay(r[1], day) : false;
};

interface Options {
  range: [Date, Date];
  courseIds?: string[];
}

export const useAssignmentCalendar = ({ range, courseIds }: Options) => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { isTeacher, taughtCourseIds, loading: teacherLoading } = useTeacher();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const role: CalendarRole = isAdmin ? "admin" : isTeacher ? "teacher" : "student";
  const roleReady = !adminLoading && !teacherLoading;

  const [fromIso, toIso] = useMemo(
    () => [range[0].toISOString(), range[1].toISOString()],
    [range],
  );
  const courseFilterKey = (courseIds || []).slice().sort().join(",");

  const refetch = useCallback(async () => {
    if (!user || !roleReady) return;
    setLoading(true);
    try {
      if (role === "student") {
        // Range-overlap: any event whose [assigned_at, deadline] intersects [fromIso, toIso].
        // Treat NULL assigned_at as -infinity (always satisfies <= toIso).
        let q = supabase
          .from("student_assignment_calendar" as any)
          .select("*")
          .lte("assigned_at", toIso)
          .gte("deadline", fromIso)
          .order("deadline", { ascending: true });
        if (courseIds && courseIds.length) q = q.in("course_id", courseIds);
        const { data, error } = await q;
        if (error) throw error;
        const mapped: CalendarEvent[] = (data || []).map((r: any) => ({
          id: r.assignment_id,
          title: r.title,
          description: r.description ?? "",
          courseId: r.course_id,
          courseTitle: r.course_title ?? "Course",
          courseIcon: r.course_icon ?? "📚",
          assignedAt: r.assigned_at ? new Date(r.assigned_at) : null,
          deadline: r.deadline ? new Date(r.deadline) : null,
          maxScore: r.max_score ?? 100,
          status: r.derived_status as DerivedStatus,
          submissionId: r.submission_id ?? null,
          teacherScore: r.teacher_score,
          aiScore: r.ai_score,
        }));
        setEvents(mapped);
      } else {
        // Range-overlap filter (see student branch above).
        let q = supabase
          .from("assignments")
          .select(
            `id, title, description, course_id, assigned_at, deadline, max_score,
             courses!inner(title, icon, published),
             submissions(id, status)`,
          )
          .lte("assigned_at", toIso)
          .gte("deadline", fromIso)
          .order("deadline", { ascending: true });

        if (role === "teacher" && taughtCourseIds.length) {
          q = q.in("course_id", taughtCourseIds);
        }
        if (courseIds && courseIds.length) {
          q = q.in("course_id", courseIds);
        }

        const { data, error } = await q;
        if (error) throw error;

        const mapped: CalendarEvent[] = (data || []).map((r: any) => {
          const subs = r.submissions || [];
          const gradedCount = subs.filter((s: any) => s.status === "graded").length;
          const status: DerivedStatus =
            subs.length === 0
              ? r.deadline && new Date(r.deadline) < new Date()
                ? "overdue"
                : "pending"
              : gradedCount === subs.length
                ? "graded"
                : "submitted";
          return {
            id: r.id,
            title: r.title,
            description: r.description ?? "",
            courseId: r.course_id,
            courseTitle: r.courses?.title ?? "Course",
            courseIcon: r.courses?.icon ?? "📚",
            assignedAt: r.assigned_at ? new Date(r.assigned_at) : null,
            deadline: r.deadline ? new Date(r.deadline) : null,
            maxScore: r.max_score ?? 100,
            status,
            submissionCount: subs.length,
            gradedCount,
          };
        });
        setEvents(mapped);
      }
    } catch (err) {
      console.warn("Failed to load calendar:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role, roleReady, fromIso, toIso, courseFilterKey, taughtCourseIds.join(",")]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const eventsByDay = useMemo(() => bucketByRange(events), [events]);

  return { events, eventsByDay, loading, role, refetch };
};
