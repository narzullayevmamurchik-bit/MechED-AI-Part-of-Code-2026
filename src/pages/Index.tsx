import { Suspense, lazy, memo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { StatsCard } from "@/components/StatsCard";
import { CourseCard } from "@/components/CourseCard";
import { GlobalSearch } from "@/components/GlobalSearch";
import { DashboardErrorBoundary } from "@/components/DashboardErrorBoundary";
import { useProgress } from "@/hooks/useProgress";
import { useCourses } from "@/hooks/useCourses";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRecommendations } from "@/hooks/useRecommendations";
import { usePresence } from "@/hooks/usePresence";
import { useGamification } from "@/hooks/useGamification";
import { XpProgressCard } from "@/components/gamification/XpProgressCard";
import { StreakCard } from "@/components/gamification/StreakCard";
import {
  RecommendationBlock,
  RecommendedCoursesGrid,
  RecommendedResourcesGrid,
  RecommendedExpertsGrid,
} from "@/components/RecommendationSection";
import { CommunityOpportunities } from "@/components/CommunityOpportunities";
import { courses as staticCourses } from "@/data/courses";
import { BookOpen, Trophy, Clock, TrendingUp, Bell, Loader2, Sparkles, Play, Users, FileText } from "lucide-react";

// Lazy load heavy chart component
const ProgressChart = lazy(() =>
  import("@/components/ProgressChart").then((m) => ({ default: m.ProgressChart }))
);
const RecentActivity = lazy(() =>
  import("@/components/RecentActivity").then((m) => ({ default: m.RecentActivity }))
);

const ChartFallback = () => (
  <div className="bg-card rounded-xl border border-border p-5 h-48 flex items-center justify-center">
    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
  </div>
);

const DashboardContent = memo(() => {
  const { getCourseProgress } = useProgress();
  const { data: dbCourses, isLoading } = useCourses();
  const { t } = useLanguage();
  const {
    recommendedCourses,
    continueLearning,
    recommendedResources,
    recommendedExperts,
  } = useRecommendations();
  const { activeCount } = usePresence();
  const { stats: gamificationStats, recordDailyActivity } = useGamification();

  // Mark daily activity on dashboard load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  if (typeof window !== "undefined" && !(window as any).__streak_marked) {
    (window as any).__streak_marked = true;
    void recordDailyActivity();
  }

  const allCourses = (() => {
    try {
      const dbList = dbCourses || [];
      const dbIds = new Set(dbList.map((c) => c.id));
      const fallback = staticCourses.filter((c) => !dbIds.has(c.id));
      return [...dbList, ...fallback];
    } catch {
      return staticCourses;
    }
  })();

  const coursesWithProgress = allCourses.map((course) => {
    try {
      const allLessonIds = course.chapters?.flatMap((ch) => ch.lessons?.map((l) => l.id) ?? []) ?? [];
      const liveProgress = getCourseProgress(allLessonIds);
      return { ...course, progress: liveProgress };
    } catch {
      return { ...course, progress: 0 };
    }
  });

  const totalCompleted = coursesWithProgress.filter((c) => c.progress === 100).length;
  const avgScore = coursesWithProgress.length > 0
    ? Math.round(coursesWithProgress.reduce((sum, c) => sum + c.progress, 0) / coursesWithProgress.length)
    : 0;

  return (
    <>
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("dashboard_welcome")}</h1>
            <p className="text-sm text-muted-foreground">{t("dashboard_subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-500">{activeCount} online</span>
            </div>
            <GlobalSearch />
            <button className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full" />
            </button>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* Gamification widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <XpProgressCard stats={gamificationStats} compact />
          <StreakCard stats={gamificationStats} compact />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={BookOpen} label={t("dashboard_courses_active")} value={String(allCourses.length)} subtitle={`${totalCompleted} ${t("dashboard_completed_subtitle")}`} variant="default" />
          <StatsCard icon={Trophy} label={t("dashboard_completed")} value={String(totalCompleted)} subtitle={t("dashboard_completed_subtitle")} variant="accent" />
          <StatsCard icon={Clock} label={t("dashboard_study_time")} value="48h" subtitle={t("dashboard_this_month")} variant="default" />
          <StatsCard icon={TrendingUp} label={t("dashboard_avg_progress")} value={`${avgScore}%`} subtitle={t("dashboard_across_courses")} variant="success" />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Community & Opportunities */}
        <DashboardErrorBoundary fallback={null}>
          <CommunityOpportunities />
        </DashboardErrorBoundary>

        {/* Continue Learning */}
        {continueLearning.length > 0 && (
          <DashboardErrorBoundary fallback={null}>
            <RecommendationBlock titleKey="rec_continue_learning" icon={Play} linkTo="/courses" linkLabelKey="rec_view_all">
              <RecommendedCoursesGrid courses={continueLearning} />
            </RecommendationBlock>
          </DashboardErrorBoundary>
        )}

        {/* Recommended for You */}
        <DashboardErrorBoundary fallback={null}>
          <RecommendationBlock titleKey="rec_recommended_for_you" icon={Sparkles} linkTo="/courses" linkLabelKey="rec_view_all">
            <RecommendedCoursesGrid courses={recommendedCourses} />
          </RecommendationBlock>
        </DashboardErrorBoundary>

        {/* Recommended Resources */}
        <DashboardErrorBoundary fallback={null}>
          <RecommendationBlock titleKey="rec_recommended_resources" icon={FileText} linkTo="/resources" linkLabelKey="rec_view_all">
            <RecommendedResourcesGrid resources={recommendedResources} />
          </RecommendationBlock>
        </DashboardErrorBoundary>

        {/* Recommended Experts */}
        <DashboardErrorBoundary fallback={null}>
          <RecommendationBlock titleKey="rec_recommended_experts" icon={Users} linkTo="/experts" linkLabelKey="rec_view_all">
            <RecommendedExpertsGrid experts={recommendedExperts} />
          </RecommendationBlock>
        </DashboardErrorBoundary>

        {/* Courses + Chart + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">{t("dashboard_your_courses")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coursesWithProgress.map((course) => (
                  <CourseCard key={course.id} {...course} />
                ))}
              </div>
            </div>
            <DashboardErrorBoundary fallback={<ChartFallback />}>
              <Suspense fallback={<ChartFallback />}>
                <ProgressChart />
              </Suspense>
            </DashboardErrorBoundary>
          </div>
          <div>
            <DashboardErrorBoundary fallback={null}>
              <Suspense fallback={<ChartFallback />}>
                <RecentActivity />
              </Suspense>
            </DashboardErrorBoundary>
          </div>
        </div>
      </div>
    </>
  );
});

DashboardContent.displayName = "DashboardContent";

const Index = () => {
  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <DashboardErrorBoundary>
          <DashboardContent />
        </DashboardErrorBoundary>
      </main>
    </div>
  );
};

export default Index;
