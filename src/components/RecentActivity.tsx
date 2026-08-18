import { CheckCircle2, PlayCircle, FileText } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export const RecentActivity = () => {
  const { t } = useLanguage();

  const activities = [
    { icon: CheckCircle2, textKey: "activity_completed_ch5" as const, timeKey: "activity_2h_ago" as const, color: "text-success" },
    { icon: PlayCircle, textKey: "activity_started_fluid" as const, timeKey: "activity_5h_ago" as const, color: "text-accent" },
    { icon: FileText, textKey: "activity_quiz_stress" as const, timeKey: "activity_yesterday" as const, color: "text-primary" },
    { icon: CheckCircle2, textKey: "activity_completed_ch4" as const, timeKey: "activity_2d_ago" as const, color: "text-success" },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-semibold text-card-foreground mb-4">{t("activity_title")}</h3>
      <div className="space-y-4">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-start gap-3">
            <activity.icon className={`w-5 h-5 mt-0.5 ${activity.color}`} />
            <div className="flex-1">
              <p className="text-sm text-card-foreground">{t(activity.textKey)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t(activity.timeKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
