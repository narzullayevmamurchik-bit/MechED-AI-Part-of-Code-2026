import { BookOpen, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  progress: number;
  lessons: number;
  duration: string;
  icon: string;
}

export const CourseCard = ({ id, title, description, progress, lessons, duration, icon }: CourseCardProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <div
      onClick={() => navigate(`/course/${id}`)}
      className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:border-accent/30 transition-all group cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground group-hover:text-accent transition-colors">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
          
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {lessons} {t("course_lessons")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {duration}
            </span>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">{t("course_progress")}</span>
              <span className="font-medium text-card-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );
};
