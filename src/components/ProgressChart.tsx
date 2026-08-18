import { useLanguage } from "@/i18n/LanguageContext";

export const ProgressChart = () => {
  const { t } = useLanguage();

  const weeklyData = [
    { day: t("chart_mon"), hours: 2.5 },
    { day: t("chart_tue"), hours: 3.2 },
    { day: t("chart_wed"), hours: 1.8 },
    { day: t("chart_thu"), hours: 4.0 },
    { day: t("chart_fri"), hours: 2.1 },
    { day: t("chart_sat"), hours: 3.5 },
    { day: t("chart_sun"), hours: 1.5 },
  ];
  const maxHours = Math.max(...weeklyData.map((entry) => entry.hours), 1);

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-card-foreground">{t("chart_study_hours")}</h3>
          <p className="text-sm text-muted-foreground">{t("chart_this_week")}</p>
        </div>
        <span className="text-sm font-medium text-accent">18.6 hrs {t("chart_total")}</span>
      </div>
      <div className="grid h-48 grid-cols-7 items-end gap-3">
        {weeklyData.map((entry) => {
          const height = `${Math.max((entry.hours / maxHours) * 100, 14)}%`;

          return (
            <div key={entry.day} className="flex h-full flex-col items-center justify-end gap-2">
              <span className="text-[10px] font-medium text-muted-foreground">{entry.hours}h</span>
              <div className="flex h-full w-full items-end rounded-lg bg-muted/50 p-1">
                <div
                  className="w-full rounded-md bg-gradient-to-t from-primary to-accent transition-[height] duration-500"
                  style={{ height }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{entry.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
