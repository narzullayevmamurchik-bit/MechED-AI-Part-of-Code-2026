import { Activity, Clock } from "lucide-react";
import { useAdminActivity } from "@/hooks/useAdminActivity";

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const actionColor = (action: string) => {
  if (action.startsWith("create")) return "text-green-400 bg-green-500/10";
  if (action.startsWith("delete") || action.startsWith("remove")) return "text-destructive bg-destructive/10";
  if (action.startsWith("update") || action.startsWith("edit")) return "text-accent bg-accent/10";
  return "text-muted-foreground bg-muted/40";
};

export const AdminActivityLog = ({ limit = 30 }: { limit?: number }) => {
  const { entries, loading } = useAdminActivity(limit);

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Activity Log</h3>
        <span className="text-xs text-muted-foreground ml-auto">{entries.length} events</span>
      </div>

      {loading && entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Loading activity...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No admin actions recorded yet. New edits will appear here in real time.
        </p>
      ) : (
        <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-secondary/40 transition-colors"
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${actionColor(e.action)}`}>
                {e.action}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  <span className="font-medium">{e.actor_name}</span>{" "}
                  <span className="text-muted-foreground">
                    {e.action.replace(/_/g, " ")} {e.entity_type}
                    {e.entity_label ? ":" : ""}
                  </span>{" "}
                  {e.entity_label && <span className="font-medium">{e.entity_label}</span>}
                </p>
              </div>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
                <Clock className="w-3 h-3" />
                {formatRelative(e.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
