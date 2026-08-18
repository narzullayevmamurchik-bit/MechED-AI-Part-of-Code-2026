import { useEffect, useState } from "react";
import { useOcrJob, type OcrPage } from "@/hooks/useOcrJob";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, CheckCircle2, RefreshCw, Sparkles, Languages, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Props {
  jobId: string | null;
  bucket: "self-checks" | "submissions";
  onUseText?: (mergedText: string, confidence: number) => void;
}

const LANG_LABEL: Record<string, string> = {
  en: "English",
  de: "Deutsch",
  ru: "Русский",
  "uz-cyrl": "Ўзбекча (Кир)",
  "uz-latn": "O'zbekcha (Lat)",
  mixed: "Mixed",
  unknown: "Unknown",
};

const confidenceTone = (c: number) =>
  c >= 85 ? "text-emerald-500 bg-emerald-500/10" : c >= 60 ? "text-amber-500 bg-amber-500/10" : "text-destructive bg-destructive/10";

export const OcrReviewPanel = ({ jobId, bucket, onUseText }: Props) => {
  const { job, updatePage, retry } = useOcrJob(jobId);
  const { toast } = useToast();
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  // Generate signed URLs for page images
  useEffect(() => {
    if (!job?.pages?.length) return;
    let cancelled = false;
    (async () => {
      const urls: Record<string, string> = {};
      for (const p of job.pages) {
        if (!p.image_path) continue;
        const { data } = await supabase.storage.from(bucket).createSignedUrl(p.image_path, 60 * 30);
        if (data) urls[p.image_path] = data.signedUrl;
      }
      if (!cancelled) setSigned(urls);
    })();
    return () => {
      cancelled = true;
    };
  }, [job?.pages, bucket]);

  if (!jobId) return null;
  if (!job) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading OCR job…
      </div>
    );
  }

  const isWorking = job.status === "queued" || job.status === "processing";
  const overall = job.overall_confidence ?? 0;
  const merged = job.pages
    .map((p, i) => drafts[p.index] ?? p.corrected_text ?? "")
    .join("\n\n--- PAGE BREAK ---\n\n");

  const saveDraft = async (p: OcrPage) => {
    const v = drafts[p.index];
    if (v === undefined) return;
    await updatePage(p.index, v);
    setDrafts((d) => {
      const n = { ...d };
      delete n[p.index];
      return n;
    });
    toast({ title: "Saved", description: `Page ${p.index + 1} updated` });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">OCR Review</h3>
          {isWorking && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" /> {job.status === "queued" ? "Queued" : "Processing"}…
            </span>
          )}
          {!isWorking && (
            <span className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold", confidenceTone(overall))}>
              {overall >= 85 ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              Confidence {overall}/100
            </span>
          )}
          {!!job.detected_languages?.length && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-secondary text-muted-foreground">
              <Languages className="w-3 h-3" />
              {job.detected_languages.map((l) => LANG_LABEL[l] ?? l).join(", ")}
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{job.pages.length} page(s)</span>
        </div>

        {overall > 0 && overall < 60 && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              Handwriting recognition quality is low. You can edit the text manually below, or request manual grading.
            </div>
          </div>
        )}

        {job.status === "failed" && (
          <div className="mt-3 flex items-center justify-between gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
            <span>OCR failed: {job.error}</span>
            <button onClick={retry} className="flex items-center gap-1 px-2 py-1 rounded-md bg-card text-foreground">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {!isWorking && onUseText && job.pages.length > 0 && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => onUseText(merged, overall)}
              className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Use this text for grading
            </button>
          </div>
        )}
      </div>

      {/* Pages */}
      <div className="space-y-3">
        {job.pages.map((p) => {
          const draft = drafts[p.index];
          const value = draft ?? p.corrected_text ?? "";
          const dirty = draft !== undefined && draft !== p.corrected_text;
          return (
            <div key={p.index} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30">
                <span className="text-xs font-semibold text-foreground">Page {p.index + 1}</span>
                <div className="flex items-center gap-2">
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold", confidenceTone(p.confidence))}>
                    {p.confidence}/100
                  </span>
                  <span className="text-[10px] text-muted-foreground">{LANG_LABEL[p.language] ?? p.language}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                <div className="bg-secondary/20 flex items-center justify-center p-2 max-h-[420px] overflow-auto">
                  {signed[p.image_path] ? (
                    <img src={signed[p.image_path]} alt={`Page ${p.index + 1}`} className="max-w-full h-auto rounded" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <div className="p-3 flex flex-col gap-2">
                  <Textarea
                    value={value}
                    onChange={(e) => setDrafts((d) => ({ ...d, [p.index]: e.target.value }))}
                    rows={14}
                    className="font-mono text-xs resize-y min-h-[300px]"
                    placeholder={isWorking ? "Awaiting OCR…" : "No text extracted"}
                  />
                  {dirty && (
                    <button
                      onClick={() => saveDraft(p)}
                      className="self-end flex items-center gap-1 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-semibold"
                    >
                      <Save className="w-3 h-3" /> Save edits
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isWorking && job.pages.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> AI is reading your document…
          </div>
        )}
      </div>
    </div>
  );
};
