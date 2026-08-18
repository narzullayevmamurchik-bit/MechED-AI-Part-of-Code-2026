import { Card } from "@/components/ui/card";
import { Check, Lock, Star } from "lucide-react";

export interface CareerStage {
  id: string;
  stage_order: number;
  slug: string;
  title: string;
  description: string;
  xp_reward: number;
}

interface Props {
  stages: CareerStage[];
  completed: string[];
  currentSlug: string | null;
  onPick: (slug: string) => void;
}

export function CareerTrack({ stages, completed, currentSlug, onPick }: Props) {
  return (
    <div className="space-y-2">
      {stages.map((s) => {
        const done = completed.includes(s.slug);
        const active = currentSlug === s.slug;
        const locked = !done && !active && !completed.includes(stages[s.stage_order - 2]?.slug || "") && s.stage_order > 1;
        return (
          <Card
            key={s.id}
            onClick={() => !locked && onPick(s.slug)}
            className={`p-3 flex items-center gap-3 transition-all ${
              locked ? "opacity-50" : "cursor-pointer hover:border-primary/40"
            } ${active ? "border-primary bg-primary/5" : ""}`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                done
                  ? "bg-primary text-primary-foreground"
                  : active
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? <Check className="w-4 h-4" /> : locked ? <Lock className="w-4 h-4" /> : s.stage_order}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{s.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Star className="w-3 h-3" /> {s.xp_reward}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
