import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Puzzle, ArrowUp, ArrowDown } from "lucide-react";
import { useGames } from "@/hooks/useGames";

interface ProductionStep {
  id: string;
  label: string;
  order: number;
}

const CORRECT_ORDER = [
  "Raw material intake",
  "Cutting / Forming",
  "Heat treatment",
  "Machining",
  "Surface finish",
  "Quality inspection",
  "Packaging & shipping",
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function PuzzlesHub() {
  const [steps, setSteps] = useState<ProductionStep[]>(
    shuffle(CORRECT_ORDER).map((label, i) => ({ id: String(i), label, order: i }))
  );
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const { submitRun } = useGames();

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    setSteps(next);
  };

  const check = async () => {
    let correct = 0;
    steps.forEach((s, i) => {
      if (s.label === CORRECT_ORDER[i]) correct++;
    });
    const pct = Math.round((correct / CORRECT_ORDER.length) * 100);
    setScore(pct);
    setSubmitted(true);
    await submitRun("puzzles", pct, 0, { puzzle: "production_order" });
  };

  const reset = () => {
    setSteps(shuffle(CORRECT_ORDER).map((label, i) => ({ id: String(i), label, order: i })));
    setSubmitted(false);
    setScore(null);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-3xl mx-auto w-full">
        <Link to="/games" className="text-sm text-muted-foreground hover:text-primary">← Back to Games</Link>
        <header className="flex items-center gap-3 mb-6 mt-4">
          <Puzzle className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Engineering Puzzles</h1>
            <p className="text-sm text-muted-foreground">Production Line Optimization — order the steps correctly.</p>
          </div>
        </header>

        <Card className="p-5 space-y-3">
          {steps.map((s, i) => {
            const isCorrect = submitted && s.label === CORRECT_ORDER[i];
            const isWrong = submitted && !isCorrect;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isCorrect ? "border-primary bg-primary/5" : isWrong ? "border-destructive bg-destructive/5" : "border-border bg-muted"
                }`}
              >
                <Badge variant="outline" className="font-mono">{i + 1}</Badge>
                <p className="flex-1 text-sm">{s.label}</p>
                <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={submitted || i === 0}>
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={submitted || i === steps.length - 1}>
                  <ArrowDown className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
          <div className="flex gap-2 pt-2">
            {!submitted ? (
              <Button onClick={check} className="flex-1">Submit</Button>
            ) : (
              <>
                <p className="flex-1 font-semibold">Score: {score}/100</p>
                <Button variant="outline" onClick={reset}>Try again</Button>
              </>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
