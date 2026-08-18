import { cn } from "@/lib/utils";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { ProcessGroup } from "@/data/metallurgyProcess";

interface Props {
  groups: ProcessGroup[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProcessFlowMap({ groups, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-3">
      {groups.map((group, gi) => (
        <div key={group.id}>
          {/* Group connector arrow */}
          {gi > 0 && (
            <div className="flex justify-center py-1">
              <div className="flex flex-col items-center text-muted-foreground/40">
                <div className="w-px h-4 bg-border" />
                <ChevronRight className="w-5 h-5 rotate-90" />
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card/50 p-4">
            {/* Group title */}
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
              {group.title}
            </p>

            {/* Stage nodes */}
            <div className="flex flex-wrap items-center gap-2">
              {group.stages.map((stage, si) => (
                <div key={stage.id} className="flex items-center gap-2">
                  {si > 0 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                  )}
                  <button
                    onClick={() => onSelect(stage.id)}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-all duration-200 hover:scale-[1.03]",
                      selectedId === stage.id
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary/30"
                        : "border-border bg-card hover:border-primary/40 hover:bg-accent"
                    )}
                  >
                    <span className="text-2xl">{stage.icon}</span>
                    <div className="min-w-0">
                      <p className={cn(
                        "text-sm font-semibold truncate transition-colors",
                        selectedId === stage.id ? "text-primary" : "text-foreground group-hover:text-primary"
                      )}>
                        {stage.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                        {stage.processes.slice(0, 2).join(" · ")}
                      </p>
                    </div>

                    {/* Active indicator */}
                    {selectedId === stage.id && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
