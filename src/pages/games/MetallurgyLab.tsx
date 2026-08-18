import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import { MicrostructureCanvas } from "@/components/games/MicrostructureCanvas";
import { useGames } from "@/hooks/useGames";
import {
  GRADE_KEYS,
  gradeInfo,
  simulate,
  scoreRun,
  type MetallurgyInputs,
  type Treatment,
} from "@/lib/sim/metallurgy";

export default function MetallurgyLab() {
  const [inputs, setInputs] = useState<MetallurgyInputs>({
    grade: GRADE_KEYS[1],
    carbon: 0.45,
    alloy: 1,
    temperature: 850,
    holdMinutes: 30,
    treatment: "quench",
  });
  const result = useMemo(() => simulate(inputs), [inputs]);
  const score = useMemo(() => scoreRun(inputs, result), [inputs, result]);
  const target = gradeInfo(inputs.grade).targetHRC;
  const { submitRun } = useGames();
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof MetallurgyInputs>(k: K, v: MetallurgyInputs[K]) => {
    setSubmitted(false);
    setInputs((p) => ({ ...p, [k]: v, ...(k === "grade" ? { carbon: gradeInfo(v as string).carbon } : {}) }));
  };

  const onSubmit = async () => {
    await submitRun("metallurgy-lab", score, 0, { ...inputs, result });
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <Link to="/games" className="text-sm text-muted-foreground hover:text-primary">← Back to Games</Link>
        <header className="flex items-center gap-3 mb-6 mt-4">
          <FlaskConical className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Virtual Metallurgy Lab</h1>
            <p className="text-sm text-muted-foreground">Heat-treat steel and analyze microstructure. Target {target} HRC.</p>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Steel Grade</label>
              <Select value={inputs.grade} onValueChange={(v) => update("grade", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADE_KEYS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Heat Treatment</label>
              <Select value={inputs.treatment} onValueChange={(v) => update("treatment", v as Treatment)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="anneal">Anneal (slow cool)</SelectItem>
                  <SelectItem value="normalize">Normalize (air cool)</SelectItem>
                  <SelectItem value="quench">Quench (water/oil)</SelectItem>
                  <SelectItem value="temper">Temper</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1"><span>Furnace Temperature</span><span>{inputs.temperature} °C</span></div>
              <Slider min={500} max={1100} step={10} value={[inputs.temperature]} onValueChange={([v]) => update("temperature", v)} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span>Hold Time</span><span>{inputs.holdMinutes} min</span></div>
              <Slider min={0} max={120} step={5} value={[inputs.holdMinutes]} onValueChange={([v]) => update("holdMinutes", v)} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span>Alloying %</span><span>{inputs.alloy.toFixed(1)}%</span></div>
              <Slider min={0} max={5} step={0.1} value={[inputs.alloy]} onValueChange={([v]) => update("alloy", v)} />
            </div>

            <Button className="w-full" onClick={onSubmit} disabled={submitted}>
              {submitted ? "Submitted ✓" : "Submit Run"}
            </Button>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Microstructure</h3>
              <Badge variant={score >= 70 ? "default" : "secondary"}>Score {score}/100</Badge>
            </div>
            <MicrostructureCanvas {...result} />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Hardness" value={`${result.hardnessHRC} HRC`} />
              <Stat label="Target" value={`${target} HRC`} />
              <Stat label="Ferrite" value={`${result.ferrite}%`} />
              <Stat label="Pearlite" value={`${result.pearlite}%`} />
              <Stat label="Martensite" value={`${result.martensite}%`} />
              <Stat label="Bainite" value={`${result.bainite}%`} />
            </div>
            {result.notes.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-1">
                {result.notes.map((n, i) => <li key={i}>• {n}</li>)}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-muted">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}
