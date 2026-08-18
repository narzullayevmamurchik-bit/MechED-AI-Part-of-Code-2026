import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock } from "lucide-react";
import type { Badge, UserBadge } from "@/hooks/useGamification";

interface Props {
  catalog: Badge[];
  earned: UserBadge[];
}

export function BadgesGrid({ catalog, earned }: Props) {
  const earnedIds = new Set(earned.map((b) => b.badge_id));
  const grouped = catalog.reduce<Record<string, Badge[]>>((acc, b) => {
    (acc[b.category] = acc[b.category] || []).push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold capitalize mb-3 text-muted-foreground">
            {category} ({items.filter((b) => earnedIds.has(b.id)).length}/{items.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((badge) => {
              const isEarned = earnedIds.has(badge.id);
              return (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <Card
                      className={`p-4 flex flex-col items-center gap-2 text-center transition-all cursor-help ${
                        isEarned
                          ? "border-primary/40 bg-primary/5"
                          : "opacity-50 grayscale hover:opacity-75"
                      }`}
                    >
                      <div className="text-3xl">{isEarned ? badge.icon : "🔒"}</div>
                      <p className="text-xs font-semibold leading-tight line-clamp-2">
                        {badge.name}
                      </p>
                      {badge.xp_reward > 0 && (
                        <p className="text-[10px] text-muted-foreground">+{badge.xp_reward} XP</p>
                      )}
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold">{badge.name}</p>
                    <p className="text-xs">{badge.description}</p>
                    {!isEarned && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Locked
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
