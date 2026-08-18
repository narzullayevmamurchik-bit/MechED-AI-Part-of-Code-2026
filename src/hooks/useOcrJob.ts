import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OcrPage {
  index: number;
  image_path: string;
  raw_text: string;
  corrected_text: string;
  confidence: number;
  language: string;
  technical_terms?: string[];
  error?: string;
}

export interface OcrJob {
  id: string;
  user_id: string;
  entity_type: "submission" | "self_check" | "standalone";
  entity_id: string | null;
  status: "queued" | "processing" | "done" | "failed" | "low_confidence";
  pages: OcrPage[];
  overall_confidence: number | null;
  detected_languages: string[];
  error: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
}

export const useOcrJob = (jobId: string | null) => {
  const [job, setJob] = useState<OcrJob | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    const { data, error } = await supabase.from("ocr_jobs").select("*").eq("id", jobId).maybeSingle();
    if (!error && data) setJob(data as unknown as OcrJob);
    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    void fetchJob();
    const ch = supabase
      .channel(`ocr_job:${jobId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ocr_jobs", filter: `id=eq.${jobId}` },
        () => void fetchJob(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [jobId, fetchJob]);

  const updatePage = useCallback(
    async (index: number, corrected: string) => {
      if (!job) return;
      const pages = job.pages.map((p) => (p.index === index ? { ...p, corrected_text: corrected } : p));
      const merged = pages.map((p) => p.corrected_text).join("\n\n--- PAGE BREAK ---\n\n");
      const { error } = await supabase.from("ocr_jobs").update({ pages: pages as never }).eq("id", job.id);
      if (error) return;
      // Mirror corrected text to parent entity
      if (job.entity_type === "self_check" && job.entity_id) {
        await supabase.from("self_checks").update({ ocr_text: merged }).eq("id", job.entity_id);
      } else if (job.entity_type === "submission" && job.entity_id) {
        await supabase.from("submissions").update({ ocr_text: merged }).eq("id", job.entity_id);
      }
      setJob({ ...job, pages });
    },
    [job],
  );

  const retry = useCallback(async () => {
    if (!jobId) return;
    await supabase.functions.invoke("ocr-retry", { body: { job_id: jobId } });
  }, [jobId]);

  return { job, loading, updatePage, retry, refetch: fetchJob };
};
