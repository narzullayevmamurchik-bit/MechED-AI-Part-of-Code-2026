import { useCollaboration } from "@/hooks/useCollaboration";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const AdminProjectApproval = () => {
  const { pendingProjects, approveProject, rejectProject, loading } = useCollaboration();
  const [busy, setBusy] = useState<string | null>(null);

  if (loading) return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
  if (pendingProjects.length === 0) {
    return <p className="text-sm text-muted-foreground">No projects waiting for review.</p>;
  }

  return (
    <div className="space-y-3">
      {pendingProjects.map((p) => (
        <div key={p.id} className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase font-semibold text-primary">{p.topic}</p>
          <h4 className="text-base font-semibold text-foreground">{p.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {p.roles.map((r) => (
              <span key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{r}</span>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={async () => {
                setBusy(p.id);
                try {
                  await approveProject(p.id);
                  toast.success("Approved");
                } catch (e) {
                  toast.error("Failed");
                } finally {
                  setBusy(null);
                }
              }}
              disabled={busy === p.id}
            >
              <Check className="w-4 h-4 mr-1" /> Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const reason = prompt("Rejection reason?");
                if (!reason) return;
                setBusy(p.id);
                try {
                  await rejectProject(p.id, reason);
                  toast.success("Rejected");
                } catch (e) {
                  toast.error("Failed");
                } finally {
                  setBusy(null);
                }
              }}
              disabled={busy === p.id}
            >
              <X className="w-4 h-4 mr-1" /> Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
