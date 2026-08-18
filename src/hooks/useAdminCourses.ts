import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAdminActivity } from "@/hooks/useAdminActivity";

export interface DbLesson {
  id: string;
  chapter_id: string;
  title: string;
  duration: string | null;
  type: string;
  video_url: string | null;
  pdf_url: string | null;
  sort_order: number;
  content_md: string | null;
  summary: string | null;
  xp_reward: number | null;
  is_published: boolean | null;
  resources: any;
}

export interface DbChapter {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
  description: string | null;
  lessons: DbLesson[];
}

export interface DbCourse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string;
  duration: string | null;
  sort_order: number;
  published: boolean;
  created_at: string;
  field_id: string | null;
  specialization_id: string | null;
  status: string | null;
  level: string | null;
  language: string | null;
  thumbnail_url: string | null;
  learning_outcomes: string[] | null;
  skills: string[] | null;
  estimated_hours: number | null;
  is_ai_generated: boolean | null;
  chapters: DbChapter[];
}

export type CoursePatch = Partial<{
  title: string;
  description: string;
  icon: string;
  duration: string;
  published: boolean;
  slug: string;
  field_id: string | null;
  specialization_id: string | null;
  level: string | null;
  language: string | null;
  thumbnail_url: string | null;
  learning_outcomes: string[];
  skills: string[];
  estimated_hours: number | null;
  status: string;
}>;

export type LessonPatch = Partial<{
  title: string;
  type: string;
  duration: string;
  video_url: string;
  pdf_url: string;
  content_md: string;
  summary: string;
  xp_reward: number;
  is_published: boolean;
}>;

export const useAdminCourses = () => {
  const [courses, setCourses] = useState<DbCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .order("sort_order");

      if (coursesError) throw coursesError;
      if (!coursesData?.length) {
        setCourses([]);
        return;
      }

      const courseIds = coursesData.map((course) => course.id);
      const { data: chaptersData, error: chaptersError } = await supabase
        .from("chapters")
        .select("*")
        .in("course_id", courseIds)
        .order("sort_order");

      if (chaptersError) throw chaptersError;

      const chapterIds = (chaptersData || []).map((chapter) => chapter.id);
      const lessonsResponse = chapterIds.length
        ? await supabase
            .from("lessons")
            .select("*")
            .in("chapter_id", chapterIds)
            .order("sort_order")
        : { data: [] as any[], error: null };

      if (lessonsResponse.error) throw lessonsResponse.error;

      const lessonsByChapter = new Map<string, DbLesson[]>();
      (lessonsResponse.data || []).forEach((lesson: any) => {
        const items = lessonsByChapter.get(lesson.chapter_id) || [];
        items.push(lesson as DbLesson);
        lessonsByChapter.set(lesson.chapter_id, items);
      });

      const chaptersByCourse = new Map<string, DbChapter[]>();
      (chaptersData || []).forEach((chapter: any) => {
        const items = chaptersByCourse.get(chapter.course_id) || [];
        items.push({
          id: chapter.id,
          course_id: chapter.course_id,
          title: chapter.title,
          description: chapter.description ?? null,
          sort_order: chapter.sort_order ?? 0,
          lessons: lessonsByChapter.get(chapter.id) || [],
        });
        chaptersByCourse.set(chapter.course_id, items);
      });

      const enriched: DbCourse[] = coursesData.map((course: any) => ({
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        icon: course.icon || "📚",
        duration: course.duration,
        sort_order: course.sort_order ?? 0,
        published: course.published ?? false,
        created_at: course.created_at ?? new Date().toISOString(),
        field_id: course.field_id ?? null,
        specialization_id: course.specialization_id ?? null,
        status: course.status ?? null,
        level: course.level ?? null,
        language: course.language ?? null,
        thumbnail_url: course.thumbnail_url ?? null,
        learning_outcomes: course.learning_outcomes ?? [],
        skills: course.skills ?? [],
        estimated_hours: course.estimated_hours ?? null,
        is_ai_generated: course.is_ai_generated ?? false,
        chapters: chaptersByCourse.get(course.id) || [],
      }));

      setCourses(enriched);
    } catch (error) {
      console.warn("Failed to load admin courses:", error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const createCourse = async (data: { title: string; slug: string; description?: string; icon?: string; duration?: string; field_id?: string | null; specialization_id?: string | null; level?: string; language?: string }) => {
    const { error } = await supabase.from("courses").insert({
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      icon: data.icon || "📚",
      duration: data.duration || null,
      published: false,
      sort_order: courses.length,
      field_id: data.field_id ?? null,
      specialization_id: data.specialization_id ?? null,
      level: data.level ?? "beginner",
      language: data.language ?? "en",
    });
    if (!error) {
      await fetchCourses();
      void logAdminActivity("create", "course", null, data.title);
    }
    return { error };
  };

  const updateCourse = async (id: string, data: CoursePatch) => {
    const prev = courses.find(c => c.id === id);
    const { error } = await supabase.from("courses").update(data as any).eq("id", id);
    if (!error) {
      await fetchCourses();
      const action = data.published !== undefined && data.published !== prev?.published
        ? (data.published ? "publish" : "unpublish")
        : "update";
      void logAdminActivity(action, "course", id, prev?.title ?? id);
    }
    return { error };
  };

  const deleteCourse = async (id: string) => {
    const prev = courses.find(c => c.id === id);
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (!error) {
      await fetchCourses();
      void logAdminActivity("delete", "course", id, prev?.title ?? id);
    }
    return { error };
  };

  const createChapter = async (courseId: string, title: string) => {
    const course = courses.find(c => c.id === courseId);
    const { error } = await supabase.from("chapters").insert({
      course_id: courseId,
      title,
      sort_order: course?.chapters.length || 0,
    });
    if (!error) {
      await fetchCourses();
      void logAdminActivity("create", "chapter", null, title, { course: course?.title });
    }
    return { error };
  };

  const updateChapter = async (id: string, title: string) => {
    const { error } = await supabase.from("chapters").update({ title }).eq("id", id);
    if (!error) {
      await fetchCourses();
      void logAdminActivity("update", "chapter", id, title);
    }
    return { error };
  };

  const deleteChapter = async (id: string) => {
    const { error } = await supabase.from("chapters").delete().eq("id", id);
    if (!error) {
      await fetchCourses();
      void logAdminActivity("delete", "chapter", id);
    }
    return { error };
  };

  const createLesson = async (chapterId: string, data: { title: string; type: string; duration?: string; video_url?: string; pdf_url?: string; content_md?: string; summary?: string; xp_reward?: number }) => {
    const chapter = courses.flatMap(c => c.chapters).find(ch => ch.id === chapterId);
    const { error } = await supabase.from("lessons").insert({
      chapter_id: chapterId,
      title: data.title,
      type: data.type,
      duration: data.duration || null,
      video_url: data.video_url || null,
      pdf_url: data.pdf_url || null,
      content_md: data.content_md || null,
      summary: data.summary || null,
      xp_reward: data.xp_reward ?? 10,
      sort_order: chapter?.lessons.length || 0,
    });
    if (!error) {
      await fetchCourses();
      void logAdminActivity("create", "lesson", null, data.title);
    }
    return { error };
  };

  const updateLesson = async (id: string, data: LessonPatch) => {
    const { error } = await supabase.from("lessons").update(data as any).eq("id", id);
    if (!error) {
      await fetchCourses();
      void logAdminActivity("update", "lesson", id, data.title);
    }
    return { error };
  };

  const deleteLesson = async (id: string) => {
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (!error) {
      await fetchCourses();
      void logAdminActivity("delete", "lesson", id);
    }
    return { error };
  };

  return {
    courses, loading, fetchCourses,
    createCourse, updateCourse, deleteCourse,
    createChapter, updateChapter, deleteChapter,
    createLesson, updateLesson, deleteLesson,
  };
};
