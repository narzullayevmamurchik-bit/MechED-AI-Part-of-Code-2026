import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSpecializations } from "@/hooks/useExpertsDb";
import { Sparkles } from "lucide-react";

export type PromoteTarget = {
  user_id: string;
  display_name: string | null;
  email: string;
  is_expert: boolean;
};

export const PromoteToExpertDialog = ({
  target,
  initialSpecializationIds = [],
  onClose,
  onConfirm,
}: {
  target: PromoteTarget | null;
  initialSpecializationIds?: string[];
  onClose: () => void;
  onConfirm: (specIds: string[], meta: { title: string; institution: string; bio: string }) => Promise<void>;
}) => {
  const { specializations, loading } = useSpecializations();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSpecializationIds));
  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (target) {
      setSelected(new Set(initialSpecializationIds));
      setTitle(""); setInstitution(""); setBio("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.user_id]);

  const toggle = (id: string) =>
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const canSave = useMemo(() => selected.size > 0, [selected]);

  const handleSave = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      await onConfirm(Array.from(selected), { title, institution, bio });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {target?.is_expert ? "Update Expert profile" : "Promote to Expert"}
          </DialogTitle>
          <DialogDescription>
            {target?.display_name || target?.email}
            {target?.is_expert ? " — already an Expert. Update specializations below." : " will get an Expert dashboard, inbox and student messaging."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Specialization fields *</Label>
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : specializations.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No specializations defined yet. Add some in <strong>Admin → Experts → Specializations</strong>.
              </p>
            ) : (
              <ScrollArea className="max-h-40">
                <div className="flex flex-wrap gap-1.5 pr-3">
                  {specializations.map((s) => (
                    <Badge
                      key={s.id}
                      variant={selected.has(s.id) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggle(s.id)}
                    >
                      {s.icon} {s.name}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {!target?.is_expert && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Professor, PhD…" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Institution</Label>
                  <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="University / Company" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Short bio (optional)</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave || busy}>
            {busy ? "Saving…" : target?.is_expert ? "Update Expert" : "Promote to Expert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
