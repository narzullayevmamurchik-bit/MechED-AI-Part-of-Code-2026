/**
 * Orchestrates: preprocess → upload pages → create ocr_job → invoke ocr-extract.
 */
import { supabase } from "@/integrations/supabase/client";
import { preprocessForOcr, type ProcessedPage } from "@/lib/ocrPreprocess";

export interface RunOcrOptions {
  file: File;
  userId: string;
  entityType: "self_check" | "submission" | "standalone";
  entityId: string | null;
  bucket: "self-checks" | "submissions";
  /** folder prefix (e.g. `${userId}`) */
  pathPrefix: string;
  onProgress?: (pct: number, stage: string) => void;
}

export async function runOcrPipeline(opts: RunOcrOptions): Promise<{ jobId: string }> {
  const { file, userId, entityType, entityId, bucket, pathPrefix, onProgress } = opts;

  // 1. Preprocess client-side
  onProgress?.(2, "Preprocessing");
  const pages: ProcessedPage[] = await preprocessForOcr(file, (p, s) =>
    onProgress?.(Math.round(p * 0.4), s),
  );
  if (!pages.length) throw new Error("No pages produced");

  // 2. Create job row
  const { data: job, error: jobErr } = await supabase
    .from("ocr_jobs")
    .insert({
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      status: "queued",
    })
    .select()
    .single();
  if (jobErr) throw jobErr;

  // 3. Upload each page image and collect signed URLs
  const pageRefs: { url: string; path: string }[] = [];
  for (let i = 0; i < pages.length; i++) {
    const path = `${pathPrefix}/ocr-pages/${job.id}/page-${i + 1}.jpg`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, pages[i].blob, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (upErr) throw upErr;
    const { data: signed, error: sErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 30);
    if (sErr || !signed) throw sErr ?? new Error("Sign failed");
    pageRefs.push({ url: signed.signedUrl, path });
    onProgress?.(40 + Math.round(((i + 1) / pages.length) * 30), `Uploading page ${i + 1}/${pages.length}`);
  }

  // 4. Kick off OCR (fire-and-forget; realtime will update UI)
  onProgress?.(75, "Running AI OCR");
  void supabase.functions.invoke("ocr-extract", {
    body: { job_id: job.id, pages: pageRefs },
  });

  onProgress?.(100, "Submitted");
  return { jobId: job.id };
}
