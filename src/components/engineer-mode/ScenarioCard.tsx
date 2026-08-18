import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Target, ArrowRight, Lock } from "lucide-react";
import type { Scenario, ScenarioLevel } from "@/hooks/useEngineerMode";

const levelStyles: Record<ScenarioLevel, string> = {
  beginner: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  intermediate: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  advanced: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

interface Props {
  scenario: Scenario;
  onStart: (scenario: Scenario) => void;
  lockedReason?: string;
}

export function ScenarioCard({ scenario, onStart, lockedReason }: Props) {
  const locked = !!lockedReason;
  return (
    <Card className={`p-5 flex flex-col gap-3 transition-all ${locked ? "opacity-70" : "hover:shadow-lg hover:border-primary/40"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{scenario.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{scenario.role}</p>
        </div>
        <Badge variant="outline" className={levelStyles[scenario.difficulty]}>
          {scenario.difficulty}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-3">
        {scenario.problem_statement}
      </p>

      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {scenario.estimated_minutes} min
        </span>
        <span className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" />
          {scenario.steps?.length ?? 0} decisions
        </span>
        <span className="capitalize">{scenario.domain}</span>
      </div>

      {locked ? (
        <Button disabled className="mt-1 gap-2" variant="secondary">
          <Lock className="w-4 h-4" />
          {lockedReason}
        </Button>
      ) : (
        <Button onClick={() => onStart(scenario)} className="mt-1 gap-2">
          Start scenario
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </Card>
  );
}

