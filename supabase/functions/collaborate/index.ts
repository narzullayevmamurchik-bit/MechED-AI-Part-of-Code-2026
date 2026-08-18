import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SYSTEM_PROMPT = `You are the Global Collaboration AI assistant for an international engineering student platform.
You help cross-border student teams form, brainstorm, summarize discussions, and stay respectful.
You ALWAYS reply with VALID JSON only — no prose outside the JSON object.
Be concise, encouraging, and culturally inclusive.`;

async function callAI(messages: any[], schema: any): Promise<any> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY missing");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      tools: [{ type: "function", function: schema }],
      tool_choice: { type: "function", function: { name: schema.name } },
    }),
  });

  if (resp.status === 429) throw new Error("RATE_LIMIT");
  if (resp.status === 402) throw new Error("PAYMENT_REQUIRED");
  if (!resp.ok) {
    const t = await resp.text();
    console.error("AI gateway error:", resp.status, t);
    throw new Error("AI_ERROR");
  }

  const data = await resp.json();
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("AI returned no tool call");
  return typeof args === "string" ? JSON.parse(args) : args;
}

const TEAM_SCHEMA = {
  name: "suggest_team",
  description: "Suggest team roles and team size for a project topic.",
  parameters: {
    type: "object",
    properties: {
      recommended_size: { type: "integer", minimum: 2, maximum: 10 },
      roles: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
          },
          required: ["title", "description"],
        },
        minItems: 3,
        maxItems: 8,
      },
      rationale: { type: "string" },
    },
    required: ["recommended_size", "roles", "rationale"],
  },
};

const IDEAS_SCHEMA = {
  name: "generate_ideas",
  description: "Generate concrete project ideas around a topic.",
  parameters: {
    type: "object",
    properties: {
      ideas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
          },
          required: ["title", "summary", "difficulty"],
        },
        minItems: 3,
        maxItems: 6,
      },
    },
    required: ["ideas"],
  },
};

const SUMMARY_SCHEMA = {
  name: "summarize_discussion",
  description: "Summarize a chat thread into key decisions and next steps.",
  parameters: {
    type: "object",
    properties: {
      summary: { type: "string" },
      decisions: { type: "array", items: { type: "string" } },
      next_steps: { type: "array", items: { type: "string" } },
    },
    required: ["summary", "decisions", "next_steps"],
  },
};

const MODERATE_SCHEMA = {
  name: "moderate_message",
  description: "Classify a chat message for safety and tone.",
  parameters: {
    type: "object",
    properties: {
      flagged: { type: "boolean" },
      severity: { type: "string", enum: ["none", "low", "medium", "high"] },
      reason: { type: "string" },
      categories: {
        type: "array",
        items: {
          type: "string",
          enum: ["toxic", "harassment", "hate", "off_topic", "spam", "personal_info", "none"],
        },
      },
    },
    required: ["flagged", "severity", "reason", "categories"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require authenticated caller
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });
  try {
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data, error } = await supa.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (error || !data?.claims?.sub) return json(401, { error: "Unauthorized" });
  } catch {
    return json(401, { error: "Unauthorized" });
  }

  try {
    const body = await req.json();
    const action = body?.action as string;
    if (!action) return json(400, { error: "Missing action" });

    if (action === "suggest_team") {
      const topic = String(body.topic ?? "").slice(0, 500);
      const description = String(body.description ?? "").slice(0, 2000);
      if (!topic) return json(400, { error: "Topic is required" });

      const result = await callAI(
        [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Suggest a team structure for an international engineering student project.\nTopic: ${topic}\nContext: ${description}\nProvide diverse, complementary roles.`,
          },
        ],
        TEAM_SCHEMA,
      );
      return json(200, result);
    }

    if (action === "generate_ideas") {
      const topic = String(body.topic ?? "").slice(0, 500);
      if (!topic) return json(400, { error: "Topic is required" });

      const result = await callAI(
        [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate 4-6 concrete student project ideas for the topic: ${topic}. Mix difficulty levels. Each should be globally relevant and feasible for a small team.`,
          },
        ],
        IDEAS_SCHEMA,
      );
      return json(200, result);
    }

    if (action === "summarize") {
      const messages = Array.isArray(body.messages) ? body.messages : [];
      if (messages.length === 0) return json(400, { error: "No messages provided" });

      const transcript = messages
        .slice(-50)
        .map((m: any) => `${m.author ?? "User"}: ${String(m.text ?? "").slice(0, 500)}`)
        .join("\n");

      const result = await callAI(
        [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Summarize this team discussion. Extract decisions and next steps.\n\n${transcript}`,
          },
        ],
        SUMMARY_SCHEMA,
      );
      return json(200, result);
    }

    if (action === "moderate") {
      const message = String(body.message ?? "").slice(0, 2000);
      if (!message) return json(400, { error: "Message is required" });

      const result = await callAI(
        [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Moderate this chat message for an international student team. Flag toxicity, harassment, hate, spam, personal-info leaks, or seriously off-topic content. Be permissive of normal disagreement and casual chat.\n\nMessage: """${message}"""`,
          },
        ],
        MODERATE_SCHEMA,
      );
      return json(200, result);
    }

    return json(400, { error: `Unknown action: ${action}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg === "RATE_LIMIT") return json(429, { error: "AI rate limit reached. Try again shortly." });
    if (msg === "PAYMENT_REQUIRED") return json(402, { error: "AI credits exhausted." });
    console.error("collaborate error:", err);
    return json(500, { error: msg });
  }
});
