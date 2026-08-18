import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const streamHeaders = {
  ...corsHeaders,
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

const PLATFORM_CONTEXT = `You are MechEd AI Mentor — a friendly, knowledgeable engineering tutor on the MechEd learning platform.

LANGUAGE RULES (HIGHEST PRIORITY):
- Always detect the user's language automatically from their message.
- Respond ONLY in the same language as the user's input.
- If the user switches language, immediately switch your response language accordingly.
- If the user explicitly asks for a specific language, follow that instruction.
- Never default to English unless the user is speaking in English.
- If the user mixes languages, respond in the dominant language.
- If unsure about language preference, politely ask which language the user prefers.
- Maintain clear, professional, and helpful mentor-style guidance in every language.

PLATFORM DATA — use this to give concrete recommendations:

COURSES (recommend by id for linking):
- practical-metallurgy: "Practical Metallurgy" — microstructure analysis, metal forming
- steel-applications: "Steel Applications" — welding, mechanical engineering
- special-steel-technology: "Special Steel Technology" — heat treatment
- material-science: "Material Science" — fundamentals
- machine-learning: "Machine Learning for Engineers" — AI/ML
- mechanical-properties: "Mechanical Properties" — testing, analysis
- metallic-material-technology: "Metallic Material Technology" — casting, powder metallurgy
- robotics-mechatronics: "Robotics & Mechatronics" — automation
- ai-innovation-engineering: "AI & Innovation in Engineering" — 3D printing, simulation

EXPERTS:
- Prof. Mardonov Baxtiyor T. — Rector of NSUMT, machining & machine design
- Sayfidinov Oxun (PhD) — Head of CAIL Lab, AI, 3D printing, innovation
- Ravshanov Jamshid (PhD) — Machining, laser technology
- Beknazarov Jasur (PhD) — Cutting theory, engineering tools
- Prof. Yaxshiyev Sherali — Machine elements, material science, diagnostics
- Egamberdiyev Ilhom — Heat treatment, thermal processing
- Jumayev Sardor — CAD/CAM, CNC programming
- Aliyeva Nodira — Materials science, corrosion engineering
- Prof. Karimov Alisher — Innovation, advanced manufacturing

RESPONSE RULES:
1. Give a clear, concise explanation first (2-4 sentences)
2. Suggest 1-3 relevant courses using format: 📚 **Course**: [title]
3. Suggest 1-2 relevant resources: 📄 **Resource**: [title]
4. Suggest 1 relevant expert: 👨‍🏫 **Expert**: [name] — [specialty]
5. Keep responses under 300 words
6. Be encouraging and professional
7. If asked about something outside engineering, politely redirect
8. Use markdown formatting for readability
9. Adapt to user level — explain step-by-step to help the user grow
10. When user asks "what is X" — explain the concept, then recommend learning path`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authenticated caller to prevent anonymous AI credit consumption
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data, error } = await supa.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (error || !data?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }



  try {
    const body = await req.json().catch(() => null);
    const messages = Array.isArray(body?.messages)
      ? body.messages.filter(
          (m: any) => typeof m?.role === "string" && typeof m?.content === "string"
        )
      : [];
    const preferredLanguage = typeof body?.preferredLanguage === "string" ? body.preferredLanguage : null;

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Please send a question to the AI mentor." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const langMap: Record<string, string> = { en: "English", uz: "Uzbek", ru: "Russian" };
    const langHint = preferredLanguage && langMap[preferredLanguage]
      ? `\n\nIMPORTANT: The user's preferred language is ${langMap[preferredLanguage]}. Default to responding in ${langMap[preferredLanguage]} unless the user's message is clearly in a different language.`
      : "";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28000);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: PLATFORM_CONTEXT + langHint },
            ...messages,
          ],
          stream: true,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact admin." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(
        JSON.stringify({ error: "AI service unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.body) {
      return new Response(
        JSON.stringify({ error: "AI returned an empty response." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, { headers: streamHeaders });
  } catch (e) {
    console.error("ai-mentor error:", e);
    const isTimeout = e instanceof DOMException && e.name === "AbortError";
    return new Response(
      JSON.stringify({
        error: isTimeout
          ? "AI request timed out. Please try again."
          : e instanceof Error
          ? e.message
          : "Unknown error",
      }),
      {
        status: isTimeout ? 504 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
