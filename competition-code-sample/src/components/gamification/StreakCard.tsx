import { Card } from "@/components/ui/card";
import { Flame } from "lucide-react";
import type { UserGamification } from "@/hooks/useGamification";

interface Props {
  stats: UserGamification | null;
  compact?: boolean;
}

export function StreakCard({ stats, compact }: Props) {
  const current = stats?.current_streak ?? 0;
  const longest = stats?.longest_streak ?? 0;
  const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
  const nextMilestone = milestones.find((m) => m > current) ?? null;

  if (compact) {
    return (
      <Card className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Flame className={`w-5 h-5 ${current > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Current streak</p>
          <p className="text-lg font-bold">
            {current} {current === 1 ? "day" : "days"} {current >= 3 && "🔥"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Best</p>
          <p className="text-sm font-semibold">{longest}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <Flame className={`w-6 h-6 ${current > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Daily streak</p>
          <p className="text-3xl font-bold leading-none">
            {current} {current === 1 ? "day" : "days"} {current >= 3 && "🔥"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">Longest streak</p>
          <p className="font-bold">{longest} days</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">Next bonus</p>
          <p className="font-bold">{nextMilestone ? `${nextMilestone} days` : "Maxed"}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Earn XP every active day to keep your streak alive. Bonus XP at 3, 7, 14, 30, 60, 90, 180, and 365 days.
      </p>
    </Card>
  );
}
