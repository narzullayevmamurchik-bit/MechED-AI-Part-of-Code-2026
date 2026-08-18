import { Check, Circle, X } from "lucide-react";
import type { ApplicationStatus, ApplicationEvent } from "@/hooks/useCareers";
import { cn } from "@/lib/utils";

const STAGES: { key: ApplicationStatus; label: string }[] = [
  { key: "applied", label: "Applied" },
  { key: "screening", label: "Screening" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
];

interface Props {
  status: ApplicationStatus;
  events?: ApplicationEvent[];
  compact?: boolean;
}

export const ApplicationTimeline = ({ status, events, compact = false }: Props) => {
  const isRejected = status === "rejected";
  const isWithdrawn = status === "withdrawn";
  const currentIdx = STAGES.findIndex((s) => s.key === status);
  const reachedIdx = currentIdx >= 0 ? currentIdx : STAGES.length - 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center">
        {STAGES.map((stage, i) => {
          const reached = i <= reachedIdx && !isRejected && !isWithdrawn;
          const isCurrent = i === reachedIdx && !isRejected && !isWithdrawn;
          return (
            <div key={stage.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors",
                    reached ? "bg-accent border-accent text-accent-foreground" : "bg-background border-muted text-muted-foreground",
                    isCurrent && "ring-4 ring-accent/20",
                  )}
                >
                  {reached ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-2.5 h-2.5" />}
                </div>
                <span className={cn("text-[10px] font-medium uppercase tracking-wide", reached ? "text-foreground" : "text-muted-foreground")}>
                  {stage.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-1 -mt-4", i < reachedIdx ? "bg-accent" : "bg-muted")} />
              )}
            </div>
          );
        })}
      </div>

      {(isRejected || isWithdrawn) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <X className="w-3.5 h-3.5 text-rose-500" />
          {isRejected ? "Application closed by employer" : "Withdrawn by you"}
        </div>
      )}

      {!compact && events && events.length > 0 && (
        <div className="mt-3 pl-1 border-l border-border space-y-2">
          {events.map((e) => (
            <div key={e.id} className="pl-3 relative">
              <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-accent" />
              <div className="text-xs">
                <span className="font-medium text-foreground capitalize">{e.status}</span>
                <span className="text-muted-foreground ml-2">{new Date(e.created_at).toLocaleString()}</span>
              </div>
              {e.note && <p className="text-xs text-muted-foreground mt-0.5">{e.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
