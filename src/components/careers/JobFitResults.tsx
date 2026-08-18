import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Sparkles, Lightbulb, Target, ArrowUpRight, BookOpen, Zap, FolderKanban } from "lucide-react";
import { Link } from "react-router-dom";
import type { JobFit, JobFitEvidenceRef } from "@/hooks/useCareers";
import { SkillGapsChecklist } from "./SkillGapsChecklist";

interface Props {
  fit: JobFit;
  jobId: string;
}

const scoreTone = (s: number) => {
  if (s >= 75) return "text-emerald-500";
  if (s >= 50) return "text-amber-500";
  return "text-rose-500";
};
const scoreLabel = (s: number) => {
  if (s >= 75) return "Strong fit";
  if (s >= 50) return "Promising fit";
  return "Stretch fit";
};

const refIcon = (type: JobFitEvidenceRef["type"]) => {
  switch (type) {
    case "course": return <BookOpen className="w-3 h-3" />;
    case "scenario": return <Zap className="w-3 h-3" />;
    case "project": return <FolderKanban className="w-3 h-3" />;
    default: return <ArrowUpRight className="w-3 h-3" />;
  }
};

export const JobFitResults = ({ fit, jobId }: Props) => {
  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/40 border border-border">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
            <circle cx="18" cy="18" r="15.9" className="fill-none stroke-muted" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9"
              className={`fill-none ${scoreTone(fit.fit_score)}`}
              strokeWidth="3"
              strokeDasharray={`${Math.max(0, Math.min(100, fit.fit_score))}, 100`}
              strokeLinecap="round"
              stroke="currentColor"
            />
          </svg>
          <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${scoreTone(fit.fit_score)}`}>
            {fit.fit_score}
          </div>
        </div>
        <div className="flex-1">
          <div className={`text-xs font-semibold uppercase tracking-wide ${scoreTone(fit.fit_score)}`}>{scoreLabel(fit.fit_score)}</div>
          <p className="text-sm text-foreground mt-0.5">{fit.fit_summary}</p>
        </div>
      </div>

      {/* Top matching skills with clickable evidence refs */}
      {fit.top_matches?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Why you match
          </h4>
          <div className="space-y-2">
            {fit.top_matches.slice(0, 5).map((m) => (
              <div key={m.skill} className="p-2.5 rounded-lg border border-border bg-background">
                <div className="flex items-start gap-2">
                  <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs capitalize shrink-0">
                    {m.skill.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{m.evidence}</span>
                </div>
                {(m.refs?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 pl-1">
                    {m.refs!.map((r, i) => (
                      <Link
                        key={`${r.type}-${r.id}-${i}`}
                        to={r.href}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 transition-colors group"
                      >
                        {refIcon(r.type)}
                        <span className="truncate max-w-[160px]">{r.label}</span>
                        <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transferable strengths */}
      {fit.transferable_strengths?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" /> Transferable strengths
          </h4>
          <div className="space-y-1.5">
            {fit.transferable_strengths.slice(0, 3).map((m) => (
              <div key={m.skill} className="flex items-start gap-2 text-sm">
                <Badge variant="secondary" className="text-xs capitalize shrink-0">{m.skill.replace(/_/g, " ")}</Badge>
                <span className="text-muted-foreground">{m.why_relevant}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gaps with progress checklist */}
      {fit.gaps?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Skill gaps & learning plan
          </h4>
          <SkillGapsChecklist jobId={jobId} gaps={fit.gaps} />
        </div>
      )}

      {/* Recommended projects */}
      {fit.recommended_projects?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-primary" /> Build these projects to close gaps
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {fit.recommended_projects.slice(0, 3).map((p, i) => (
              <Card key={i} className="p-3 bg-background">
                <div className="text-sm font-medium text-foreground">{p.title}</div>
                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                {p.skills_built?.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {p.skills_built.slice(0, 4).map((s) => (
                      <span key={s} className="text-[10px] uppercase tracking-wide text-accent">#{s.replace(/_/g, "")}</span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {fit.application_tips?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Application tips
          </h4>
          <ul className="space-y-1 text-sm text-foreground/90 list-disc list-inside">
            {fit.application_tips.slice(0, 3).map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};
