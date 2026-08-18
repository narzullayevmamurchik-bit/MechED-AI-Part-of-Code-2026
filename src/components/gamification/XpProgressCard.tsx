import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Zap } from "lucide-react";
import { xpProgress, type UserGamification } from "@/hooks/useGamification";

interface Props {
  stats: UserGamification | null;
  compact?: boolean;
}

export function XpProgressCard({ stats, compact }: Props) {
  const totalXp = stats?.total_xp ?? 0;
  const level = stats?.level ?? 1;
  const { current, next, percent } = xpProgress(totalXp, level);

  if (compact) {
    return (
      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Level</p>
              <p className="text-lg font-bold">{level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total XP</p>
            <p className="text-lg font-bold text-primary">{totalXp.toLocaleString()}</p>
          </div>
        </div>
        <Progress value={percent} />
        <p className="text-[11px] text-muted-foreground text-right">
          {current} / {next} XP to Lvl {level + 1}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Level</p>
            <p className="text-3xl font-bold leading-none">{level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
            <Zap className="w-3.5 h-3.5" /> Total XP
          </p>
          <p className="text-3xl font-bold text-primary leading-none">
            {totalXp.toLocaleString()}
          </p>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Lvl {level}</span>
          <span>Lvl {level + 1}</span>
        </div>
        <Progress value={percent} />
        <p className="text-xs text-muted-foreground mt-1.5 text-center">
          {current} / {next} XP
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Learner</p>
          <p className="text-sm font-bold">{stats?.learner_xp ?? 0}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Engineer</p>
          <p className="text-sm font-bold">{stats?.engineer_xp ?? 0}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Contributor</p>
          <p className="text-sm font-bold">{stats?.contributor_xp ?? 0}</p>
        </div>
      </div>
    </Card>
  );
}
