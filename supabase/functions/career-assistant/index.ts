// AI Career Assistant — suggests skills, courses, and career paths based on student activity.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReqBody {
  action: "career_advice" | "evaluate_skills" | "match_jobs";
  job_id?: string;
  goal?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace("Bearer ", "");
    const supaUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: userErr } = await supaUser.auth.getUser(jwt);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = (await req.json()) as ReqBody;

    // Gather activity context
    const [progressRes, runsRes, gamRes, badgesRes, activityRes, skillsRes, profileRes] = await Promise.all([
      supa.from("user_progress").select("lesson_id, completed_at").eq("user_id", userId).limit(200),
      supa.from("scenario_runs").select("level, score, max_score, status, completed_at").eq("user_id", userId).limit(50),
      supa.from("user_gamification").select("*").eq("user_id", userId).maybeSingle(),
      supa.from("user_badges").select("badge:badges(name, code, category)").eq("user_id", userId),
      supa.from("user_activity").select("activity_type, item_type, tags").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
      supa.from("user_skills").select("*").eq("user_id", userId),
      supa.from("profiles").select("display_name, headline, bio, country, manual_skills").eq("user_id", userId).maybeSingle(),
    ]);

    const lessonsCount = progressRes.data?.length ?? 0;
    const scenarios = runsRes.data ?? [];
    const gam = gamRes.data;
    const badges = (badgesRes.data ?? []).map((b: any) => b.badge?.name).filter(Boolean);
    const tagFreq: Record<string, number> = {};
    (activityRes.data ?? []).forEach((a: any) => {
      (a.tags ?? []).forEach((t: string) => { tagFreq[t] = (tagFreq[t] ?? 0) + 1; });
    });
    const topTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t);

    if (body.action === "evaluate_skills") {
      // Heuristic + AI: derive skills with proficiency from activity tags + scenario performance.
      const completedScenarios = scenarios.filter((s: any) => s.status === "completed");
      const avgScorePct = completedScenarios.length
        ? Math.round((completedScenarios.reduce((s: number, x: any) => s + (Number(x.score ?? 0) / Number(x.max_score ?? 100)) * 100, 0) / completedScenarios.length))
        : 0;
      const advancedRuns = completedScenarios.filter((s: any) => s.level === "advanced").length;

      const baseSkills: { skill: string; score: number }[] = topTags.map((tag) => {
        const occurrences = tagFreq[tag] ?? 1;
        const score = Math.min(100, occurrences * 8 + (gam?.engineer_xp ?? 0) / 50 + advancedRuns * 5);
        return { skill: tag, score };
      });

      const evaluated = baseSkills.map((s) => {
        const adjusted = Math.round(Math.min(100, s.score + avgScorePct * 0.2));
        const proficiency = adjusted >= 70 ? "advanced" : adjusted >= 40 ? "intermediate" : "beginner";
        return { skill: s.skill, score: adjusted, proficiency, source: "ai" as const };
      });

      // Upsert into user_skills
      if (evaluated.length) {
        await supa.from("user_skills").upsert(
          evaluated.map((e) => ({
            user_id: userId,
            skill: e.skill,
            score: e.score,
            proficiency: e.proficiency,
            source: e.source,
            evidence: { lessons: lessonsCount, scenarios: completedScenarios.length, avg_score_pct: avgScorePct, advanced_runs: advancedRuns },
            updated_at: new Date().toISOString(),
          })),
          { onConflict: "user_id,skill" },
        );
      }

      return new Response(JSON.stringify({ skills: evaluated, summary: { lessonsCount, scenarios: completedScenarios.length, avgScorePct, advancedRuns } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For AI-powered career advice / job match
    const profile = profileRes.data ?? {};
    const skills = skillsRes.data ?? [];
    const userContext = {
      profile,
      level: gam?.level ?? 1,
      total_xp: gam?.total_xp ?? 0,
      learner_xp: gam?.learner_xp ?? 0,
      engineer_xp: gam?.engineer_xp ?? 0,
      contributor_xp: gam?.contributor_xp ?? 0,
      streak: gam?.current_streak ?? 0,
      lessons_completed: lessonsCount,
      scenarios_completed: scenarios.filter((s: any) => s.status === "completed").length,
      badges,
      top_tags: topTags,
      skills: skills.map((s: any) => ({ skill: s.skill, proficiency: s.proficiency })),
      goal: body.goal,
    };

    let systemPrompt = "";
    let userPrompt = "";

    if (body.action === "career_advice") {
      systemPrompt = `You are an expert career advisor for engineering students (metallurgy, materials science, mechanical engineering, AI in industry). Reply in concise markdown. Use second person, encouraging tone. Tailor advice to the user's actual activity and current level. Avoid generic boilerplate.`;
      userPrompt = `Based on this student activity, suggest:
1. **Career Paths** — 2-3 realistic engineering roles aligned to their strengths.
2. **Skills to Develop** — top 5 specific skills they should learn next, with why.
3. **Recommended Courses** — match against typical metallurgy/engineering topics.
4. **Next Steps** — 3 concrete actions for the next 30 days.

Activity context:
\`\`\`json
${JSON.stringify(userContext, null, 2)}
\`\`\``;
    } else if (body.action === "match_jobs") {
      const { data: job } = await supa.from("jobs").select("*, company:companies(name, industry, country)").eq("id", body.job_id).maybeSingle();
      if (!job) {
        return new Response(JSON.stringify({ error: "Job not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Pull recent activity (with item_id) + portfolio projects + recent runs to build evidence refs
      const [actDetailRes, portfolioRes, courseListRes, scenarioListRes, resourceListRes] = await Promise.all([
        supa.from("user_activity").select("activity_type, item_type, item_id, tags, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(150),
        supa.from("portfolio_projects").select("id, title, tags").eq("user_id", userId),
        supa.from("courses").select("id, slug, title").eq("published", true),
        supa.from("scenarios").select("id, slug, title, role, domain").eq("published", true),
        supa.from("resources").select("id, title, type, category, difficulty, url"),
      ]);
      const activityDetail = actDetailRes.data ?? [];
      const portfolio = portfolioRes.data ?? [];
      const allCourses = courseListRes.data ?? [];
      const allScenarios = scenarioListRes.data ?? [];
      const allResources = resourceListRes.data ?? [];

      // Deterministic skill comparison BEFORE asking AI for narrative
      const required: string[] = (job.required_skills ?? []).map((s: string) => s.toLowerCase());
      const userSkillMap = new Map<string, { proficiency: string; score: number }>();
      (skills ?? []).forEach((s: any) => userSkillMap.set(s.skill.toLowerCase(), { proficiency: s.proficiency, score: s.score }));
      topTags.forEach((t) => {
        const k = t.toLowerCase();
        if (!userSkillMap.has(k)) userSkillMap.set(k, { proficiency: "beginner", score: Math.min(60, (tagFreq[t] ?? 1) * 8) });
      });

      // Build evidence references for each user skill — points to courses, scenarios, projects
      const refsForSkill = (skillKey: string) => {
        const k = skillKey.toLowerCase();
        const refs: { type: "course" | "scenario" | "project" | "activity"; id: string; label: string; href: string }[] = [];
        // Portfolio projects whose tags match
        portfolio.forEach((p: any) => {
          if ((p.tags ?? []).some((t: string) => t.toLowerCase().includes(k) || k.includes(t.toLowerCase()))) {
            refs.push({ type: "project", id: p.id, label: p.title, href: `/portfolio/me` });
          }
        });
        // Recent activity items (courses/scenarios) tagged with this skill
        const seen = new Set<string>();
        activityDetail.forEach((a: any) => {
          if (!(a.tags ?? []).some((t: string) => t.toLowerCase().includes(k) || k.includes(t.toLowerCase()))) return;
          const key = `${a.item_type}:${a.item_id}`;
          if (seen.has(key)) return;
          seen.add(key);
          if (a.item_type === "course") {
            const c = allCourses.find((x: any) => x.id === a.item_id || x.slug === a.item_id);
            if (c) refs.push({ type: "course", id: c.id, label: c.title, href: `/courses/${c.slug ?? c.id}` });
          } else if (a.item_type === "scenario") {
            const s = allScenarios.find((x: any) => x.id === a.item_id || x.slug === a.item_id);
            if (s) refs.push({ type: "scenario", id: s.id, label: s.title, href: `/engineer-mode` });
          }
        });
        return refs.slice(0, 4);
      };

      // Suggest learning resources for each gap skill
      const resourcesForGap = (skillKey: string) => {
        const k = skillKey.toLowerCase();
        return allResources
          .filter((r: any) => {
            const hay = `${r.title} ${r.category} ${r.description ?? ""}`.toLowerCase();
            return hay.includes(k) || k.split(/[_\s]+/).some((part) => part.length > 3 && hay.includes(part));
          })
          .slice(0, 3)
          .map((r: any) => ({ id: r.id, title: r.title, type: r.type, url: r.url, difficulty: r.difficulty }));
      };
      const coursesForGap = (skillKey: string) => {
        const k = skillKey.toLowerCase();
        return allCourses
          .filter((c: any) => `${c.title}`.toLowerCase().split(/\s+/).some((w: string) => w.includes(k) || k.includes(w)))
          .slice(0, 2)
          .map((c: any) => ({ id: c.id, title: c.title, href: `/courses/${c.slug ?? c.id}` }));
      };

      const matched: { skill: string; proficiency: string; score: number }[] = [];
      const gaps: string[] = [];
      required.forEach((req) => {
        const hit = userSkillMap.get(req);
        if (hit) matched.push({ skill: req, proficiency: hit.proficiency, score: hit.score });
        else gaps.push(req);
      });

      // Top transferable strengths (user skills not required but strong)
      const transferable = Array.from(userSkillMap.entries())
        .filter(([k]) => !required.includes(k))
        .map(([skill, v]) => ({ skill, ...v }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      // Heuristic fit score: 60% skill coverage + 25% proficiency depth + 15% level fit
      const coverage = required.length ? matched.length / required.length : 0.6;
      const depth = matched.length
        ? matched.reduce((s, m) => s + (m.proficiency === "advanced" ? 1 : m.proficiency === "intermediate" ? 0.6 : 0.3), 0) / matched.length
        : 0;
      const levelFit = Math.min(1, (gam?.level ?? 1) / Math.max(1, job.min_level ?? 1));
      const heuristicScore = Math.round(coverage * 60 + depth * 25 + levelFit * 15);

      systemPrompt = `You are a hiring-fit advisor. Reply ONLY with valid JSON (no markdown fences). Be honest, concise, and specific.`;
      userPrompt = `Compare this student to this job and respond as JSON with this exact shape:
{
  "fit_score": number (0-100),
  "fit_summary": string (one sentence reason),
  "top_matches": [ { "skill": string, "evidence": string } ],   // up to 5
  "transferable_strengths": [ { "skill": string, "why_relevant": string } ], // up to 3
  "gaps": [ { "skill": string, "how_to_close": string } ],      // up to 5
  "recommended_projects": [ { "title": string, "description": string, "skills_built": [string] } ], // exactly 3
  "application_tips": [string, string, string]
}

Heuristic baseline (use as anchor; you may adjust ±15):
- coverage=${(coverage * 100).toFixed(0)}% (${matched.length}/${required.length} required skills)
- depth=${(depth * 100).toFixed(0)}%, level_fit=${(levelFit * 100).toFixed(0)}%, baseline_score=${heuristicScore}

## Job
${JSON.stringify({ title: job.title, type: job.type, min_level: job.min_level, required_skills: job.required_skills, description: job.description, company: job.company }, null, 2)}

## Student
${JSON.stringify({ ...userContext, matched_required: matched, missing_required: gaps, transferable_strengths: transferable }, null, 2)}`;
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        ...(body.action === "match_jobs" ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits to continue." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ai = await response.json();
    const content = ai?.choices?.[0]?.message?.content ?? "";

    if (body.action === "match_jobs") {
      // Parse JSON safely (strip code fences if AI added them)
      const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      let parsed: any = null;
      try { parsed = JSON.parse(cleaned); } catch (_e) {
        const m = cleaned.match(/\{[\s\S]*\}/);
        if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
      }
      if (!parsed) {
        return new Response(JSON.stringify({ error: "Could not parse fit response", raw: content }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Enrich with deterministic refs/resources from local data so UI can deep-link
      try {
        parsed.top_matches = (parsed.top_matches ?? []).map((m: any) => ({
          ...m,
          refs: refsForSkill(m.skill ?? ""),
        }));
        parsed.gaps = (parsed.gaps ?? []).map((g: any) => ({
          ...g,
          resources: resourcesForGap(g.skill ?? ""),
          courses: coursesForGap(g.skill ?? ""),
        }));
      } catch (e) {
        console.warn("enrichment failed", e);
      }
      return new Response(JSON.stringify({ fit: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ content, context: { skills: skills.length, level: gam?.level ?? 1 } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("career-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
