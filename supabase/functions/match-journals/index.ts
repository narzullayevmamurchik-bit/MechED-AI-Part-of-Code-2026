import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface MatchRequest {
  title: string;
  abstract?: string;
  keywords?: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("Missing LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body: MatchRequest = await req.json();
    const title = (body.title || "").trim();
    if (!title || title.length < 5) {
      return new Response(JSON.stringify({ error: "Title too short" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const abstract = (body.abstract || "").slice(0, 4000);
    const keywords = Array.isArray(body.keywords) ? body.keywords.slice(0, 20) : [];

    // Fetch candidate journals (active, safe/caution only – we still include caution but flag them)
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: journals, error: jErr } = await admin
      .from("journals")
      .select("id,name,publisher,region,quartile,apc_amount,apc_currency,is_open_access,is_scopus,is_wos,is_oak,is_doaj,review_time_weeks,acceptance_rate,subject_areas,keywords,scope,risk_status")
      .eq("is_active", true)
      .limit(200);
    if (jErr) throw jErr;

    const compact = (journals || []).map((j) => ({
      id: j.id,
      name: j.name,
      publisher: j.publisher,
      region: j.region,
      quartile: j.quartile,
      apc: j.apc_amount ? `${j.apc_amount} ${j.apc_currency}` : "Free",
      oa: j.is_open_access,
      indexing: [j.is_scopus && "Scopus", j.is_wos && "WoS", j.is_oak && "OAK", j.is_doaj && "DOAJ"].filter(Boolean),
      review_weeks: j.review_time_weeks,
      acceptance: j.acceptance_rate,
      subjects: j.subject_areas,
      keywords: j.keywords,
      scope: (j.scope || "").slice(0, 240),
      risk: j.risk_status,
    }));

    const systemPrompt = `You match engineering manuscripts to suitable journals from a provided catalog. Return STRICT JSON only, no prose. Rank by topical fit, scope alignment, and indexing quality. Include up to 8 primary matches and 3 alternatives.`;

    const userPrompt = `Manuscript:
Title: ${title}
Abstract: ${abstract || "(not provided)"}
Keywords: ${keywords.join(", ") || "(none)"}

Journal catalog (JSON):
${JSON.stringify(compact)}

Return JSON with shape:
{
  "matches": [
    { "id": "<journal id>", "fit": 0-100, "reason": "<one sentence>", "est_review_weeks": <int|null>, "est_cost": "<string>" }
  ],
  "alternatives": [
    { "id": "<journal id>", "fit": 0-100, "reason": "<one sentence>" }
  ]
}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error", aiResp.status, errText);
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit — try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI failed: ${errText}`);
    }

    const aiJson = await aiResp.json();
    const raw = aiJson.choices?.[0]?.message?.content || "{}";
    let parsed: { matches?: any[]; alternatives?: any[] } = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { matches: [], alternatives: [] }; }

    // Enrich by joining with journal detail
    const byId = new Map((journals || []).map((j) => [j.id, j]));
    const enrich = (arr: any[] = []) => arr
      .filter((m) => byId.has(m.id))
      .map((m) => ({ ...m, journal: byId.get(m.id) }));

    const result = {
      matches: enrich(parsed.matches || []),
      alternatives: enrich(parsed.alternatives || []),
    };

    // Log run
    await admin.from("journal_match_runs").insert({
      user_id: userId,
      title,
      abstract,
      keywords,
      result,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("match-journals error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
