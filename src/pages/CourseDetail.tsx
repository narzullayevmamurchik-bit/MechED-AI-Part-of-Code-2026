import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { useCourse, NormalizedLesson } from "@/hooks/useCourses";
import { courses as staticCourses, Lesson } from "@/data/courses";
import { useProgress } from "@/hooks/useProgress";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import {
  RecommendationBlock,
  RecommendedResourcesGrid,
  RecommendedExpertsGrid,
} from "@/components/RecommendationSection";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, BookOpen, Clock, Video, FileText, HelpCircle, CheckCircle2, Circle, Trophy, X, Download, Play, Loader2, Sparkles, Users } from "lucide-react";
import ReactMarkdown from "react-markdown";

type AnyLesson = Lesson | NormalizedLesson;

const typeIcon = {
  video: Video,
  reading: FileText,
  quiz: HelpCircle,
};

const getLessonVideoUrl = (l: AnyLesson) => "videoUrl" in l ? l.videoUrl : ("video_url" in l ? (l as any).video_url : undefined);
const getLessonPdfUrl = (l: AnyLesson) => "pdfUrl" in l ? l.pdfUrl : ("pdf_url" in l ? (l as any).pdf_url : undefined);
const getLessonContentMd = (l: AnyLesson): string | undefined => "contentMd" in l ? (l as NormalizedLesson).contentMd : ((l as any).content_md ?? undefined);

const LessonViewer = ({
  lesson,
  isCompleted,
  onClose,
  onToggleComplete,
}: {
  lesson: AnyLesson;
  isCompleted: boolean;
  onClose: () => void;
  onToggleComplete: () => void;
}) => {
  const videoUrl = getLessonVideoUrl(lesson);
  const pdfUrl = getLessonPdfUrl(lesson);
  const contentMd = getLessonContentMd(lesson);
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          {lesson.type === "video" ? (
            <Video className="w-5 h-5 text-accent" />
          ) : (
            <FileText className="w-5 h-5 text-accent" />
          )}
          <div>
            <h2 className="font-semibold text-foreground">{lesson.title}</h2>
            <p className="text-xs text-muted-foreground">{lesson.duration} · {lesson.type === "video" ? t("course_video_lesson") : t("course_reading_material")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleComplete}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isCompleted
                ? "bg-success/20 text-success"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isCompleted ? t("course_completed_label") : t("course_mark_complete")}
          </button>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="w-4 h-4" />
              {t("course_download_pdf")}
            </a>
          )}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {lesson.type === "video" && videoUrl ? (
          <div className="w-full h-full flex items-center justify-center bg-black/50 p-8">
            <div className="w-full max-w-5xl aspect-video">
              <iframe
                src={videoUrl}
                title={lesson.title}
                className="w-full h-full rounded-xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        ) : contentMd ? (
          <div className="w-full h-full overflow-auto bg-background">
            <article className="max-w-3xl mx-auto px-8 py-10 prose prose-sm dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground/90 prose-code:text-accent prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-secondary prose-pre:border prose-pre:border-border prose-a:text-accent prose-strong:text-foreground prose-li:text-foreground/90">
              <ReactMarkdown>{contentMd}</ReactMarkdown>
            </article>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            title={lesson.title}
            className="w-full h-full border-none"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t("course_no_content")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { data: dbCourse, isLoading } = useCourse(courseId);
  const staticCourse = staticCourses.find((c) => c.id === courseId);
  const course = dbCourse || staticCourse;
  const { t } = useLanguage();
  const { getRelatedResources, getRelatedExperts } = useRecommendations();
  const { trackCourseView, trackLessonComplete } = useActivityTracker();

  const [activeLesson, setActiveLesson] = useState<AnyLesson | null>(null);
  const { isCompleted, toggleLesson, getCompletedCount, getCourseProgress } = useProgress();

  // Track course view
  useEffect(() => {
    if (courseId) trackCourseView(courseId);
  }, [courseId, trackCourseView]);

  const relatedResources = courseId ? getRelatedResources(courseId) : [];
  const relatedExperts = courseId ? getRelatedExperts(courseId) : [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">{t("course_not_found")}</h2>
            <button onClick={() => navigate("/")} className="mt-4 text-sm text-accent hover:underline">
              {t("course_back_dashboard")}
            </button>
          </div>
        </main>
      </div>
    );
  }

  const allLessonIds = course.chapters.flatMap((ch) => ch.lessons.map((l) => l.id));
  const totalLessons = allLessonIds.length;
  const completedLessons = getCompletedCount(allLessonIds);
  const progressPercent = getCourseProgress(allLessonIds);

  const quizzes = "quizzes" in course ? course.quizzes : [];

  const typeLabels: Record<string, string> = {
    video: t("course_video"),
    reading: t("course_reading"),
    quiz: t("course_quiz"),
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("course_back_dashboard")}
          </button>
          <div className="flex items-start gap-4">
            <div className="text-4xl">{course.icon}</div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{course.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
              <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> {totalLessons} {t("course_lessons")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {course.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" /> {completedLessons}/{totalLessons} {t("course_completed_count")}
                </span>
              </div>
              <div className="mt-3 max-w-md">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{t("course_overall_progress")}</span>
                  <span className="font-medium text-foreground">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2.5" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <Tabs defaultValue="chapters" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="chapters">{t("course_chapters_lessons")}</TabsTrigger>
              {quizzes.length > 0 && <TabsTrigger value="quizzes">{t("course_quizzes")}</TabsTrigger>}
            </TabsList>

            <TabsContent value="chapters">
              <Accordion type="multiple" defaultValue={course.chapters.map((c) => c.id)} className="space-y-3">
                {(() => {
                  let globalLessonIndex = 0;
                  return course.chapters.map((chapter, chIdx) => {
                    const chLessonIds = chapter.lessons.map((l) => l.id);
                    const chCompleted = getCompletedCount(chLessonIds);
                    return (
                      <AccordionItem key={chapter.id} value={chapter.id} className="border rounded-xl bg-card px-5">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold text-foreground">
                              {chIdx + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-card-foreground">{chapter.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {chCompleted}/{chapter.lessons.length} {t("course_lessons_completed")}
                              </p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {chapter.lessons.map((lesson) => {
                              globalLessonIndex++;
                              const lessonNum = globalLessonIndex;
                              const Icon = typeIcon[lesson.type as keyof typeof typeIcon] || FileText;
                              const videoUrl = getLessonVideoUrl(lesson);
                              const pdfUrl = getLessonPdfUrl(lesson);
                              const contentMd = getLessonContentMd(lesson);
                              const hasContent = videoUrl || pdfUrl || contentMd;
                              const completed = isCompleted(lesson.id);
                              return (
                                <div
                                  key={lesson.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                                    hasContent ? "hover:bg-accent/10 group" : "opacity-60"
                                  }`}
                                >
                                  <span className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                                    {lessonNum}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleLesson(lesson.id);
                                    }}
                                    className="shrink-0"
                                    title={completed ? t("course_completed_label") : t("course_mark_complete")}
                                  >
                                    {completed ? (
                                      <CheckCircle2 className="w-5 h-5 text-success" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-muted-foreground hover:text-accent transition-colors" />
                                    )}
                                  </button>
                                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <button
                                    onClick={() => hasContent && setActiveLesson(lesson)}
                                    className="flex-1 min-w-0 text-left cursor-pointer"
                                  >
                                    <p className="text-xs text-muted-foreground">
                                      {t("course_lesson")} {lessonNum} · {typeLabels[lesson.type] || lesson.type}
                                    </p>
                                    <p className={`text-sm font-medium transition-colors ${completed ? "text-muted-foreground line-through" : "text-card-foreground group-hover:text-accent"}`}>
                                      {lesson.title}
                                    </p>
                                  </button>
                                  {hasContent && (
                                    <button
                                      onClick={() => setActiveLesson(lesson)}
                                      className="flex items-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      {lesson.type === "video" ? <Play className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                      {t("open")}
                                    </button>
                                  )}
                                  <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  });
                })()}
              </Accordion>
            </TabsContent>

            {quizzes.length > 0 && (
              <TabsContent value="quizzes">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-accent/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            <HelpCircle className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-card-foreground">{quiz.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {quiz.questions} {t("course_questions")} · {quiz.duration}
                            </p>
                          </div>
                        </div>
                        {quiz.completed && (
                          <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                        )}
                      </div>
                      {quiz.completed && quiz.score !== undefined ? (
                        <div className="mt-4 flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-accent" />
                          <span className="text-sm font-semibold text-foreground">{t("course_score")}: {quiz.score}%</span>
                          <Progress value={quiz.score} className="h-2 flex-1 ml-2" />
                        </div>
                      ) : (
                        <button className="mt-4 w-full py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
                          {t("course_start_quiz")}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>

          {/* Related Content */}
          <div className="space-y-6 mt-8">
            {relatedResources.length > 0 && (
              <RecommendationBlock titleKey="rec_related_resources" icon={FileText} linkTo="/resources" linkLabelKey="rec_view_all">
                <RecommendedResourcesGrid resources={relatedResources} />
              </RecommendationBlock>
            )}
            {relatedExperts.length > 0 && (
              <RecommendationBlock titleKey="rec_related_experts" icon={Users} linkTo="/experts" linkLabelKey="rec_view_all">
                <RecommendedExpertsGrid experts={relatedExperts} />
              </RecommendationBlock>
            )}
          </div>
        </div>
      </main>

      {activeLesson && (
        <LessonViewer
          lesson={activeLesson}
          isCompleted={isCompleted(activeLesson.id)}
          onClose={() => setActiveLesson(null)}
          onToggleComplete={() => toggleLesson(activeLesson.id)}
        />
      )}
    </div>
  );
};

export default CourseDetail;
