import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { advanceApplication, addApplicationNote, type ApplicationStatus } from "@/hooks/useCareers";
import { toast } from "sonner";

const STAGE_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  currentStatus: ApplicationStatus;
  onUpdated: () => void;
  /** When true, only allows note-add against current status (no stage change). */
  noteOnly?: boolean;
}

export const AdvanceStageDialog = ({ open, onClose, applicationId, currentStatus, onUpdated, noteOnly }: Props) => {
  const [status, setStatus] = useState<ApplicationStatus>(currentStatus);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    let ok = false;
    if (noteOnly || status === currentStatus) {
      ok = await addApplicationNote(applicationId, currentStatus, note);
      if (!ok) toast.error("Add a note before saving");
    } else {
      ok = await advanceApplication(applicationId, status, note);
      if (!ok) toast.error("Failed to update stage");
    }
    setSubmitting(false);
    if (ok) {
      toast.success(noteOnly || status === currentStatus ? "Note added" : `Moved to ${status}`);
      setNote("");
      onUpdated();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{noteOnly ? "Add a note" : "Update stage"}</DialogTitle>
          <DialogDescription>
            {noteOnly
              ? "Capture a thought, interview prep, or recruiter feedback. It will appear on the application timeline."
              : "Move this application to a new stage and optionally attach a note (e.g. recruiter feedback after screening)."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {!noteOnly && (
            <div className="space-y-1.5">
              <Label>New stage</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ApplicationStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="note">Note {!noteOnly && <span className="text-muted-foreground">(optional)</span>}</Label>
            <textarea
              id="note"
              className="w-full min-h-[100px] px-3 py-2 rounded-md bg-background border border-border text-sm"
              placeholder="e.g. Recruiter scheduled phone screen for Friday at 3pm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || (noteOnly && !note.trim())}>
            {submitting ? "Saving..." : noteOnly ? "Add note" : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
