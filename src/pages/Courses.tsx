import { useState, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CourseCard } from "@/components/CourseCard";
import { useProgress } from "@/hooks/useProgress";
import { useCourses } from "@/hooks/useCourses";
import { useLanguage } from "@/i18n/LanguageContext";
import { courses as staticCourses } from "@/data/courses";
import { Search, Filter, BookOpen, Loader2 } from "lucide-react";
import { TranslationKey } from "@/i18n/translations";

type ProgressFilter = "all" | "not-started" | "in-progress" | "completed";

const Courses = () => {
  const [search, setSearch] = useState("");
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");
  const { getCourseProgress } = useProgress();
  const { data: dbCourses, isLoading } = useCourses();
  const { t } = useLanguage();

  const allCourses = useMemo(() => {
    const dbList = dbCourses || [];
    const dbIds = new Set(dbList.map((c) => c.id));
    const fallback = staticCourses.filter((c) => !dbIds.has(c.id));
    return [...dbList, ...fallback];
  }, [dbCourses]);

  const coursesWithProgress = useMemo(() => {
    return allCourses.map((course) => {
      const allLessonIds = course.chapters.flatMap((ch) => ch.lessons.map((l) => l.id));
      const liveProgress = getCourseProgress(allLessonIds);
      return { ...course, progress: liveProgress };
    });
  }, [allCourses, getCourseProgress]);

  const filtered = useMemo(() => {
    let result = coursesWithProgress;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }
    if (progressFilter === "not-started") {
      result = result.filter((c) => c.progress === 0);
    } else if (progressFilter === "in-progress") {
      result = result.filter((c) => c.progress > 0 && c.progress < 100);
    } else if (progressFilter === "completed") {
      result = result.filter((c) => c.progress === 100);
    }
    return result;
  }, [coursesWithProgress, search, progressFilter]);

  const filterButtons: { labelKey: TranslationKey; value: ProgressFilter }[] = [
    { labelKey: "courses_filter_all", value: "all" },
    { labelKey: "courses_filter_not_started", value: "not-started" },
    { labelKey: "courses_filter_in_progress", value: "in-progress" },
    { labelKey: "courses_filter_completed", value: "completed" },
  ];

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-accent" />
                {t("courses_all")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {filtered.length} {t("courses_available")}
              </p>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("courses_search")}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-secondary border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {filterButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setProgressFilter(btn.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    progressFilter === btn.value
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(btn.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">{t("courses_no_found")}</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                {search ? t("courses_try_different") : t("courses_check_later")}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((course) => (
              <CourseCard key={course.id} {...course} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Courses;
