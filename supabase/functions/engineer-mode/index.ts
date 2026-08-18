import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

const SYSTEM_PROMPT = `You are the AI Engineer Mode coach for the MechEd platform.
You simulate real industrial engineering scenarios (steelmaking, casting, heat treatment, materials).
You think like a seasoned plant engineer: practical, safety-first, cost-aware.
You ALWAYS reply with VALID JSON only — no prose outside the JSON object.
Never invent unsafe practices. When the user picks a sub-optimal option, explain consequences clearly and recommend the better path.`;

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

const GENERATE_SCHEMA = {
  name: "create_scenario",
  description: "Generate an immersive engineering scenario.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string" },
      role: { type: "string" },
      domain: { type: "string" },
      problem_statement: { type: "string" },
      context: { type: "string" },
      objectives: { type: "array", items: { type: "string" } },
      success_criteria: { type: "string" },
      estimated_minutes: { type: "number" },
      steps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            prompt: { type: "string" },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  label: { type: "string" },
                  description: { type: "string" },
                },
                required: ["id", "label", "description"],
              },
            },
            correct_option_id: { type: "string" },
            rationale: { type: "string" },
            hints: { type: "array", items: { type: "string" } },
          },
          required: ["id", "prompt", "options", "correct_option_id", "rationale"],
        },
      },
    },
    required: [
      "title", "role", "domain", "problem_statement", "context",
      "objectives", "success_criteria", "estimated_minutes", "steps",
    ],
  },
};

const EVALUATE_SCHEMA = {
  name: "evaluate_decision",
  description: "Evaluate a single decision in an engineering scenario.",
  parameters: {
    type: "object",
    properties: {
      is_correct: { type: "boolean" },
      points: { type: "number", description: "0 to 100, partial credit allowed" },
      ai_feedback: { type: "string", description: "Concise mentor feedback (2-3 sentences)" },
      consequences: { type: "string", description: "Real-world consequence of this choice" },
      better_solution: { type: "string", description: "Recommended path if not optimal; empty if already optimal" },
    },
    required: ["is_correct", "points", "ai_feedback", "consequences", "better_solution"],
  },
};

const SUMMARY_SCHEMA = {
  name: "summarize_run",
  description: "Summarize the full scenario run.",
  parameters: {
    type: "object",
    properties: {
      score: { type: "number", description: "Final 0..100 score" },
      ai_summary: { type: "string", description: "2-4 sentence overall summary" },
      ai_insights: {
        type: "array",
        items: { type: "string" },
        description: "3-5 actionable engineering takeaways",
      },
    },
    required: ["score", "ai_summary", "ai_insights"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const sb = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await sb.auth.getUser();
    const user = userData?.user;
    if (!user) return json(401, { error: "Not authenticated" });

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;

    // ---------- generate ----------
    if (action === "generate") {
      const { topic, level } = body ?? {};
      const result = await callAI(
        [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Create a ${level || "intermediate"} difficulty engineering scenario about: ${topic || "metallurgy plant operations"}.
Make it realistic and decision-rich. Provide 3-4 steps, each with 3 options. Use option ids "a","b","c","d".`,
          },
        ],
        GENERATE_SCHEMA
      );
      return json(200, result);
    }

    // ---------- evaluate ----------
    if (action === "evaluate") {
      const { scenario, step, choice } = body ?? {};
      if (!scenario || !step || !choice) return json(400, { error: "Missing scenario/step/choice" });

      const result = await callAI(
        [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Scenario: ${scenario.title}
Role: ${scenario.role}
Problem: ${scenario.problem_statement}
Context: ${scenario.context ?? ""}

Step prompt: ${step.prompt}
All options: ${JSON.stringify(step.options)}
Correct option id (reference): ${step.correct_option_id ?? "n/a"}
User chose option id "${choice.option_id}" (label: "${choice.label}").

Evaluate the user's decision as a real plant engineer would. Award partial credit if reasoning is sound but not optimal.`,
          },
        ],
        EVALUATE_SCHEMA
      );
      return json(200, result);
    }

    // ---------- summarize ----------
    if (action === "summarize") {
      const { scenario, decisions } = body ?? {};
      if (!scenario || !Array.isArray(decisions)) return json(400, { error: "Missing scenario/decisions" });

      const result = await callAI(
        [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Scenario: ${scenario.title} — ${scenario.problem_statement}
User decisions:
${decisions
  .map(
    (d: any, i: number) =>
      `${i + 1}. Q: ${d.step_prompt}\n   Chose: ${d.chosen_label} | correct=${d.is_correct} | points=${d.points}\n   Feedback: ${d.ai_feedback}`
  )
  .join("\n")}

Produce a final score (average of points, 0..100) and 3-5 specific engineering takeaways.`,
          },
        ],
        SUMMARY_SCHEMA
      );
      return json(200, result);
    }

    return json(400, { error: "Unknown action" });
  } catch (e: any) {
    if (e?.message === "RATE_LIMIT")
      return json(429, { error: "Rate limit exceeded. Please try again in a moment." });
    if (e?.message === "PAYMENT_REQUIRED")
      return json(402, { error: "AI credits exhausted. Please contact admin." });
    console.error("engineer-mode error:", e);
    return json(500, { error: e?.message ?? "Unknown error" });
  }
});
