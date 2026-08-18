// AI Academic Evaluator — grades student submissions against assignment rubric.
// Triggered by student on submit, or by teacher via "re-grade" button.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { extractText as extractPdfText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";
import mammoth from "https://esm.sh/mammoth@1.8.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a professional academic evaluator integrated into a learning platform.

Your evaluation must be FAIR, EVIDENCE-BASED, and CONTEXT-AWARE. Tone: professional, respectful, analytical — like a university professor.

STEP 1 — UNDERSTAND CONTEXT
- Carefully read the assignment title and requirements.
- Compare them with the student submission.

STEP 2 — HANDLE RELEVANCE STRICTLY
- If the submission does NOT address the assignment topic, Relevance MUST be very low (0–5 / 20).
- Clearly explain the mismatch in the weaknesses.
- BUT continue evaluating the other aspects independently — do not collapse all scores to zero just because the topic is off.

STEP 3 — BALANCED EVALUATION (each criterion 0–20, total 0–100)
- Relevance (strict, per Step 2)
- Technical Accuracy
- Depth of Explanation
- Structure & Clarity
- Originality

IMPORTANT:
- Do NOT give an extremely low total score unless ALL areas are genuinely weak.
- Separate "off-topic" from "low quality" — a well-written but off-topic answer can still score reasonably on Accuracy / Depth / Clarity.

STEP 4 — SAFE PLAGIARISM DETECTION (STRICT RULES)
- NEVER claim things like: "this is copied", "this is from a published paper", "this is not the student's work", or accuse the student of dishonesty.
- Instead use cautious language such as: "may resemble academic sources", "writing style is similar to formal research writing", "phrasing patterns suggest possible reuse".
- Without external verification, the plagiarism level should normally be "Low", "Medium", or "Uncertain". Only use "High" if there are strong observable signals (e.g., abrupt style shifts, verbatim-looking academic prose) — and even then, phrase it as a possibility, never as proof.
- Base the explanation ONLY on observable writing patterns. No accusations without evidence.

STEP 5 — OUTPUT
- Always return the evaluation by calling the submit_evaluation tool with the structured fields (score, breakdown, strengths, weaknesses, suggestions, plagiarism_risk, summary).
- Strengths / weaknesses / suggestions must be concrete and tied to the submission.

GOAL: Provide accurate, fair grading while protecting students from false or exaggerated claims.`;

const EVALUATE_TOOL = {
  type: "function",
  function: {
    name: "submit_evaluation",
    description: "Return the structured academic evaluation of a student submission.",
    parameters: {
      type: "object",
      properties: {
        score: { type: "integer", minimum: 0, maximum: 100, description: "Total score out of 100" },
        breakdown: {
          type: "object",
          properties: {
            relevance: { type: "integer", minimum: 0, maximum: 20 },
            technical_accuracy: { type: "integer", minimum: 0, maximum: 20 },
            depth: { type: "integer", minimum: 0, maximum: 20 },
            structure_clarity: { type: "integer", minimum: 0, maximum: 20 },
            originality: { type: "integer", minimum: 0, maximum: 20 },
          },
          required: ["relevance", "technical_accuracy", "depth", "structure_clarity", "originality"],
          additionalProperties: false,
        },
        strengths: { type: "array", items: { type: "string" }, minItems: 1 },
        weaknesses: { type: "array", items: { type: "string" }, minItems: 1 },
        suggestions: { type: "array", items: { type: "string" }, minItems: 1 },
        plagiarism_risk: {
          type: "object",
          properties: {
            level: { type: "string", enum: ["Low", "Medium", "High", "Uncertain"] },
            explanation: { type: "string" },
          },
          required: ["level", "explanation"],
          additionalProperties: false,
        },
        summary: { type: "string", description: "1-2 sentence overall verdict" },
      },
      required: ["score", "breakdown", "strengths", "weaknesses", "suggestions", "plagiarism_risk", "summary"],
      additionalProperties: false,
    },
  },
};

const TEXT_LIKE_EXT = new Set([
  "txt", "md", "csv", "json", "xml", "html", "htm", "css", "js", "ts", "tsx",
  "jsx", "py", "java", "c", "cpp", "h", "go", "rb", "php", "rs", "yaml", "yml",
  "ini", "log", "sql", "sh",
]);

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp"]);
const IMAGE_MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  webp: "image/webp", gif: "image/gif", bmp: "image/bmp",
};

const HANDWRITING_OCR_PROMPT = `You are an AI specialized in reading handwritten academic notes, especially in engineering and scientific subjects.

Your task is to extract and reconstruct text from a handwritten image.

INSTRUCTIONS:
- Carefully read all visible text, even if handwriting is unclear
- Use context (engineering, chemistry, metallurgy) to correct unclear words
- Recognize formulas, symbols, and chemical equations correctly
- Reconstruct incomplete or messy words intelligently
- Preserve structure: headings, bullet points, equations
- If a word is unclear: infer from context; if still uncertain, mark as [unclear: possible word]

OUTPUT: Clean structured text (title, sections, equations, bullet points). DO NOT summarize. DO NOT evaluate. ONLY extract and reconstruct text. If the image contains no readable text at all, respond with exactly: NO_TEXT_DETECTED`;

/** OCR a handwritten/printed image via Lovable AI Gateway (Gemini vision). */
async function imageToText(blob: Blob, ext: string, apiKey: string): Promise<string> {
  try {
    const mime = IMAGE_MIME[ext] || "image/png";
    const buf = new Uint8Array(await blob.arrayBuffer());
    // base64 encode
    let binary = "";
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    const b64 = btoa(binary);
    const dataUrl = `data:${mime};base64,${b64}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: HANDWRITING_OCR_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract and reconstruct all text from this image." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });
    if (!resp.ok) {
      console.error("OCR gateway error:", resp.status, await resp.text());
      return "NO_TEXT_DETECTED";
    }
    const j = await resp.json();
    const text = (j.choices?.[0]?.message?.content || "").trim();
    if (!text || /^NO_TEXT_DETECTED\b/i.test(text)) return "NO_TEXT_DETECTED";
    return text;
  } catch (e) {
    console.error("Image OCR failed:", e);
    return "NO_TEXT_DETECTED";
  }
}

/** Extract text from a file Blob — handles PDF, DOCX, images (handwriting OCR), plain text. */
async function blobToText(blob: Blob, fileName: string | null, apiKey: string): Promise<string> {
  const ext = (fileName || "").toLowerCase().split(".").pop() || "";

  // PDF — use unpdf (pure JS, Deno-compatible)
  if (ext === "pdf") {
    try {
      const buf = new Uint8Array(await blob.arrayBuffer());
      const pdf = await getDocumentProxy(buf);
      const { text } = await extractPdfText(pdf, { mergePages: true });
      const clean = (Array.isArray(text) ? text.join("\n") : text).trim();
      return clean || "NO_TEXT_DETECTED";
    } catch (e) {
      console.error("PDF extract failed:", e);
      return "NO_TEXT_DETECTED";
    }
  }

  // DOCX — use mammoth
  if (ext === "docx") {
    try {
      const buf = await blob.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      const clean = (result.value || "").trim();
      return clean || "NO_TEXT_DETECTED";
    } catch (e) {
      console.error("DOCX extract failed:", e);
      return "NO_TEXT_DETECTED";
    }
  }

  // Image — handwriting / printed text OCR via vision model
  if (IMAGE_EXT.has(ext)) {
    return await imageToText(blob, ext, apiKey);
  }

  // Known text-like extensions
  if (TEXT_LIKE_EXT.has(ext)) {
    try {
      const t = (await blob.text()).trim();
      return t || "NO_TEXT_DETECTED";
    } catch {
      return "NO_TEXT_DETECTED";
    }
  }

  // Heuristic for unknown — try as utf-8
  try {
    const buf = await blob.slice(0, 50_000).arrayBuffer();
    const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    const badChars = (text.match(/[\x00\uFFFD]/g) || []).length;
    if (badChars / Math.max(text.length, 1) < 0.05 && text.trim().length > 0) {
      return text;
    }
  } catch { /* ignore */ }

  return "NO_TEXT_DETECTED";
}

const NO_CONTENT_EVAL = {
  score: 0,
  breakdown: { relevance: 0, technical_accuracy: 0, depth: 0, structure_clarity: 0, originality: 0 },
  strengths: ["Not applicable"],
  weaknesses: ["No readable content detected in submission"],
  suggestions: [
    "Upload a text-based PDF (not a scanned image)",
    "Ensure the document content is selectable and readable",
    "Or paste the answer directly into the text box",
  ],
  plagiarism_risk: { level: "Low" as const, explanation: "No text available for analysis" },
  summary: "Submission could not be evaluated — no readable text was found.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { submission_id } = await req.json();
    if (!submission_id || typeof submission_id !== "string") {
      return new Response(JSON.stringify({ error: "submission_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Authorization: caller must be the submission's student, the course teacher, or admin
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: ures } = await userClient.auth.getUser();
    const callerId = ures?.user?.id;
    if (!callerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Load submission + assignment
    const { data: submission, error: subErr } = await admin
      .from("submissions")
      .select("*, assignments(title, description, max_score, course_id)")
      .eq("id", submission_id)
      .single();

    if (subErr || !submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const courseId = (submission as any).assignments?.course_id;
    const { data: isAdminRow } = await admin.rpc("has_role", { _user_id: callerId, _role: "admin" });
    const { data: isTeacher } = courseId
      ? await admin.rpc("is_teacher_of_course", { _user_id: callerId, _course_id: courseId })
      : { data: false };
    if (submission.student_id !== callerId && !isAdminRow && !isTeacher) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const assignment = (submission as any).assignments as {
      title: string;
      description: string;
      max_score: number;
    };

    // 2. Build student content (text + extracted file text)
    let studentContent = (submission.content || "").trim();
    let fileExtracted = "";
    if (submission.file_path) {
      const { data: fileBlob, error: dlErr } = await admin.storage
        .from("submissions")
        .download(submission.file_path);
      if (!dlErr && fileBlob) {
        fileExtracted = await blobToText(fileBlob, submission.file_name, LOVABLE_API_KEY);
        if (fileExtracted && fileExtracted !== "NO_TEXT_DETECTED") {
          studentContent = studentContent
            ? `${studentContent}\n\n--- Attached file: ${submission.file_name} ---\n${fileExtracted}`
            : `--- Attached file: ${submission.file_name} ---\n${fileExtracted}`;
        }
      }
    }

    // If submission is empty AND attached file is unreadable → return "Not available" eval
    const hasReadableContent =
      studentContent.trim().length > 0 &&
      !(submission.file_path && !studentContent.replace(/--- Attached file:.*?---/g, "").trim() && fileExtracted === "NO_TEXT_DETECTED");

    if (!studentContent.trim() || (submission.file_path && fileExtracted === "NO_TEXT_DETECTED" && !(submission.content || "").trim())) {
      const { error: updErr } = await admin
        .from("submissions")
        .update({ ai_score: null, ai_feedback: NO_CONTENT_EVAL })
        .eq("id", submission_id);
      if (updErr) throw updErr;
      return new Response(JSON.stringify({ ok: true, evaluation: NO_CONTENT_EVAL, no_content: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cap content to keep prompt size sensible
    const MAX_CHARS = 40_000;
    if (studentContent.length > MAX_CHARS) {
      studentContent =
        studentContent.slice(0, MAX_CHARS) + `\n\n[... truncated ${studentContent.length - MAX_CHARS} chars ...]`;
    }

    const userPrompt = `ASSIGNMENT TITLE: ${assignment.title}

ASSIGNMENT DESCRIPTION / REQUIREMENTS:
${assignment.description || "(no description provided)"}

MAX SCORE FOR THIS ASSIGNMENT: ${assignment.max_score}

────────── STUDENT SUBMISSION ──────────
${studentContent}
────────────────────────────────────────

Evaluate strictly. Call submit_evaluation with the result.`;

    // 3. Call Lovable AI Gateway
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [EVALUATE_TOOL],
        tool_choice: { type: "function", function: { name: "submit_evaluation" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit reached. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`AI gateway error ${aiResp.status}`);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiJson));
      throw new Error("AI did not return a structured evaluation");
    }

    let evaluation: any;
    try {
      evaluation = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool args:", toolCall.function.arguments);
      throw new Error("Malformed evaluation JSON from AI");
    }

    // 4. Persist
    const { error: updErr } = await admin
      .from("submissions")
      .update({
        ai_score: evaluation.score,
        ai_feedback: evaluation,
      })
      .eq("id", submission_id);

    if (updErr) throw updErr;

    return new Response(JSON.stringify({ ok: true, evaluation }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("grade-submission failed:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
