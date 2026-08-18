// Plagiarism detection — embeds all submissions for an assignment via Lovable AI
// Gateway and computes pairwise cosine similarity. Flags pairs above a threshold,
// persists each submission's top match into plagiarism_score + plagiarism_matches.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { extractText as extractPdfText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";
import mammoth from "https://esm.sh/mammoth@1.8.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SIMILARITY_THRESHOLD = 0.7; // matches >= this are flagged
const MAX_CHARS_PER_SUBMISSION = 12_000;

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

const HANDWRITING_OCR_PROMPT = `You extract handwritten or printed text from images of academic notes (engineering, chemistry, metallurgy). Preserve structure, equations, and bullet points. Use [unclear: word] for uncertain words. DO NOT summarize. ONLY extract text. If no readable text, respond exactly: NO_TEXT_DETECTED`;

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
          { role: "system", content: HANDWRITING_OCR_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all text from this image." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });
    if (!resp.ok) {
      console.error("OCR gateway error:", resp.status, await resp.text());
      return "";
    }
    const j = await resp.json();
    const text = (j.choices?.[0]?.message?.content || "").trim();
    if (!text || /^NO_TEXT_DETECTED\b/i.test(text)) return "";
    return text;
  } catch (e) {
    console.error("Image OCR failed:", e);
    return "";
  }
}

async function blobToText(blob: Blob, fileName: string | null, apiKey: string): Promise<string> {
  const ext = (fileName || "").toLowerCase().split(".").pop() || "";

  if (ext === "pdf") {
    try {
      const buf = new Uint8Array(await blob.arrayBuffer());
      const pdf = await getDocumentProxy(buf);
      const { text } = await extractPdfText(pdf, { mergePages: true });
      return (Array.isArray(text) ? text.join("\n") : text).trim();
    } catch (e) {
      console.error("PDF extract failed:", e);
      return "";
    }
  }

  if (ext === "docx") {
    try {
      const buf = await blob.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      return (result.value || "").trim();
    } catch (e) {
      console.error("DOCX extract failed:", e);
      return "";
    }
  }

  if (IMAGE_EXT.has(ext)) {
    return await imageToText(blob, ext, apiKey);
  }

  if (TEXT_LIKE_EXT.has(ext)) {
    try { return await blob.text(); } catch { return ""; }
  }
  try {
    const buf = await blob.slice(0, 50_000).arrayBuffer();
    const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    const badChars = (text.match(/[\x00\uFFFD]/g) || []).length;
    if (badChars / Math.max(text.length, 1) < 0.05 && text.trim().length > 0) {
      return text;
    }
  } catch { /* ignore */ }
  return "";
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function embed(text: string, apiKey: string): Promise<number[]> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/text-embedding-004",
      input: text.slice(0, MAX_CHARS_PER_SUBMISSION) || "[empty]",
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Embedding failed (${resp.status}): ${errText}`);
  }
  const json = await resp.json();
  const vec = json.data?.[0]?.embedding;
  if (!Array.isArray(vec)) throw new Error("No embedding returned");
  return vec;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { assignment_id } = await req.json();
    if (!assignment_id || typeof assignment_id !== "string") {
      return new Response(JSON.stringify({ error: "assignment_id is required" }), {
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

    // Verify caller is admin or teacher of the assignment's course
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: ures } = await userClient.auth.getUser();
    const callerId = ures?.user?.id;
    if (!callerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: asg } = await admin.from("assignments").select("course_id").eq("id", assignment_id).maybeSingle();
    if (!asg) {
      return new Response(JSON.stringify({ error: "Assignment not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdminRow } = await admin.rpc("has_role", { _user_id: callerId, _role: "admin" });
    const { data: isTeacher } = await admin.rpc("is_teacher_of_course", { _user_id: callerId, _course_id: asg.course_id });
    if (!isAdminRow && !isTeacher) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    // 1. Fetch all submissions + student names
    const { data: subs, error: sErr } = await admin
      .from("submissions")
      .select("id, student_id, content, file_path, file_name")
      .eq("assignment_id", assignment_id);
    if (sErr) throw sErr;
    if (!subs || subs.length < 2) {
      return new Response(
        JSON.stringify({ ok: true, message: "Need at least 2 submissions to compare.", checked: subs?.length || 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const studentIds = Array.from(new Set(subs.map((s) => s.student_id)));
    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", studentIds);
    const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name || "Unknown"]));

    // 2. Build text + embed each submission
    const enriched: { id: string; student_id: string; name: string; text: string; vec?: number[] }[] = [];
    for (const s of subs) {
      let text = (s.content || "").trim();
      if (s.file_path) {
        const { data: blob } = await admin.storage.from("submissions").download(s.file_path);
        if (blob) {
          const fileText = await blobToText(blob, s.file_name, LOVABLE_API_KEY);
          text = text ? `${text}\n${fileText}` : fileText;
        }
      }
      enriched.push({
        id: s.id,
        student_id: s.student_id,
        name: nameMap.get(s.student_id) || "Unknown",
        text,
      });
    }

    // Embed sequentially to be gentle on rate limits
    for (const item of enriched) {
      try {
        item.vec = await embed(item.text, LOVABLE_API_KEY);
      } catch (e) {
        console.error(`Embed failed for submission ${item.id}:`, e);
      }
    }

    const usable = enriched.filter((e) => e.vec && e.text.trim().length > 0);
    if (usable.length < 2) {
      return new Response(
        JSON.stringify({ ok: true, message: "Not enough non-empty submissions to compare.", checked: usable.length }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. Pairwise cosine similarity
    const matchesById = new Map<string, { peer_id: string; peer_name: string; similarity: number }[]>();
    for (let i = 0; i < usable.length; i++) {
      for (let j = i + 1; j < usable.length; j++) {
        const a = usable[i], b = usable[j];
        // Skip same-student submissions (resubmits)
        if (a.student_id === b.student_id) continue;
        const sim = cosine(a.vec!, b.vec!);
        const arrA = matchesById.get(a.id) || [];
        arrA.push({ peer_id: b.id, peer_name: b.name, similarity: sim });
        matchesById.set(a.id, arrA);
        const arrB = matchesById.get(b.id) || [];
        arrB.push({ peer_id: a.id, peer_name: a.name, similarity: sim });
        matchesById.set(b.id, arrB);
      }
    }

    // 4. Persist top match per submission
    const flaggedPairs: { a: string; b: string; similarity: number }[] = [];
    for (const item of usable) {
      const arr = matchesById.get(item.id) || [];
      arr.sort((x, y) => y.similarity - x.similarity);
      const top = arr[0];
      const score = top ? Math.round(top.similarity * 100) : 0;
      const flagged = arr.filter((m) => m.similarity >= SIMILARITY_THRESHOLD);
      const matches = flagged.map((m) => ({
        peer_submission_id: m.peer_id,
        peer_name: m.peer_name,
        similarity_pct: Math.round(m.similarity * 100),
      }));
      await admin
        .from("submissions")
        .update({
          plagiarism_score: score,
          plagiarism_matches: matches.length > 0 ? matches : null,
        })
        .eq("id", item.id);
      for (const m of flagged) {
        const key = [item.id, m.peer_id].sort().join("-");
        if (!flaggedPairs.some((p) => [p.a, p.b].sort().join("-") === key)) {
          flaggedPairs.push({ a: item.id, b: m.peer_id, similarity: m.similarity });
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        checked: usable.length,
        flagged_pairs: flaggedPairs.length,
        threshold: SIMILARITY_THRESHOLD,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("check-plagiarism failed:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
