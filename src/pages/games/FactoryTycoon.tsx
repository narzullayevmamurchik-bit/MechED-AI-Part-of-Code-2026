import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Factory } from "lucide-react";
import {
  MACHINE_CATALOG,
  ENGINEER_COST,
  buyMachine,
  hireEngineer,
  newGame,
  scoreFactory,
  step,
  type FactoryState,
  type Machine,
} from "@/lib/sim/factory";
import { useGameState, useGames } from "@/hooks/useGames";

export default function FactoryTycoon() {
  const { state, save, loaded } = useGameState<FactoryState>("factory", newGame());
  const stateRef = useRef(state);
  const [running, setRunning] = useState(false);
  const { submitRun } = useGames();
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const next = step(stateRef.current);
      save(next);
    }, 1000);
    return () => clearInterval(id);
  }, [running, save]);

  if (!loaded) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const score = scoreFactory(state);
  const efficiency = Math.min(100, Math.round((Math.min(1, 0.5 + state.engineers * 0.15)) * 100));
  const totalOutput = state.machines.reduce((a, m) => a + m.output, 0);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <Link to="/games" className="text-sm text-muted-foreground hover:text-primary">← Back to Games</Link>
        <header className="flex items-center gap-3 mb-6 mt-4">
          <Factory className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">AI Factory Tycoon</h1>
            <p className="text-sm text-muted-foreground">Build, hire, optimize. Save persists across sessions.</p>
          </div>
        </header>

        <div className="grid md:grid-cols-4 gap-3 mb-6">
          <Stat label="Coins" value={`$${state.coins}`} />
          <Stat label="Tick" value={state.tick.toString()} />
          <Stat label="Output" value={`${totalOutput}/s`} />
          <Stat label="Efficiency" value={`${efficiency}%`} />
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <Button onClick={() => setRunning(!running)}>{running ? "Pause" : "Run"}</Button>
          <Button variant="outline" onClick={() => save(newGame())}>Reset</Button>
          <Button
            variant="secondary"
            onClick={async () => { await submitRun("factory", score, state.tick, { state }); setSubmitted(true); }}
            disabled={submitted}
          >
            {submitted ? "Submitted ✓" : `Submit score (${score})`}
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="font-bold mb-3">Buy machines</h3>
            <div className="space-y-2">
              {MACHINE_CATALOG.map((m) => (
                <div key={m.type} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                  <div>
                    <p className="font-semibold capitalize">{m.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">Output {m.output}/s · Energy {m.energy}</p>
                  </div>
                  <Button size="sm" disabled={state.coins < m.cost} onClick={() => save(buyMachine(state, m.type))}>
                    ${m.cost}
                  </Button>
                </div>
              ))}
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
                <div>
                  <p className="font-semibold">Hire engineer</p>
                  <p className="text-xs text-muted-foreground">Boosts efficiency. Wage 1.5/tick.</p>
                </div>
                <Button size="sm" disabled={state.coins < ENGINEER_COST} onClick={() => save(hireEngineer(state))}>
                  ${ENGINEER_COST}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold mb-3">Factory floor ({state.machines.length} machines)</h3>
            {state.machines.length === 0 ? (
              <p className="text-sm text-muted-foreground">Buy machines to start producing.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {state.machines.map((m: Machine) => (
                  <div key={m.id} className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-2xl">{m.type === "robot_cell" ? "🤖" : m.type === "cnc_line" ? "🔩" : "⚙️"}</p>
                    <p className="text-xs capitalize">{m.type.replace("_", " ")}</p>
                    <Badge variant="outline" className="text-[10px] mt-1">+{m.output}/s</Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-xs text-muted-foreground">
              Engineers: {state.engineers} · Revenue total: ${state.totalRevenue} · Units produced: {state.totalProduced}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="font-bold text-lg">{value}</p>
    </Card>
  );
}
