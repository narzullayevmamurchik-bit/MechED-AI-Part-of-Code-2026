import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { TranslationKey } from "@/i18n/translations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, BookOpen, Users, FileText, ArrowRight } from "lucide-react";
import type { Course } from "@/data/courses";
import type { Resource } from "@/data/resources";
import type { Expert } from "@/data/experts";
import { resourceCategoryInfo } from "@/data/resources";

/* ─── Course Card ─── */
function RecommendedCourseCard({ course, progress }: { course: Course & { progress: number }; progress?: number }) {
  const navigate = useNavigate();
  const p = progress ?? course.progress;
  return (
    <div
      onClick={() => navigate(`/course/${course.id}`)}
      className="group bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{course.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
            {course.title}
          </h4>
          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{course.description}</p>
        </div>
      </div>
      {p > 0 && (
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{p}%</span>
          </div>
          <Progress value={p} className="h-1.5" />
        </div>
      )}
      {p === 0 && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          New
        </Badge>
      )}
    </div>
  );
}

/* ─── Resource Card ─── */
function RecommendedResourceCard({ resource }: { resource: Resource }) {
  const { t } = useLanguage();
  const catInfo = resource.categories[0] ? resourceCategoryInfo[resource.categories[0]] : null;
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all block"
    >
      <div className="flex items-center gap-2 mb-2">
        {catInfo && <span className="text-sm">{catInfo.icon}</span>}
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize">{resource.type}</Badge>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize">{resource.difficulty}</Badge>
      </div>
      <h4 className="text-xs font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
        {resource.title}
      </h4>
      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{resource.source || resource.author}</p>
    </a>
  );
}

/* ─── Expert Card ─── */
function RecommendedExpertCard({ expert }: { expert: Expert }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/experts/${expert.id}`)}
      className="group bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{expert.avatar}</span>
        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-card-foreground group-hover:text-primary transition-colors">
            {expert.name}
          </h4>
          <p className="text-[10px] text-muted-foreground">{expert.title} · {expert.institution}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {expert.expertise.slice(0, 3).map((e) => (
          <Badge key={e} variant="secondary" className="text-[9px] px-1.5 py-0">{e}</Badge>
        ))}
      </div>
    </div>
  );
}

/* ─── Section Wrapper ─── */
export function RecommendationBlock({
  titleKey,
  icon: Icon,
  children,
  linkTo,
  linkLabelKey,
}: {
  titleKey: TranslationKey;
  icon: typeof Sparkles;
  children: React.ReactNode;
  linkTo?: string;
  linkLabelKey?: TranslationKey;
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {t(titleKey)}
        </h2>
        {linkTo && linkLabelKey && (
          <button
            onClick={() => navigate(linkTo)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {t(linkLabelKey)} <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/* ─── Exported Grids ─── */
export function RecommendedCoursesGrid({ courses }: { courses: (Course & { progress: number })[] }) {
  if (courses.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {courses.map((c) => (
        <RecommendedCourseCard key={c.id} course={c} />
      ))}
    </div>
  );
}

export function RecommendedResourcesGrid({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {resources.map((r) => (
        <RecommendedResourceCard key={r.id} resource={r} />
      ))}
    </div>
  );
}

export function RecommendedExpertsGrid({ experts }: { experts: Expert[] }) {
  if (experts.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {experts.map((e) => (
        <RecommendedExpertCard key={e.id} expert={e} />
      ))}
    </div>
  );
}
