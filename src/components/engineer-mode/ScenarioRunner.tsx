import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Target,
  Trophy,
  XCircle,
  X,
} from "lucide-react";
import type {
  EvaluationResult,
  Scenario,
  ScenarioDecision,
  ScenarioOption,
  ScenarioRun,
  SummaryResult,
} from "@/hooks/useEngineerMode";
import { useEngineerMode } from "@/hooks/useEngineerMode";
import { toast } from "sonner";

interface Props {
  scenario: Scenario;
  run: ScenarioRun;
  onExit: () => void;
}

export function ScenarioRunner({ scenario, run, onExit }: Props) {
  const { evaluateDecision, recordDecision, summarizeRun, completeRun, abandonRun } =
    useEngineerMode();

  const [stepIndex, setStepIndex] = useState(0);
  const [decisions, setDecisions] = useState<ScenarioDecision[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [lastEval, setLastEval] = useState<EvaluationResult | null>(null);
  const [chosenOption, setChosenOption] = useState<ScenarioOption | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  const totalSteps = scenario.steps.length;
  const step = scenario.steps[stepIndex];
  const showHints = run.level !== "advanced";
  const fullHints = run.level === "beginner";

  const earnedSoFar = useMemo(
    () => decisions.reduce((sum, d) => sum + (d.points ?? 0), 0),
    [decisions]
  );
  const maxSoFar = decisions.length * 100 || 1;
  const liveScore = Math.round((earnedSoFar / maxSoFar) * 100);

  useEffect(() => {
    return () => {
      // mark abandoned if user leaves mid-run without completing
      if (!summary && run.status === "in_progress") {
        void abandonRun(run.id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChoose = async (option: ScenarioOption) => {
    if (!step || evaluating) return;
    setChosenOption(option);
    setEvaluating(true);
    try {
      const evaluation = await evaluateDecision(scenario, step, option);
      setLastEval(evaluation);
      const saved = await recordDecision(run, stepIndex, step, option, evaluation);
      if (saved) setDecisions((prev) => [...prev, saved]);
    } catch (e: any) {
      toast.error(e?.message ?? "Evaluation failed");
      setChosenOption(null);
    } finally {
      setEvaluating(false);
    }
  };

  const handleNext = async () => {
    setLastEval(null);
    setChosenOption(null);
    if (stepIndex + 1 < totalSteps) {
      setStepIndex((i) => i + 1);
      return;
    }
    // final summary
    setFinalizing(true);
    try {
      const result = await summarizeRun(scenario, decisions);
      setSummary(result);
      await completeRun(run.id, result);
    } catch (e: any) {
      toast.error(e?.message ?? "Summary failed");
    } finally {
      setFinalizing(false);
    }
  };

  // ---------------- Final summary view ----------------
  if (summary) {
    return (
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Scenario complete</h2>
              <p className="text-sm text-muted-foreground">{scenario.title}</p>
            </div>
          </div>
          <Button variant="outline" onClick={onExit}>
            Back to scenarios
          </Button>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-muted-foreground">Final score</span>
            <span className="text-3xl font-bold text-primary">{Math.round(summary.score)}</span>
          </div>
          <Progress value={summary.score} />
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Summary</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{summary.ai_summary}</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" /> Engineering insights
          </h3>
          <ul className="space-y-2">
            {summary.ai_insights.map((insight, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                <span className="text-muted-foreground">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    );
  }

  if (finalizing) {
    return (
      <Card className="p-12 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Compiling final evaluation…</p>
      </Card>
    );
  }

  // ---------------- Active step view ----------------
  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {scenario.role}
          </p>
          <h2 className="text-xl font-bold mt-1">{scenario.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {run.level}
          </Badge>
          <Button variant="ghost" size="icon" onClick={onExit} title="Exit">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription className="text-sm">
          <strong>Problem:</strong> {scenario.problem_statement}
          {scenario.context && (
            <>
              <br />
              <span className="text-muted-foreground">{scenario.context}</span>
            </>
          )}
        </AlertDescription>
      </Alert>

      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>
            Step {stepIndex + 1} of {totalSteps}
          </span>
          <span className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Live score: <strong className="text-foreground">{decisions.length ? liveScore : 0}</strong>
          </span>
        </div>
        <Progress value={((stepIndex + (lastEval ? 1 : 0)) / totalSteps) * 100} />
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">{step?.prompt}</h3>

        {fullHints && step?.hints && step.hints.length > 0 && (
          <Alert className="bg-amber-500/5 border-amber-500/30">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <AlertDescription className="text-xs text-muted-foreground">
              <strong className="text-amber-600">Hint:</strong> {step.hints[0]}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-2">
          {step?.options.map((opt) => {
            const isChosen = chosenOption?.id === opt.id;
            const disabled = evaluating || !!lastEval;
            return (
              <button
                key={opt.id}
                onClick={() => handleChoose(opt)}
                disabled={disabled}
                className={`text-left p-4 rounded-xl border transition-all ${
                  isChosen
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-accent"
                } ${disabled && !isChosen ? "opacity-50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <span className="font-bold text-primary shrink-0">{opt.id.toUpperCase()}.</span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{opt.label}</p>
                    {showHints && (
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                    )}
                  </div>
                  {isChosen && evaluating && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary ml-auto shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {lastEval && (
        <Alert
          className={
            lastEval.is_correct
              ? "bg-emerald-500/5 border-emerald-500/30"
              : "bg-rose-500/5 border-rose-500/30"
          }
        >
          {lastEval.is_correct ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600" />
          )}
          <AlertDescription className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <strong className={lastEval.is_correct ? "text-emerald-700" : "text-rose-700"}>
                {lastEval.is_correct ? "Solid call" : "Suboptimal choice"}
              </strong>
              <Badge variant="outline">+{Math.round(lastEval.points)} pts</Badge>
            </div>
            <p className="text-muted-foreground">{lastEval.ai_feedback}</p>
            {lastEval.consequences && (
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Consequence:</strong> {lastEval.consequences}
              </p>
            )}
            {lastEval.better_solution && (
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Better path:</strong> {lastEval.better_solution}
              </p>
            )}
            <Button onClick={handleNext} size="sm" className="mt-2">
              {stepIndex + 1 < totalSteps ? "Next decision" : "Finish & see results"}
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
