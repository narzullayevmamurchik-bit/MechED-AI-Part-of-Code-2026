import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, Lightbulb, Loader2 } from "lucide-react";
import { useResources, useResourceCategories, ACCEPT_ATTR, detectResourceType, validateFile, MAX_UPLOAD_MB } from "@/hooks/useResources";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const SuggestResourceDialog = () => {
  const { user } = useAuth();
  const { createResource, uploadFile } = useResources();
  const { categories } = useResourceCategories();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({ title: "", description: "", url: "", author: "", category_id: "", language: "en", difficulty: "beginner", type: "link" });

  const handleFile = async (f: File) => {
    const v = validateFile(f); if (!v.ok) { toast.error(v.message); return; }
    setBusy(true); setProgress(0);
    const url = await uploadFile(f, setProgress);
    if (url) setForm((p) => ({ ...p, url, type: detectResourceType(f), title: p.title || f.name.replace(/\.[^.]+$/, "") }));
    setBusy(false);
  };

  const submit = async () => {
    if (!user) { toast.error("Please sign in to suggest a resource"); return; }
    if (!form.title.trim() || !form.url.trim()) { toast.error("Title and URL/file are required"); return; }
    await createResource({ ...form, status: "pending", submitted_by: user.id, category: "general" } as any);
    setOpen(false);
    setForm({ title: "", description: "", url: "", author: "", category_id: "", language: "en", difficulty: "beginner", type: "link" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5"><Lightbulb className="w-4 h-4" /> Suggest a Resource</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Suggest a Resource</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20 w-fit">
            <Upload className="w-3.5 h-3.5" /> {busy ? `Uploading… ${progress}%` : "Upload file (optional)"}
            <input type="file" className="hidden" accept={ACCEPT_ATTR} disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }} />
          </label>
          {busy && <Progress value={progress} className="h-1.5" />}
          <p className="text-[11px] text-muted-foreground">Max {MAX_UPLOAD_MB} MB. Or paste a URL below.</p>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title *" />
          <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="URL *" />
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this resource about?" rows={3} />
          <div className="grid grid-cols-2 gap-2">
            <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author" />
            <Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} placeholder="Language (en/ru/uz)" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit for review"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
