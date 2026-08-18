import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CareerTrack, type CareerStage } from "@/components/games/CareerTrack";
import { useGameState, useGames } from "@/hooks/useGames";
import { useGamification } from "@/hooks/useGamification";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sparkles, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

interface CareerSave {
  completed: string[];
  currentSlug: string | null;
  specialization: string | null;
}

interface Dilemma {
  scenario: string;
  choices: { label: string; outcome: string; score: number }[];
}

export default function CareerSimulator() {
  const [stages, setStages] = useState<CareerStage[]>([]);
  const [dilemma, setDilemma] = useState<Dilemma | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const { state, save, loaded } = useGameState<CareerSave>("career", {
    completed: [],
    currentSlug: null,
    specialization: null,
  });
  const { submitRun } = useGames();
  const { awardXp } = useGamification();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("career_milestones" as any)
        .select("*")
        .order("stage_order");
      setStages((data as any) ?? []);
    })();
  }, []);

  const generate = async (slug: string) => {
    setLoadingAI(true);
    setDilemma(null);
    const stage = stages.find((s) => s.slug === slug);
    try {
      const { data, error } = await supabase.functions.invoke("game-master", {
        body: { action: "career_dilemma", stage: stage?.title },
      });
      if (error) throw error;
      setDilemma(data as Dilemma);
    } catch (e) {
      // fallback
      setDilemma({
        scenario: `You're at the "${stage?.title}" stage. What do you do?`,
        choices: [
          { label: "Focus on coursework", outcome: "Solid academic record.", score: 8 },
          { label: "Take side project", outcome: "Built portfolio piece.", score: 6 },
          { label: "Skip and party", outcome: "Lost momentum.", score: -4 },
        ],
      });
    } finally {
      setLoadingAI(false);
    }
  };

  const pickStage = (slug: string) => {
    save({ ...state, currentSlug: slug });
    generate(slug);
  };

  const resolveChoice = async (choice: Dilemma["choices"][number]) => {
    if (!state.currentSlug) return;
    const stage = stages.find((s) => s.slug === state.currentSlug);
    if (!stage) return;
    const score = Math.max(0, 50 + choice.score * 5);
    await submitRun("career", score, 0, { stage: stage.slug, choice: choice.label });
    if (choice.score > 0) {
      await awardXp(stage.xp_reward, "collab_task_done", "learner", `career-${stage.slug}`, `Career: ${stage.title}`);
    }
    const next = {
      ...state,
      completed: [...new Set([...state.completed, stage.slug])],
      currentSlug: null,
    };
    save(next);
    toast({ title: choice.outcome, description: `Stage complete — score ${score}` });
    setDilemma(null);
  };

  if (!loaded || stages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const progressPct = Math.round((state.completed.length / stages.length) * 100);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full">
        <Link to="/games" className="text-sm text-muted-foreground hover:text-primary">
          ← Back to Games
        </Link>
        <header className="flex items-center gap-3 mb-6 mt-4">
          <GraduationCap className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Engineering Career Simulator</h1>
            <p className="text-sm text-muted-foreground">
              Progress {state.completed.length}/{stages.length} ({progressPct}%)
            </p>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-semibold uppercase mb-3 text-muted-foreground">Career Path</h2>
            <CareerTrack
              stages={stages}
              completed={state.completed}
              currentSlug={state.currentSlug}
              onPick={pickStage}
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase mb-3 text-muted-foreground">Current Decision</h2>
            {state.currentSlug == null ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                Pick a stage to start.
              </Card>
            ) : loadingAI ? (
              <Card className="p-6 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Generating dilemma...
              </Card>
            ) : dilemma ? (
              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">AI Game Master</p>
                </div>
                <p className="text-sm">{dilemma.scenario}</p>
                <div className="space-y-2">
                  {dilemma.choices.map((c, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="w-full justify-start h-auto py-3 text-left"
                      onClick={() => resolveChoice(c)}
                    >
                      {c.label}
                    </Button>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
