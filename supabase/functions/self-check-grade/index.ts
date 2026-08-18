// Self-Check AI Reviewer — student uploads any document and gets engineering-focused
// AI feedback (technical, grammar, formatting, terminology, structure, score).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { extractText as extractPdfText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";
import mammoth from "https://esm.sh/mammoth@1.8.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a senior engineering tutor reviewing a student's own work that they submitted for SELF-CHECK (not a teacher assignment).

Provide a constructive, professional review covering:
- Technical correctness (engineering concepts, formulas, units, reasoning)
- Engineering terminology (suggest the right domain vocabulary where appropriate)
- Grammar & language quality
- Document structure & formatting
- Clarity and depth of explanation
- Likely originality (cautious — never accuse)

Tone: encouraging, specific, evidence-based. Always cite what you see in the text.

Return the result by calling submit_self_review with structured fields.`;

const REVIEW_TOOL = {
  type: "function",
  function: {
    name: "submit_self_review",
    description: "Return structured engineering self-check review.",
    parameters: {
      type: "object",
      properties: {
        score: { type: "integer", minimum: 0, maximum: 100 },
        breakdown: {
          type: "object",
          properties: {
            technical_accuracy: { type: "integer", minimum: 0, maximum: 20 },
            terminology: { type: "integer", minimum: 0, maximum: 20 },
            grammar_language: { type: "integer", minimum: 0, maximum: 20 },
            structure_formatting: { type: "integer", minimum: 0, maximum: 20 },
            clarity_depth: { type: "integer", minimum: 0, maximum: 20 },
          },
          required: ["technical_accuracy", "terminology", "grammar_language", "structure_formatting", "clarity_depth"],
          additionalProperties: false,
        },
        strengths: { type: "array", items: { type: "string" }, minItems: 1 },
        weaknesses: { type: "array", items: { type: "string" }, minItems: 1 },
        recommendations: { type: "array", items: { type: "string" }, minItems: 1 },
        terminology_suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: { found: { type: "string" }, suggested: { type: "string" }, why: { type: "string" } },
            required: ["found", "suggested", "why"],
            additionalProperties: false,
          },
        },
        plagiarism_risk: {
          type: "object",
          properties: {
            level: { type: "string", enum: ["Low", "Medium", "High", "Uncertain"] },
            explanation: { type: "string" },
          },
          required: ["level", "explanation"],
          additionalProperties: false,
        },
        summary: { type: "string" },
      },
      required: ["score", "breakdown", "strengths", "weaknesses", "recommendations", "plagiarism_risk", "summary"],
      additionalProperties: false,
    },
  },
};

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp"]);
const IMAGE_MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  webp: "image/webp", gif: "image/gif", bmp: "image/bmp",
};

async function imageToText(blob: Blob, ext: string, apiKey: string): Promise<string> {
  try {
    const mime = IMAGE_MIME[ext] || "image/png";
    const buf = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    const dataUrl = `data:${mime};base64,${btoa(binary)}`;
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Extract all readable text from this image. Preserve structure, equations, bullet points. If nothing readable, respond: NO_TEXT_DETECTED" },
          { role: "user", content: [{ type: "image_url", image_url: { url: dataUrl } }] },
        ],
      }),
    });
    if (!resp.ok) return "NO_TEXT_DETECTED";
    const j = await resp.json();
    const t = (j.choices?.[0]?.message?.content || "").trim();
    return t && !/^NO_TEXT_DETECTED/i.test(t) ? t : "NO_TEXT_DETECTED";
  } catch { return "NO_TEXT_DETECTED"; }
}

async function blobToText(blob: Blob, fileName: string | null, apiKey: string): Promise<string> {
  const ext = (fileName || "").toLowerCase().split(".").pop() || "";
  if (ext === "pdf") {
    try {
      const buf = new Uint8Array(await blob.arrayBuffer());
      const pdf = await getDocumentProxy(buf);
      const { text } = await extractPdfText(pdf, { mergePages: true });
      return ((Array.isArray(text) ? text.join("\n") : text) || "").trim() || "NO_TEXT_DETECTED";
    } catch { return "NO_TEXT_DETECTED"; }
  }
  if (ext === "docx") {
    try {
      const buf = await blob.arrayBuffer();
      const r = await mammoth.extractRawText({ arrayBuffer: buf });
      return (r.value || "").trim() || "NO_TEXT_DETECTED";
    } catch { return "NO_TEXT_DETECTED"; }
  }
  if (ext === "pptx") {
    // Lightweight pptx text extraction: unzip and read slide xml as text
    try {
      const text = (await blob.text());
      const matches = text.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
      const out = matches.map(m => m.replace(/<[^>]+>/g, "")).join("\n").trim();
      return out || "NO_TEXT_DETECTED";
    } catch { return "NO_TEXT_DETECTED"; }
  }
  if (IMAGE_EXT.has(ext)) return await imageToText(blob, ext, apiKey);
  try {
    const t = (await blob.text()).trim();
    return t || "NO_TEXT_DETECTED";
  } catch { return "NO_TEXT_DETECTED"; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { self_check_id } = await req.json();
    if (!self_check_id || typeof self_check_id !== "string") {
      return new Response(JSON.stringify({ error: "self_check_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Auth: caller must own the self_check or be an admin
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: ures } = await userClient.auth.getUser();
    const callerId = ures?.user?.id;
    if (!callerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: row, error: rowErr } = await admin.from("self_checks").select("*").eq("id", self_check_id).single();
    if (rowErr || !row) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: isAdminRow } = await admin.rpc("has_role", { _user_id: callerId, _role: "admin" });
    if (row.user_id !== callerId && !isAdminRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }


    await admin.from("self_checks").update({ status: "grading" }).eq("id", self_check_id);

    let text = (row.notes || "").trim();

    // Prefer OCR-extracted text (handles handwritten/multilingual scans)
    if (row.ocr_text && String(row.ocr_text).trim()) {
      const ocrText = String(row.ocr_text).trim();
      text = text ? `${text}\n\n--- OCR (confidence ${row.ocr_confidence ?? "?"}%) ---\n${ocrText}` : ocrText;
    } else if (row.file_path) {
      const { data: blob, error: dlErr } = await admin.storage.from("self-checks").download(row.file_path);
      if (!dlErr && blob) {
        const extracted = await blobToText(blob, row.file_name, LOVABLE_API_KEY);
        if (extracted && extracted !== "NO_TEXT_DETECTED") {
          text = text ? `${text}\n\n--- File: ${row.file_name} ---\n${extracted}` : `--- File: ${row.file_name} ---\n${extracted}`;
        }
      }
    }
    if (!text.trim()) {
      const empty = {
        score: 0,
        breakdown: { technical_accuracy: 0, terminology: 0, grammar_language: 0, structure_formatting: 0, clarity_depth: 0 },
        strengths: ["—"], weaknesses: ["No readable text in upload"],
        recommendations: ["Upload a text-based PDF/DOCX or paste notes"],
        plagiarism_risk: { level: "Low", explanation: "No content to analyze" },
        summary: "No readable content found.",
      };
      await admin.from("self_checks").update({ status: "graded", ai_score: 0, ai_feedback: empty, graded_at: new Date().toISOString() }).eq("id", self_check_id);
      return new Response(JSON.stringify({ ok: true, evaluation: empty }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (text.length > 40_000) text = text.slice(0, 40_000) + "\n\n[... truncated ...]";

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `STUDENT SELF-CHECK TITLE: ${row.title}\n\n────────── CONTENT ──────────\n${text}\n──────────────────────────────\n\nCall submit_self_review.` },
        ],
        tools: [REVIEW_TOOL],
        tool_choice: { type: "function", function: { name: "submit_self_review" } },
      }),
    });
    if (!aiResp.ok) {
      const err = await aiResp.text();
      await admin.from("self_checks").update({ status: "error" }).eq("id", self_check_id);
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "AI rate limit. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway ${aiResp.status}: ${err}`);
    }
    const aiJson = await aiResp.json();
    const tc = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc?.function?.arguments) throw new Error("AI did not return structured review");
    const evaluation = JSON.parse(tc.function.arguments);

    await admin.from("self_checks").update({
      status: "graded",
      ai_score: evaluation.score,
      ai_feedback: evaluation,
      graded_at: new Date().toISOString(),
    }).eq("id", self_check_id);

    return new Response(JSON.stringify({ ok: true, evaluation }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("self-check-grade failed:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
