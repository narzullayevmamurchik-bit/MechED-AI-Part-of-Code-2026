import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Cog } from "lucide-react";
import { simulate, type CncInputs } from "@/lib/sim/cnc";
import { useGames } from "@/hooks/useGames";

export default function CncSimulator() {
  const [i, setI] = useState<CncInputs>({
    tool: "carbide",
    material: "mild_steel",
    rpm: 1200,
    feed: 0.2,
    depth: 1.5,
  });
  const r = useMemo(() => simulate(i), [i]);
  const { submitRun } = useGames();
  const [submitted, setSubmitted] = useState(false);
  const u = <K extends keyof CncInputs>(k: K, v: CncInputs[K]) => {
    setSubmitted(false);
    setI((p) => ({ ...p, [k]: v }));
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <Link to="/games" className="text-sm text-muted-foreground hover:text-primary">← Back to Games</Link>
        <header className="flex items-center gap-3 mb-6 mt-4">
          <Cog className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">CNC Machining Simulator</h1>
            <p className="text-sm text-muted-foreground">Tune cutting parameters to maximize the composite score.</p>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tool</label>
                <Select value={i.tool} onValueChange={(v) => u("tool", v as CncInputs["tool"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hss">HSS</SelectItem>
                    <SelectItem value="carbide">Carbide</SelectItem>
                    <SelectItem value="ceramic">Ceramic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Material</label>
                <Select value={i.material} onValueChange={(v) => u("material", v as CncInputs["material"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aluminum">Aluminum</SelectItem>
                    <SelectItem value="mild_steel">Mild Steel</SelectItem>
                    <SelectItem value="stainless">Stainless</SelectItem>
                    <SelectItem value="titanium">Titanium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span>Spindle Speed</span><span>{i.rpm} RPM</span></div>
              <Slider min={200} max={4000} step={50} value={[i.rpm]} onValueChange={([v]) => u("rpm", v)} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span>Feed rate</span><span>{i.feed.toFixed(2)} mm/rev</span></div>
              <Slider min={0.05} max={1} step={0.01} value={[i.feed]} onValueChange={([v]) => u("feed", v)} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span>Depth of cut</span><span>{i.depth.toFixed(1)} mm</span></div>
              <Slider min={0.2} max={6} step={0.1} value={[i.depth]} onValueChange={([v]) => u("depth", v)} />
            </div>
            <Button className="w-full" onClick={async () => { await submitRun("cnc", r.score, 0, { ...i, result: r }); setSubmitted(true); }} disabled={submitted}>
              {submitted ? "Submitted ✓" : "Run & Submit"}
            </Button>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Results</h3>
              <Badge variant={r.score >= 70 ? "default" : "secondary"}>Score {r.score}/100</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Surface Ra" value={`${r.surfaceRa} μm`} good={r.surfaceRa < 3} />
              <Stat label="Tool life" value={`${r.toolLifeMin} min`} good={r.toolLifeMin > 10} />
              <Stat label="Cycle time" value={`${r.cycleTimeMin} min`} good={r.cycleTimeMin < 5} />
              <Stat label="MRR" value={`${r.productivity} mm³/min`} good={r.productivity > 200} />
              <Stat label="Rel. cost" value={`$${r.cost}`} good={r.cost < 10} />
            </div>
            <p className="text-xs text-muted-foreground">
              Balance speed, feed, and depth. High RPM with stainless or titanium kills tool life.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className={`p-2 rounded-lg ${good ? "bg-primary/10" : "bg-muted"}`}>
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}
