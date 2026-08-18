import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Microscope, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGames } from "@/hooks/useGames";

const QUESTS = [
  {
    id: "q1",
    title: "Hydrogen Embrittlement in High-Strength Steels",
    question: "Summarize the main mechanism of hydrogen embrittlement and propose two mitigation strategies for offshore fasteners.",
    context: "Focus on high-strength low-alloy (HSLA) bolts in marine environments.",
  },
  {
    id: "q2",
    title: "Additive Manufacturing of Ti-6Al-4V",
    question: "Compare laser powder bed fusion vs. electron beam melting for Ti-6Al-4V aerospace parts. Which gives better fatigue performance and why?",
    context: "Aerospace structural brackets.",
  },
  {
    id: "q3",
    title: "Predictive Maintenance with Vibration Data",
    question: "Outline a workflow using vibration spectra to detect bearing faults early. Mention key features and a suitable ML model.",
    context: "Industrial rotating equipment monitoring.",
  },
];

interface Grade {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export default function ResearchQuests() {
  const [selected, setSelected] = useState(QUESTS[0]);
  const [answer, setAnswer] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [loading, setLoading] = useState(false);
  const { submitRun } = useGames();

  const submit = async () => {
    if (answer.trim().length < 30) return;
    setLoading(true); setGrade(null);
    try {
      const { data, error } = await supabase.functions.invoke("game-master", {
        body: { action: "grade_research_answer", question: selected.question, answer, context: selected.context },
      });
      if (error) throw error;
      const parsed = (typeof data === "string" ? JSON.parse(data) : data) as Grade;
      setGrade(parsed);
      await submitRun("research", parsed.score, 0, { quest: selected.id });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full">
        <Link to="/games" className="text-sm text-muted-foreground hover:text-primary">← Back to Games</Link>
        <header className="flex items-center gap-3 mb-6 mt-4">
          <Microscope className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Research Quests</h1>
            <p className="text-sm text-muted-foreground">Analyze problems, write recommendations. AI grades your answer.</p>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            {QUESTS.map((q) => (
              <Card
                key={q.id}
                onClick={() => { setSelected(q); setGrade(null); setAnswer(""); }}
                className={`p-3 cursor-pointer hover:border-primary/40 ${selected.id === q.id ? "border-primary" : ""}`}
              >
                <p className="font-semibold text-sm">{q.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{q.question}</p>
              </Card>
            ))}
          </div>

          <Card className="p-5 lg:col-span-2 space-y-3">
            <Badge variant="outline">{selected.title}</Badge>
            <p className="text-sm">{selected.question}</p>
            <p className="text-xs text-muted-foreground italic">Context: {selected.context}</p>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write your analysis (minimum 30 chars)..."
              rows={8}
            />
            <Button onClick={submit} disabled={loading || answer.trim().length < 30}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit for AI grading"}
            </Button>

            {grade && (
              <div className="space-y-2 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <p className="font-bold">AI Grade</p>
                  <Badge>{grade.score}/100</Badge>
                </div>
                <p className="text-sm">{grade.feedback}</p>
                {grade.strengths?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Strengths</p>
                    <ul className="text-xs list-disc pl-5">{grade.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
                {grade.improvements?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Improvements</p>
                    <ul className="text-xs list-disc pl-5">{grade.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
