import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Atom } from "lucide-react";
import { useGames } from "@/hooks/useGames";

interface QA {
  q: string;
  options: string[];
  correct: number;
}

const MATCH: QA[] = [
  { q: "Best electrical conductor among these?", options: ["Copper", "Steel", "Alumina", "Polyethylene"], correct: 0 },
  { q: "Material with highest melting point?", options: ["Aluminum", "Tungsten", "Polycarbonate", "Glass"], correct: 1 },
  { q: "Most brittle material?", options: ["Rubber", "Copper", "Ceramic", "Mild steel"], correct: 2 },
  { q: "Used in jet turbine blades?", options: ["Nickel superalloy", "PVC", "Bronze", "Plywood"], correct: 0 },
  { q: "Best stiffness-to-weight composite?", options: ["Steel", "Carbon fiber", "Concrete", "Wood"], correct: 1 },
];

const PREDICT: QA[] = [
  { q: "Face-centered cubic crystals (FCC) are typically...", options: ["Brittle & hard", "Ductile & malleable", "Magnetic only", "Always transparent"], correct: 1 },
  { q: "Adding carbon to iron generally...", options: ["Lowers hardness", "Increases hardness", "Has no effect", "Removes magnetism"], correct: 1 },
  { q: "Thermoplastics differ from thermosets in that they...", options: ["Don't melt", "Can be re-melted", "Are always conductive", "Are ceramics"], correct: 1 },
];

const FAILURE: QA[] = [
  { q: "Repeated loading below yield → cracked shaft. Likely:", options: ["Creep", "Fatigue", "Corrosion", "Ductile overload"], correct: 1 },
  { q: "Pitting on stainless steel near coast. Likely:", options: ["Stress corrosion cracking", "Chloride pitting", "Hydrogen embrittlement", "Fatigue"], correct: 1 },
  { q: "High-temp turbine blade slowly elongating. Likely:", options: ["Creep", "Fatigue", "Pitting", "Galling"], correct: 0 },
];

const ALL: Record<string, QA[]> = { match: MATCH, predict: PREDICT, failure: FAILURE };

export default function MaterialsGame() {
  const [tab, setTab] = useState("match");
  const set = useMemo(() => ALL[tab], [tab]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const { submitRun } = useGames();

  const reset = () => {
    setIdx(0); setScore(0); setDone(false); setPicked(null);
  };

  const pick = (i: number) => {
    if (picked != null) return;
    setPicked(i);
    if (i === set[idx].correct) setScore((s) => s + 1);
    setTimeout(async () => {
      if (idx + 1 >= set.length) {
        const finalPct = Math.round(((score + (i === set[idx].correct ? 1 : 0)) / set.length) * 100);
        await submitRun("materials", finalPct, 0, { tab });
        setDone(true);
      } else {
        setIdx(idx + 1);
        setPicked(null);
      }
    }, 700);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-3xl mx-auto w-full">
        <Link to="/games" className="text-sm text-muted-foreground hover:text-primary">← Back to Games</Link>
        <header className="flex items-center gap-3 mb-6 mt-4">
          <Atom className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Material Science Game</h1>
            <p className="text-sm text-muted-foreground">Identify materials, predict properties, diagnose failures.</p>
          </div>
        </header>

        <Tabs value={tab} onValueChange={(v) => { setTab(v); reset(); }}>
          <TabsList>
            <TabsTrigger value="match">Match Materials</TabsTrigger>
            <TabsTrigger value="predict">Predict Property</TabsTrigger>
            <TabsTrigger value="failure">Failure Analysis</TabsTrigger>
          </TabsList>

          {Object.keys(ALL).map((k) => (
            <TabsContent key={k} value={k} className="mt-4">
              <Card className="p-6 space-y-4">
                {done ? (
                  <div className="text-center space-y-3">
                    <p className="text-3xl font-bold text-primary">{score}/{set.length}</p>
                    <p className="text-sm text-muted-foreground">Run complete — XP awarded.</p>
                    <Button onClick={reset}>Play again</Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Q {idx + 1}/{set.length}</Badge>
                      <Badge>Score {score}</Badge>
                    </div>
                    <p className="text-base font-medium">{set[idx].q}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {set[idx].options.map((o, i) => {
                        const isCorrect = picked != null && i === set[idx].correct;
                        const isWrong = picked === i && i !== set[idx].correct;
                        return (
                          <Button
                            key={i}
                            variant={isCorrect ? "default" : isWrong ? "destructive" : "outline"}
                            className="justify-start h-auto py-3 text-left"
                            onClick={() => pick(i)}
                            disabled={picked != null}
                          >
                            {o}
                          </Button>
                        );
                      })}
                    </div>
                  </>
                )}
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
