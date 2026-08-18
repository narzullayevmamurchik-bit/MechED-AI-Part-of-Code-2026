import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { askExpert, uploadQuestionAttachment, QuestionPriority } from "@/hooks/useExpertQA";
import { z } from "zod";

const schema = z.object({
  title: z.string().trim().min(5, "Title too short").max(200),
  body: z.string().trim().min(10, "Please describe your question").max(5000),
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  expertId: string;
  expertName: string;
  onAsked?: () => void;
}

const CATEGORIES = [
  "technical", "research", "career", "scholarship", "project", "thesis", "other",
];

export const AskExpertDialog = ({ open, onOpenChange, expertId, expertName, onAsked }: Props) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("technical");
  const [priority, setPriority] = useState<QuestionPriority>("normal");
  const [isPublic, setIsPublic] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle(""); setBody(""); setCategory("technical"); setPriority("normal");
    setIsPublic(false); setFiles([]);
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    const parsed = schema.safeParse({ title, body });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    try {
      const attachments = [];
      for (const f of files) {
        attachments.push(await uploadQuestionAttachment(f, user.id));
      }
      await askExpert({
        expert_id: expertId, title: title.trim(), body: body.trim(),
        category, priority, is_public: isPublic, attachments,
      }, user.id);
      toast.success(`Question sent to ${expertName}`);
      reset();
      onOpenChange(false);
      onAsked?.();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to send question");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ask {expertName}</DialogTitle>
          <DialogDescription>
            Send a question, attach files, and choose whether it's private or visible to all students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short question title" maxLength={200} />
          </div>

          <div>
            <Label>Question</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe your question in detail…" rows={5} maxLength={5000} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as QuestionPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Attachments</Label>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm cursor-pointer hover:bg-secondary/70 w-fit">
              <Upload className="w-4 h-4" />
              <span>Add files</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const list = Array.from(e.target.files ?? []);
                  setFiles((prev) => [...prev, ...list]);
                  e.target.value = "";
                }}
              />
            </label>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-xs bg-secondary/50 rounded px-2 py-1">
                    <span className="truncate">{f.name}</span>
                    <button type="button" onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}>
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div>
              <p className="text-sm font-medium text-foreground">Public question</p>
              <p className="text-xs text-muted-foreground">Visible to all students once answered.</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Send Question
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
