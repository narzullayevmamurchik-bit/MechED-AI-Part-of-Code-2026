import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ScenarioLevel = "beginner" | "intermediate" | "advanced";
export type RunStatus = "in_progress" | "completed" | "abandoned";

export interface ScenarioOption {
  id: string;
  label: string;
  description: string;
}
export interface ScenarioStep {
  id: string;
  prompt: string;
  options: ScenarioOption[];
  correct_option_id?: string;
  rationale?: string;
  hints?: string[];
}
export interface Scenario {
  id: string;
  slug?: string | null;
  title: string;
  role: string;
  domain: string;
  difficulty: ScenarioLevel;
  problem_statement: string;
  context?: string | null;
  objectives: string[];
  success_criteria?: string | null;
  estimated_minutes: number;
  steps: ScenarioStep[];
  is_ai_generated?: boolean;
  published?: boolean;
}

export interface ScenarioRun {
  id: string;
  user_id: string;
  scenario_id: string | null;
  scenario_snapshot: Scenario | null;
  level: ScenarioLevel;
  status: RunStatus;
  score: number | null;
  max_score: number;
  ai_summary: string | null;
  ai_insights: string[] | null;
  source: "curated" | "ai";
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface ScenarioDecision {
  id: string;
  run_id: string;
  step_index: number;
  step_prompt: string | null;
  chosen_option_id: string | null;
  chosen_label: string | null;
  is_correct: boolean | null;
  points: number;
  ai_feedback: string | null;
  consequences: string | null;
  better_solution: string | null;
  created_at: string;
}

export interface EvaluationResult {
  is_correct: boolean;
  points: number;
  ai_feedback: string;
  consequences: string;
  better_solution: string;
}

export interface SummaryResult {
  score: number;
  ai_summary: string;
  ai_insights: string[];
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/engineer-mode`;

async function invokeFn<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const resp = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err?.error ?? `HTTP ${resp.status}`);
  }
  return (await resp.json()) as T;
}

export function useEngineerMode() {
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [runs, setRuns] = useState<ScenarioRun[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshScenarios = useCallback(async () => {
    const { data, error } = await supabase
      .from("scenarios")
      .select("*")
      .eq("published", true)
      .order("difficulty")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("scenarios load failed:", error);
      return;
    }
    setScenarios((data as unknown as Scenario[]) || []);
  }, []);

  const refreshRuns = useCallback(async () => {
    if (!user) {
      setRuns([]);
      return;
    }
    const { data, error } = await supabase
      .from("scenario_runs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.warn("runs load failed:", error);
      return;
    }
    setRuns((data as unknown as ScenarioRun[]) || []);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    Promise.all([refreshScenarios(), refreshRuns()]).finally(() => setLoading(false));
  }, [refreshScenarios, refreshRuns]);

  const createRun = useCallback(
    async (scenario: Scenario, level: ScenarioLevel, source: "curated" | "ai") => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("scenario_runs")
        .insert({
          user_id: user.id,
          scenario_id: source === "curated" ? scenario.id : null,
          scenario_snapshot: scenario as unknown as never,
          level,
          source,
          status: "in_progress" as RunStatus,
        } as never)
        .select()
        .single();
      if (error) {
        console.warn("createRun failed:", error);
        return null;
      }
      const run = data as unknown as ScenarioRun;
      setRuns((prev) => [run, ...prev]);
      return run;
    },
    [user]
  );

  const recordDecision = useCallback(
    async (
      run: ScenarioRun,
      stepIndex: number,
      step: ScenarioStep,
      option: ScenarioOption,
      evaluation: EvaluationResult
    ) => {
      const { data, error } = await supabase
        .from("scenario_decisions")
        .insert({
          run_id: run.id,
          step_index: stepIndex,
          step_prompt: step.prompt,
          chosen_option_id: option.id,
          chosen_label: option.label,
          is_correct: evaluation.is_correct,
          points: evaluation.points,
          ai_feedback: evaluation.ai_feedback,
          consequences: evaluation.consequences,
          better_solution: evaluation.better_solution,
        } as never)
        .select()
        .single();
      if (error) {
        console.warn("recordDecision failed:", error);
        return null;
      }
      // Award per-decision XP (small, dedupe by run+step)
      if (user && evaluation.points > 0) {
        try {
          await supabase.rpc("award_xp" as any, {
            _user_id: user.id,
            _amount: Math.round(evaluation.points / 10),
            _source: "scenario_decision",
            _category: "engineer",
            _source_id: `${run.id}-${stepIndex}`,
            _reason: "Scenario decision points",
            _awarded_by: null,
            _dedupe: true,
          });
        } catch (e) {
          console.warn("decision XP failed:", e);
        }
      }
      return data as unknown as ScenarioDecision;
    },
    [user]
  );

  const completeRun = useCallback(
    async (runId: string, summary: SummaryResult) => {
      const { error } = await supabase
        .from("scenario_runs")
        .update({
          status: "completed" as RunStatus,
          score: summary.score,
          ai_summary: summary.ai_summary,
          ai_insights: summary.ai_insights,
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId);
      if (error) console.warn("completeRun failed:", error);

      // Gamification on run completion
      if (user) {
        try {
          const completionXp = 50 + Math.round(summary.score);
          await supabase.rpc("award_xp" as any, {
            _user_id: user.id,
            _amount: completionXp,
            _source: "scenario_complete",
            _category: "engineer",
            _source_id: runId,
            _reason: `Completed scenario (score ${Math.round(summary.score)})`,
            _awarded_by: null,
            _dedupe: true,
          });
          await supabase.rpc("record_daily_activity" as any, { _user_id: user.id });

          // Milestone badges
          const { count } = await supabase
            .from("scenario_runs")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "completed");
          const total = count ?? 0;
          const codes: string[] = [];
          if (total === 1) codes.push("first_scenario");
          if (total >= 5) codes.push("scenario_5");
          if (summary.score >= 100) codes.push("perfect_run");

          // Advanced run badge: need to know level — fetch the run
          const { data: runRow } = await supabase
            .from("scenario_runs")
            .select("level, score")
            .eq("id", runId)
            .maybeSingle();
          if (runRow && (runRow as any).level === "advanced" && summary.score >= 80) {
            codes.push("scenario_advanced");
          }

          for (const code of codes) {
            await supabase.rpc("unlock_badge" as any, { _user_id: user.id, _badge_code: code });
          }
        } catch (e) {
          console.warn("Run completion XP failed:", e);
        }
      }

      await refreshRuns();
    },
    [refreshRuns, user]
  );

  const abandonRun = useCallback(async (runId: string) => {
    await supabase
      .from("scenario_runs")
      .update({ status: "abandoned" as RunStatus })
      .eq("id", runId);
    await refreshRuns();
  }, [refreshRuns]);

  const deleteRun = useCallback(async (runId: string) => {
    await supabase.from("scenario_runs").delete().eq("id", runId);
    setRuns((prev) => prev.filter((r) => r.id !== runId));
  }, []);

  const generateScenario = useCallback(
    (topic: string, level: ScenarioLevel) =>
      invokeFn<Scenario>("generate", { topic, level }),
    []
  );

  const evaluateDecision = useCallback(
    (scenario: Scenario, step: ScenarioStep, option: ScenarioOption) =>
      invokeFn<EvaluationResult>("evaluate", {
        scenario,
        step,
        choice: { option_id: option.id, label: option.label },
      }),
    []
  );

  const summarizeRun = useCallback(
    (scenario: Scenario, decisions: ScenarioDecision[]) =>
      invokeFn<SummaryResult>("summarize", { scenario, decisions }),
    []
  );

  const loadDecisions = useCallback(async (runId: string) => {
    const { data, error } = await supabase
      .from("scenario_decisions")
      .select("*")
      .eq("run_id", runId)
      .order("step_index");
    if (error) {
      console.warn("loadDecisions failed:", error);
      return [];
    }
    return (data as unknown as ScenarioDecision[]) || [];
  }, []);

  return {
    loading,
    scenarios,
    runs,
    refreshScenarios,
    refreshRuns,
    createRun,
    recordDecision,
    completeRun,
    abandonRun,
    deleteRun,
    generateScenario,
    evaluateDecision,
    summarizeRun,
    loadDecisions,
  };
}
