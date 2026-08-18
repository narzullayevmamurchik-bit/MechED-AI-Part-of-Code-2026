import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSelfChecks, ALLOWED_SELF_CHECK_EXT, OCR_TRIGGER_EXT, MAX_SELF_CHECK_MB, type SelfCheck } from "@/hooks/useSelfChecks";
import { AIFeedbackBlock } from "@/components/assignments/AIFeedbackBlock";
import { OcrReviewPanel } from "@/components/ocr/OcrReviewPanel";
import { runOcrPipeline } from "@/lib/runOcrPipeline";
import {
  Upload, Loader2, Sparkles, FileText, CheckCircle2, AlertTriangle, Download, Trash2, Award, TrendingUp, ScanLine,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const getExt = (n: string) => n.toLowerCase().split(".").pop() || "";

export const SelfCheckPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { items, loading, refetch } = useSelfChecks();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const stats = (() => {
    const graded = items.filter((i) => i.status === "graded" && i.ai_score !== null);
    const avg = graded.length ? Math.round(graded.reduce((s, i) => s + (i.ai_score || 0), 0) / graded.length) : 0;
    const last3 = graded.slice(0, 3);
    const prev3 = graded.slice(3, 6);
    const trend =
      last3.length && prev3.length
        ? Math.round(
            last3.reduce((s, i) => s + (i.ai_score || 0), 0) / last3.length -
              prev3.reduce((s, i) => s + (i.ai_score || 0), 0) / prev3.length,
          )
        : 0;
    return { total: items.length, graded: graded.length, avg, trend };
  })();

  const validate = (f: File): string | null => {
    const ext = getExt(f.name);
    if (!ALLOWED_SELF_CHECK_EXT.includes(ext)) {
      if (ext === "djvu") return "DJVU is not supported. Convert to PDF first.";
      return `Unsupported file type .${ext}. Allowed: ${ALLOWED_SELF_CHECK_EXT.join(", ")}`;
    }
    if (f.size > MAX_SELF_CHECK_MB * 1024 * 1024) return `File too large. Max ${MAX_SELF_CHECK_MB} MB`;
    return null;
  };

  const onPickFile = (f: File | null) => {
    if (!f) return;
    const err = validate(f);
    if (err) {
      toast({ title: "Invalid file", description: err, variant: "destructive" });
      return;
    }
    setFile(f);
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onPickFile(e.dataTransfer.files?.[0] || null);
  }, []);

  const submit = async () => {
    if (!user) return;
    if (!file && !notes.trim()) {
      toast({ title: "Nothing to check", description: "Upload a file or paste notes", variant: "destructive" });
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      let filePath: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { data: signed, error: sErr } = await supabase.storage.from("self-checks").createSignedUploadUrl(path);
        if (sErr) throw sErr;
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", signed.signedUrl);
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
          };
          xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload ${xhr.status}`)));
          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.send(file);
        });
        filePath = path;
        fileName = file.name;
        fileSize = file.size;
      }

      const needsOcr = !!file && OCR_TRIGGER_EXT.includes(getExt(file.name));
      const { data: row, error } = await supabase
        .from("self_checks")
        .insert({
          user_id: user.id,
          title: title.trim() || "Self-Check",
          notes: notes.trim() || null,
          file_path: filePath,
          file_name: fileName,
          file_size: fileSize,
          status: needsOcr ? "pending" : "grading",
        })
        .select()
        .single();
      if (error) throw error;

      if (needsOcr && file) {
        toast({ title: "Uploaded", description: "Running AI OCR on your document…" });
        // Run preprocessing + OCR; attach job id to self_check
        const { jobId } = await runOcrPipeline({
          file,
          userId: user.id,
          entityType: "self_check",
          entityId: row.id,
          bucket: "self-checks",
          pathPrefix: user.id,
          onProgress: (p) => setProgress(p),
        });
        await supabase.from("self_checks").update({ ocr_job_id: jobId }).eq("id", row.id);
      } else {
        toast({ title: "Uploaded", description: "AI is reviewing your work…" });
        void supabase.functions.invoke("self-check-grade", { body: { self_check_id: row.id } }).then(({ error: gErr }) => {
          if (gErr) toast({ title: "AI review failed", description: gErr.message, variant: "destructive" });
        });
      }

      setTitle(""); setNotes(""); setFile(null); setProgress(0);
      void refetch();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const remove = async (item: SelfCheck) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    if (item.file_path) await supabase.storage.from("self-checks").remove([item.file_path]);
    await supabase.from("self_checks").delete().eq("id", item.id);
    void refetch();
  };

  const download = async (item: SelfCheck) => {
    if (!item.file_path) return;
    const { data, error } = await supabase.storage.from("self-checks").download(item.file_path);
    if (error) {
      toast({ title: "Download failed", description: error.message, variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url; a.download = item.file_name || "file"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile icon={FileText} label="Total uploads" value={stats.total} />
        <StatTile icon={CheckCircle2} label="AI-reviewed" value={stats.graded} />
        <StatTile icon={Award} label="Avg score" value={stats.graded ? `${stats.avg}/100` : "—"} />
        <StatTile
          icon={TrendingUp}
          label="Trend"
          value={stats.graded >= 6 ? `${stats.trend > 0 ? "+" : ""}${stats.trend}` : "—"}
          tone={stats.trend > 0 ? "good" : stats.trend < 0 ? "bad" : undefined}
        />
      </div>

      {/* Upload */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-foreground">Check My Work</h2>
          <span className="text-xs text-muted-foreground">— upload any document and get instant engineering AI review</span>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional) — e.g. Heat Treatment Report v2"
          className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent"
        />

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
            dragOver ? "border-accent bg-accent/5" : "border-border hover:border-accent/50 hover:bg-secondary/30",
          )}
        >
          <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-foreground font-medium">
            {file ? file.name : "Drag & drop or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOCX, PPTX, images · max {MAX_SELF_CHECK_MB} MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_SELF_CHECK_EXT.map((e) => "." + e).join(",")}
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] || null)}
          />
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Optional notes or paste text content here…"
          className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />

        {uploading && progress > 0 && (
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={submit}
            disabled={uploading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {uploading ? `Uploading ${progress}%` : "Check My Work"}
          </button>
        </div>
      </div>

      {/* History */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Submission history</h3>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
            No self-checks yet. Upload something above to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(item.created_at), "MMM d, h:mm a")}
                      {item.file_name && ` · ${item.file_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusPill status={item.status} score={item.ai_score} />
                    {item.file_path && (
                      <button onClick={() => download(item)} className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground" title="Download">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => remove(item)} className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-destructive" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {item.ocr_job_id && !item.ai_feedback && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                      <ScanLine className="w-3.5 h-3.5" /> OCR review — edit the recognized text if needed, then run AI grading.
                    </div>
                    <OcrReviewPanel
                      jobId={item.ocr_job_id}
                      bucket="self-checks"
                      onUseText={async (mergedText, confidence) => {
                        await supabase.from("self_checks").update({
                          ocr_text: mergedText,
                          ocr_confidence: confidence,
                          status: "grading",
                        }).eq("id", item.id);
                        toast({ title: "Starting AI review", description: "Grading your work…" });
                        void supabase.functions.invoke("self-check-grade", { body: { self_check_id: item.id } });
                        void refetch();
                      }}
                    />
                  </div>
                )}
                {item.ai_feedback && <AIFeedbackBlock feedback={item.ai_feedback} score={item.ai_score} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatTile = ({ icon: Icon, label, value, tone }: { icon: any; label: string; value: any; tone?: "good" | "bad" }) => (
  <div className="bg-card border border-border rounded-xl p-3">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="w-3.5 h-3.5" />{label}</div>
    <p className={cn("text-xl font-bold mt-1", tone === "good" && "text-success", tone === "bad" && "text-destructive", !tone && "text-foreground")}>{value}</p>
  </div>
);

const StatusPill = ({ status, score }: { status: SelfCheck["status"]; score: number | null }) => {
  if (status === "graded")
    return (
      <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-success/20 text-success text-xs font-semibold">
        <Award className="w-3 h-3" /> {score ?? 0}/100
      </span>
    );
  if (status === "grading")
    return (
      <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent/20 text-accent text-xs font-semibold">
        <Loader2 className="w-3 h-3 animate-spin" /> Reviewing
      </span>
    );
  if (status === "error")
    return (
      <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/20 text-destructive text-xs font-semibold">
        <AlertTriangle className="w-3 h-3" /> Error
      </span>
    );
  return <span className="px-2 py-1 rounded-md bg-secondary text-muted-foreground text-xs">Pending</span>;
};
