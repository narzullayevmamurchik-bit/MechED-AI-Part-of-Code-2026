import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Trophy } from "lucide-react";
import type { ScenarioRun } from "@/hooks/useEngineerMode";
import { formatDistanceToNow } from "date-fns";

interface Props {
  runs: ScenarioRun[];
  onDelete: (id: string) => void;
}

export function RunHistory({ runs, onDelete }: Props) {
  if (runs.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        No runs yet — pick a scenario above and prove your engineering chops.
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {runs.map((run) => {
        const title = run.scenario_snapshot?.title ?? "Scenario";
        const score = run.score != null ? Math.round(run.score) : null;
        return (
          <Card key={run.id} className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })} ·{" "}
                <span className="capitalize">{run.level}</span> ·{" "}
                <span className="capitalize">{run.status.replace("_", " ")}</span>
              </p>
            </div>
            {score != null && (
              <Badge variant="outline" className="text-base font-bold">
                {score}
              </Badge>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(run.id)}
              title="Delete run"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
