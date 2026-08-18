import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HardHat, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ScenarioCard } from "@/components/engineer-mode/ScenarioCard";
import { ScenarioRunner } from "@/components/engineer-mode/ScenarioRunner";
import { RunHistory } from "@/components/engineer-mode/RunHistory";
import {
  useEngineerMode,
  type Scenario,
  type ScenarioLevel,
  type ScenarioRun,
} from "@/hooks/useEngineerMode";
import { useGamification } from "@/hooks/useGamification";

const LEVEL_REQUIREMENTS: Record<ScenarioLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 5,
};

export default function EngineerMode() {
  const {
    scenarios,
    runs,
    loading,
    createRun,
    deleteRun,
    generateScenario,
  } = useEngineerMode();
  const { stats } = useGamification();
  const userLevel = stats?.level ?? 1;

  const [activeRun, setActiveRun] = useState<{ run: ScenarioRun; scenario: Scenario } | null>(null);
  const [level, setLevel] = useState<ScenarioLevel>("beginner");
  const [aiTopic, setAiTopic] = useState("");
  const [generating, setGenerating] = useState(false);

  const startScenario = async (scenario: Scenario, source: "curated" | "ai") => {
    const reqLevel = LEVEL_REQUIREMENTS[scenario.difficulty];
    if (userLevel < reqLevel) {
      toast.error(`Reach Level ${reqLevel} to unlock ${scenario.difficulty} scenarios`);
      return;
    }
    const run = await createRun(scenario, level, source);
    if (!run) {
      toast.error("Could not start the scenario");
      return;
    }
    setActiveRun({ run, scenario });
  };

  const handleGenerate = async () => {
    if (!aiTopic.trim()) {
      toast.error("Tell the AI what scenario you want");
      return;
    }
    setGenerating(true);
    try {
      const generated = await generateScenario(aiTopic.trim(), level);
      const scenario: Scenario = {
        ...generated,
        id: crypto.randomUUID(),
        difficulty: level,
        is_ai_generated: true,
        published: true,
        objectives: generated.objectives ?? [],
      };
      await startScenario(scenario, "ai");
      setAiTopic("");
    } catch (e: any) {
      toast.error(e?.message ?? "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <header className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <HardHat className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Engineer Mode</h1>
              <p className="text-sm text-muted-foreground">
                Step into a real industrial role. Make decisions. Get evaluated.
              </p>
            </div>
          </div>
          {!activeRun && (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Difficulty</span>
              <Select value={level} onValueChange={(v) => setLevel(v as ScenarioLevel)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner (guided)</SelectItem>
                  <SelectItem value="intermediate" disabled={userLevel < LEVEL_REQUIREMENTS.intermediate}>
                    Intermediate (hints) {userLevel < LEVEL_REQUIREMENTS.intermediate ? `· Lvl ${LEVEL_REQUIREMENTS.intermediate}` : ""}
                  </SelectItem>
                  <SelectItem value="advanced" disabled={userLevel < LEVEL_REQUIREMENTS.advanced}>
                    Advanced (no hints) {userLevel < LEVEL_REQUIREMENTS.advanced ? `· Lvl ${LEVEL_REQUIREMENTS.advanced}` : ""}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </header>

        {activeRun ? (
          <ScenarioRunner
            scenario={activeRun.scenario}
            run={activeRun.run}
            onExit={() => setActiveRun(null)}
          />
        ) : (
          <Tabs defaultValue="library">
            <TabsList>
              <TabsTrigger value="library">Scenario library</TabsTrigger>
              <TabsTrigger value="generate">AI generate</TabsTrigger>
              <TabsTrigger value="history">My runs ({runs.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="mt-4">
              {loading ? (
                <Card className="p-12 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </Card>
              ) : scenarios.length === 0 ? (
                <Card className="p-8 text-center text-sm text-muted-foreground">
                  No scenarios available yet.
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {scenarios.map((s) => (
                    <ScenarioCard
                      key={s.id}
                      scenario={s}
                      lockedReason={
                        userLevel < LEVEL_REQUIREMENTS[s.difficulty]
                          ? `Reach Level ${LEVEL_REQUIREMENTS[s.difficulty]} to unlock`
                          : undefined
                      }
                      onStart={(scenario) => startScenario(scenario, "curated")}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="generate" className="mt-4">
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">Generate a custom scenario</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Describe the situation you want to practice — e.g. "phosphorus removal in BOF",
                  "induction furnace power outage", "quench cracking in 4140 steel".
                </p>
                <div className="flex gap-2">
                  <Input
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="What scenario do you want to practice?"
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  />
                  <Button onClick={handleGenerate} disabled={generating} className="gap-2">
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Generate
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Difficulty: <strong className="capitalize">{level}</strong> · adjust via the
                  selector at the top right.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <RunHistory runs={runs} onDelete={deleteRun} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
