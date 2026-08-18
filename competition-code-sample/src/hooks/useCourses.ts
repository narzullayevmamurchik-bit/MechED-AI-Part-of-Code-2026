import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DBLesson {
  id: string;
  chapter_id: string;
  title: string;
  duration: string | null;
  type: string;
  video_url: string | null;
  pdf_url: string | null;
  sort_order: number | null;
  content_md?: string | null;
  summary?: string | null;
  xp_reward?: number | null;
}

export interface DBChapter {
  id: string;
  title: string;
  sort_order: number | null;
  lessons: DBLesson[];
}

export interface DBCourse {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  duration: string | null;
  slug: string;
  published: boolean | null;
  level?: string | null;
  language?: string | null;
  thumbnail_url?: string | null;
  learning_outcomes?: string[] | null;
  skills?: string[] | null;
  estimated_hours?: number | null;
  chapters: DBChapter[];
}

// Normalized shape matching what components expect
export interface NormalizedLesson {
  id: string;
  title: string;
  duration: string;
  type: "video" | "reading" | "quiz";
  completed: boolean;
  videoUrl?: string;
  pdfUrl?: string;
  contentMd?: string;
  summary?: string;
  xpReward?: number;
}

export interface NormalizedChapter {
  id: string;
  title: string;
  lessons: NormalizedLesson[];
}

export interface NormalizedCourse {
  id: string;
  title: string;
  description: string;
  progress: number;
  lessons: number;
  duration: string;
  icon: string;
  level?: string;
  language?: string;
  thumbnailUrl?: string;
  learningOutcomes?: string[];
  skills?: string[];
  estimatedHours?: number;
  chapters: NormalizedChapter[];
  quizzes: { id: string; title: string; questions: number; duration: string; score?: number; completed: boolean }[];
}

function normalizeCourse(c: DBCourse): NormalizedCourse {
  const chapters: NormalizedChapter[] = (c.chapters || [])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((ch) => ({
      id: ch.id,
      title: ch.title,
      lessons: (ch.lessons || [])
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((l) => ({
          id: l.id,
          title: l.title,
          duration: l.duration || "—",
          type: (l.type === "video" || l.type === "reading" || l.type === "quiz" ? l.type : "video") as "video" | "reading" | "quiz",
          completed: false,
          videoUrl: l.video_url ?? undefined,
          pdfUrl: l.pdf_url ?? undefined,
          contentMd: l.content_md ?? undefined,
          summary: l.summary ?? undefined,
          xpReward: l.xp_reward ?? undefined,
        })),
    }));

  const totalLessons = chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);

  return {
    id: c.slug,
    title: c.title,
    description: c.description || "",
    progress: 0,
    lessons: totalLessons,
    duration: c.duration || "—",
    icon: c.icon || "📚",
    level: c.level ?? undefined,
    language: c.language ?? undefined,
    thumbnailUrl: c.thumbnail_url ?? undefined,
    learningOutcomes: c.learning_outcomes ?? undefined,
    skills: c.skills ?? undefined,
    estimatedHours: c.estimated_hours ?? undefined,
    chapters,
    quizzes: [],
  };
}

async function fetchCourses(): Promise<NormalizedCourse[]> {
  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .eq("published", true)
    .order("sort_order");

  if (error) throw error;
  if (!courses?.length) return [];

  const courseIds = courses.map((c) => c.id);

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .in("course_id", courseIds)
    .order("sort_order");

  const chapterIds = (chapters || []).map((ch) => ch.id);

  const { data: lessons } = chapterIds.length
    ? await supabase.from("lessons").select("*").in("chapter_id", chapterIds).order("sort_order")
    : { data: [] };

  // Group lessons by chapter
  const lessonsByChapter = new Map<string, DBLesson[]>();
  (lessons || []).forEach((l: any) => {
    const arr = lessonsByChapter.get(l.chapter_id) || [];
    arr.push(l as DBLesson);
    lessonsByChapter.set(l.chapter_id, arr);
  });

  // Group chapters by course
  const chaptersByCourse = new Map<string, DBChapter[]>();
  (chapters || []).forEach((ch: any) => {
    const arr = chaptersByCourse.get(ch.course_id) || [];
    arr.push({ ...ch, lessons: lessonsByChapter.get(ch.id) || [] } as DBChapter);
    chaptersByCourse.set(ch.course_id, arr);
  });

  return courses.map((c: any) =>
    normalizeCourse({ ...c, chapters: chaptersByCourse.get(c.id) || [] } as DBCourse)
  );
}

async function fetchCourseBySlug(slug: string): Promise<NormalizedCourse | null> {
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!course) return null;

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("course_id", course.id)
    .order("sort_order");

  const chapterIds = (chapters || []).map((ch: any) => ch.id);

  const { data: lessons } = chapterIds.length
    ? await supabase.from("lessons").select("*").in("chapter_id", chapterIds).order("sort_order")
    : { data: [] };

  const lessonsByChapter = new Map<string, DBLesson[]>();
  (lessons || []).forEach((l: any) => {
    const arr = lessonsByChapter.get(l.chapter_id) || [];
    arr.push(l as DBLesson);
    lessonsByChapter.set(l.chapter_id, arr);
  });

  const dbChapters: DBChapter[] = (chapters || []).map((ch: any) => ({
    ...ch,
    lessons: lessonsByChapter.get(ch.id) || [],
  }));

  return normalizeCourse({ ...course, chapters: dbChapters } as DBCourse);
}

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });
}

export function useCourse(slug: string | undefined) {
  return useQuery({
    queryKey: ["course", slug],
    queryFn: () => fetchCourseBySlug(slug!),
    enabled: !!slug,
  });
}
