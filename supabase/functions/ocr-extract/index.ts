// OCR extraction using Gemini multimodal via Lovable AI Gateway.
// Input: { job_id, image_urls: string[] }  (signed URLs of preprocessed page images)
// Output: writes per-page text/confidence/language to ocr_jobs, returns aggregate.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SYSTEM_PROMPT = `You are an expert OCR engine for engineering and metallurgy documents.
The image is a scanned or photographed page that may contain HANDWRITTEN text (often cursive),
printed text, formulas, tables, sketches, units, and technical symbols.

Languages to recognize: English, German, Russian (Cyrillic), Uzbek (Cyrillic), Uzbek (Latin).
Auto-detect the dominant language of the page.

Strict rules:
- Transcribe ALL legible text in the original language, preserving line breaks and structure.
- Render mathematical formulas in LaTeX inline math: $...$ or display math: $$...$$.
- Preserve units exactly: °C, MPa, GPa, HV, HRC, mm, %, etc.
- Render tabular data as GitHub-flavored Markdown tables.
- Use engineering / metallurgy vocabulary (e.g. "quenching", "austenite", "tempering",
  "закалка", "аустенит", "отпуск", "toblanish", "qotirish") when disambiguating words.
- Mark uncertain words as [?word]. If a word is completely illegible, write [???].
- Do NOT translate. Do NOT add commentary outside the JSON.
- Return STRICT JSON only matching the schema. No markdown fences.

Confidence rubric (0-100):
  95-100 clean printed text
  80-94  clear handwriting
  60-79  messy handwriting, partial occlusion
  30-59  hard to read, many guesses
  0-29   mostly unreadable

JSON schema:
{
  "text": string,                 // full transcribed page
  "confidence": number,           // 0..100 integer
  "language": "en"|"de"|"ru"|"uz-cyrl"|"uz-latn"|"mixed"|"unknown",
  "technical_terms": string[],    // detected domain terms
  "has_formulas": boolean,
  "has_tables": boolean
}`;

interface PageResult {
  index: number;
  image_path: string;
  raw_text: string;
  corrected_text: string;
  confidence: number;
  language: string;
  technical_terms: string[];
  error?: string;
}

async function ocrOnePage(imageUrl: string, index: number, imagePath: string): Promise<PageResult> {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe this page. Return strict JSON per schema." },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Gateway ${resp.status}: ${t.slice(0, 400)}`);
    }
    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: Partial<PageResult> & { text?: string };
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      parsed = { text: String(raw), confidence: 0, language: "unknown", technical_terms: [] };
    }
    const text = parsed.text ?? "";
    return {
      index,
      image_path: imagePath,
      raw_text: text,
      corrected_text: text,
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence ?? 0))),
      language: String(parsed.language ?? "unknown"),
      technical_terms: Array.isArray(parsed.technical_terms) ? parsed.technical_terms.slice(0, 30) : [],
    };
  } catch (e) {
    return {
      index,
      image_path: imagePath,
      raw_text: "",
      corrected_text: "",
      confidence: 0,
      language: "unknown",
      technical_terms: [],
      error: (e as Error).message,
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Allow service-role invocation from ocr-retry; otherwise require user JWT
    const token = authHeader.replace("Bearer ", "");
    let callerId: string | null = null;
    let isService = token === SERVICE_ROLE;
    if (!isService) {
      const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: ures } = await userClient.auth.getUser();
      callerId = ures?.user?.id ?? null;
      if (!callerId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { job_id, pages } = await req.json() as {
      job_id: string;
      pages: { url: string; path: string }[];
    };
    if (!job_id || !Array.isArray(pages) || !pages.length) {
      return new Response(JSON.stringify({ error: "job_id and pages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ownership check + SSRF-safe URL check
    const { data: jobRow } = await supabase.from("ocr_jobs").select("user_id").eq("id", job_id).maybeSingle();
    if (!jobRow) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isService) {
      const { data: isAdminRow } = await supabase.rpc("has_role", { _user_id: callerId, _role: "admin" });
      if (jobRow.user_id !== callerId && !isAdminRow) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    // Ensure image URLs point to this project's storage (block SSRF/cost abuse)
    const allowedHost = new URL(SUPABASE_URL).host;
    for (const p of pages) {
      try {
        const u = new URL(p.url);
        if (u.host !== allowedHost) {
          return new Response(JSON.stringify({ error: "Invalid image host" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch {
        return new Response(JSON.stringify({ error: "Invalid image URL" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }


    await supabase.from("ocr_jobs").update({
      status: "processing",
      attempts: 1,
      error: null,
    }).eq("id", job_id);

    // Process up to 4 pages concurrently
    const results: PageResult[] = [];
    const CONC = 4;
    for (let i = 0; i < pages.length; i += CONC) {
      const slice = pages.slice(i, i + CONC);
      const batch = await Promise.all(slice.map((p, k) => ocrOnePage(p.url, i + k, p.path)));
      results.push(...batch);
    }

    const valid = results.filter((r) => r.confidence > 0);
    const avg = valid.length
      ? Math.round(valid.reduce((s, r) => s + r.confidence, 0) / valid.length)
      : 0;
    const langs = Array.from(new Set(results.map((r) => r.language).filter((l) => l && l !== "unknown")));
    const anyError = results.some((r) => r.error);
    const status = anyError && avg === 0 ? "failed" : avg < 60 ? "low_confidence" : "done";

    const { data: job } = await supabase.from("ocr_jobs")
      .update({
        status,
        pages: results,
        overall_confidence: avg,
        detected_languages: langs,
        error: anyError ? results.find((r) => r.error)?.error : null,
      })
      .eq("id", job_id)
      .select()
      .single();

    // Mirror to parent entity
    if (job?.entity_type === "self_check" && job.entity_id) {
      await supabase.from("self_checks").update({
        ocr_text: results.map((r) => r.corrected_text).join("\n\n--- PAGE BREAK ---\n\n"),
        ocr_confidence: avg,
        ocr_languages: langs,
        ocr_job_id: job_id,
      }).eq("id", job.entity_id);
    } else if (job?.entity_type === "submission" && job.entity_id) {
      await supabase.from("submissions").update({
        ocr_text: results.map((r) => r.corrected_text).join("\n\n--- PAGE BREAK ---\n\n"),
        ocr_confidence: avg,
        ocr_languages: langs,
        ocr_job_id: job_id,
      }).eq("id", job.entity_id);
    }

    return new Response(
      JSON.stringify({ job_id, status, overall_confidence: avg, pages: results.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
