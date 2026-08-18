import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight, ExternalLink, BookOpen, Target } from "lucide-react";
import { Link } from "react-router-dom";
import {
  fetchSkillGapProgress,
  upsertSkillGapProgress,
  type SkillGapProgress,
  type SkillGapStatus,
  type JobFit,
} from "@/hooks/useCareers";
import { cn } from "@/lib/utils";

interface Props {
  jobId: string;
  gaps: JobFit["gaps"];
}

export const SkillGapsChecklist = ({ jobId, gaps }: Props) => {
  const [progress, setProgress] = useState<Record<string, SkillGapProgress>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    const rows = await fetchSkillGapProgress(jobId);
    const map: Record<string, SkillGapProgress> = {};
    rows.forEach((r) => { map[r.skill.toLowerCase()] = r; });
    setProgress(map);
  };

  useEffect(() => { void load(); }, [jobId]);

  if (!gaps?.length) return null;

  const setStatus = async (skill: string, status: SkillGapStatus) => {
    const ok = await upsertSkillGapProgress(jobId, skill, status);
    if (ok) await load();
  };

  const toggleExpand = (skill: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill); else next.add(skill);
      return next;
    });
  };

  const total = gaps.length;
  const done = gaps.filter((g) => progress[g.skill.toLowerCase()]?.status === "done").length;
  const inProgress = gaps.filter((g) => progress[g.skill.toLowerCase()]?.status === "in_progress").length;
  const completionPct = Math.round((done / total) * 100);

  const cycleStatus = (current: SkillGapStatus | undefined): SkillGapStatus => {
    if (!current || current === "todo") return "in_progress";
    if (current === "in_progress") return "done";
    return "todo";
  };

  return (
    <Card className="p-4 bg-secondary/30 border-amber-500/20">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-500" />
          <h4 className="text-sm font-semibold text-foreground">Skill gaps to close ({done}/{total})</h4>
        </div>
        <div className="text-xs text-muted-foreground">
          {inProgress > 0 && <span className="mr-2">{inProgress} in progress</span>}
          {completionPct}% complete
        </div>
      </div>

      <Progress value={completionPct} className="h-2 mb-4" />

      <div className="space-y-2">
        {gaps.map((g) => {
          const key = g.skill.toLowerCase();
          const cur = progress[key];
          const status: SkillGapStatus = cur?.status ?? "todo";
          const isOpen = expanded.has(key);
          const hasResources = (g.resources?.length ?? 0) > 0 || (g.courses?.length ?? 0) > 0;

          return (
            <div
              key={g.skill}
              className={cn(
                "rounded-lg border bg-background transition-colors",
                status === "done" ? "border-emerald-500/40 bg-emerald-500/5" :
                status === "in_progress" ? "border-amber-500/40" : "border-border",
              )}
            >
              <div className="flex items-start gap-2 p-3">
                <Checkbox
                  checked={status === "done"}
                  onCheckedChange={() => setStatus(g.skill, status === "done" ? "todo" : "done")}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => hasResources && toggleExpand(key)}
                      className={cn(
                        "text-sm font-medium capitalize text-left",
                        status === "done" ? "line-through text-muted-foreground" : "text-foreground",
                        hasResources && "hover:text-accent cursor-pointer",
                      )}
                    >
                      {hasResources && (isOpen ? <ChevronDown className="w-3 h-3 inline mr-1" /> : <ChevronRight className="w-3 h-3 inline mr-1" />)}
                      {g.skill.replace(/_/g, " ")}
                    </button>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase tracking-wide cursor-pointer",
                        status === "done" && "border-emerald-500/50 text-emerald-600",
                        status === "in_progress" && "border-amber-500/50 text-amber-600",
                      )}
                      onClick={() => setStatus(g.skill, cycleStatus(status))}
                    >
                      {status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{g.how_to_close}</p>
                </div>
              </div>

              {isOpen && hasResources && (
                <div className="px-3 pb-3 pt-1 border-t border-border space-y-2">
                  {(g.courses?.length ?? 0) > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Courses on platform
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {g.courses!.map((c) => (
                          <Button key={c.id} asChild size="sm" variant="outline" className="h-7 text-xs">
                            <Link to={c.href}>{c.title}</Link>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  {(g.resources?.length ?? 0) > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Suggested resources</div>
                      <div className="space-y-1">
                        {g.resources!.map((r) => (
                          <a
                            key={r.id}
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-2 text-xs px-2 py-1.5 rounded hover:bg-secondary/60 group"
                          >
                            <span className="text-foreground group-hover:text-accent truncate">{r.title}</span>
                            <span className="flex items-center gap-1 text-muted-foreground shrink-0">
                              {r.difficulty && <Badge variant="secondary" className="text-[9px] px-1.5">{r.difficulty}</Badge>}
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
