import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: ures } = await userClient.auth.getUser();
    if (!ures?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", ures.user.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");

    const { job_id } = await req.json();
    if (!job_id) {
      return new Response(JSON.stringify({ error: "job_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: job } = await admin.from("ocr_jobs").select("*").eq("id", job_id).single();
    if (!job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isAdmin && job.user_id !== ures.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Re-sign existing page images and re-invoke ocr-extract
    const pageRows = (job.pages as { image_path: string; index: number }[]) ?? [];
    if (!pageRows.length) {
      return new Response(JSON.stringify({ error: "No pages stored for retry" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const bucket = job.entity_type === "submission" ? "submissions" : "self-checks";
    const pages: { url: string; path: string }[] = [];
    for (const p of pageRows) {
      const { data: signed } = await admin.storage.from(bucket).createSignedUrl(p.image_path, 60 * 30);
      if (signed) pages.push({ url: signed.signedUrl, path: p.image_path });
    }

    await admin.from("ocr_jobs").update({
      status: "queued",
      attempts: (job.attempts ?? 0) + 1,
      error: null,
    }).eq("id", job_id);

    // Invoke extractor (fire-and-forget)
    void fetch(`${SUPABASE_URL}/functions/v1/ocr-extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE}` },
      body: JSON.stringify({ job_id, pages }),
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
