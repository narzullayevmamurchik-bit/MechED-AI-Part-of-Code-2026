import { useState } from "react";
import { useCollaboration, type CollabProject } from "@/hooks/useCollaboration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Globe, Users, MapPin, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  project: CollabProject;
  onOpen: (id: string) => void;
}

export const ProjectCard = ({ project, onOpen }: Props) => {
  const { user, myMemberIds, requestJoin } = useCollaboration();
  const [open, setOpen] = useState(false);
  const [desiredRole, setDesiredRole] = useState(project.roles[0] ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const isMine = project.created_by === user?.id;
  const isMember = myMemberIds.has(project.id);

  const submit = async () => {
    if (!desiredRole.trim()) {
      toast.error("Pick a role");
      return;
    }
    setBusy(true);
    try {
      await requestJoin(project.id, desiredRole, message);
      toast.success("Join request sent");
      setOpen(false);
    } catch (e) {
      const m = e instanceof Error ? e.message : "Failed";
      toast.error(m.includes("duplicate") ? "You already requested to join" : m);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-primary/40 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold text-primary mb-1">
            <Globe className="w-3 h-3" /> {project.topic}
          </div>
          <h3 className="text-base font-semibold text-foreground line-clamp-2">{project.title}</h3>
        </div>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {project.roles.slice(0, 4).map((r) => (
          <span key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {r}
          </span>
        ))}
        {project.roles.length > 4 && (
          <span className="text-[11px] text-muted-foreground">+{project.roles.length - 4}</span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {project.country_focus && (
          <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {project.country_focus}</span>
        )}
        <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> Up to {project.max_team_size}</span>
      </div>
      <div className="flex gap-2 mt-auto pt-2">
        {isMember || isMine ? (
          <Button size="sm" className="flex-1" onClick={() => onOpen(project.id)}>
            Open workspace <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onOpen(project.id)}>
              View
            </Button>
            <Button size="sm" className="flex-1" onClick={() => setOpen(true)}>
              Request to join
            </Button>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join "{project.title}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Desired role</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={desiredRole}
                onChange={(e) => setDesiredRole(e.target.value)}
              >
                {project.roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Why you'd be a great fit</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={500} placeholder="Briefly share your background and motivation..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
