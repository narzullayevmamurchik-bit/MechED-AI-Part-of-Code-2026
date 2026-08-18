import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface DailyChallenge {
  challenge_date: string;
  prompt: string;
  challenge_type: string;
  payload: { question?: string; options?: string[]; correct_idx?: number; explanation?: string };
  xp_reward: number;
}

export default function DailyChallenge() {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<number | null>(null);
  const [claimed, setClaimed] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => { void load(); }, [user]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("daily_challenges" as any)
      .select("*")
      .eq("challenge_date", today)
      .maybeSingle();

    if (!data) {
      // generate on demand
      try {
        const { data: ai, error } = await supabase.functions.invoke("game-master", {
          body: { action: "generate_daily" },
        });
        if (error) throw error;
        const parsed = typeof ai === "string" ? JSON.parse(ai) : ai;
        // store via insert (anyone authed can't, so just keep client-side fallback)
        setChallenge({
          challenge_date: today,
          prompt: parsed.prompt || "Engineering challenge",
          challenge_type: parsed.type || "quiz",
          payload: parsed.payload || {},
          xp_reward: 50,
        });
      } catch (e) {
        console.error(e);
        setChallenge(null);
      }
    } else {
      setChallenge(data as any);
    }

    if (user) {
      const { data: att } = await supabase
        .from("daily_challenge_attempts" as any)
        .select("user_id")
        .eq("user_id", user.id)
        .eq("challenge_date", today)
        .maybeSingle();
      if (att) setClaimed(true);
    }

    setLoading(false);
  };

  const pick = async (i: number) => {
    if (picked != null || claimed || !challenge) return;
    setPicked(i);
    const right = i === challenge.payload.correct_idx;
    const score = right ? 100 : 0;
    try {
      const { data, error } = await supabase.rpc("claim_daily_challenge" as any, {
        _score: score,
        _metadata: { picked: i },
      });
      if (error) throw error;
      const r = data as { xp: number };
      toast({ title: right ? "Correct!" : "Not quite.", description: `+${r.xp} XP awarded.` });
      setClaimed(true);
    } catch (e) {
      toast({ title: "Could not claim", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-3xl mx-auto w-full">
        <Link to="/games" className="text-sm text-muted-foreground hover:text-primary">← Back to Games</Link>
        <header className="flex items-center gap-3 mb-6 mt-4">
          <Sparkles className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Daily Challenge</h1>
            <p className="text-sm text-muted-foreground">One new engineering problem every day.</p>
          </div>
        </header>

        <Card className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading today's challenge...
            </div>
          ) : !challenge ? (
            <p className="text-sm text-muted-foreground">No challenge available right now. Come back later.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Badge>{challenge.challenge_type}</Badge>
                <Badge variant="outline">+{challenge.xp_reward} XP max</Badge>
              </div>
              <p className="font-medium">{challenge.payload.question || challenge.prompt}</p>
              {challenge.payload.options && (
                <div className="space-y-2">
                  {challenge.payload.options.map((o, i) => {
                    const isCorrect = picked != null && i === challenge.payload.correct_idx;
                    const isWrong = picked === i && !isCorrect;
                    return (
                      <Button
                        key={i}
                        variant={isCorrect ? "default" : isWrong ? "destructive" : "outline"}
                        className="w-full justify-start h-auto py-3 text-left whitespace-normal"
                        onClick={() => pick(i)}
                        disabled={picked != null || claimed}
                      >
                        <span className="font-mono text-xs mr-2">{String.fromCharCode(65 + i)}.</span> {o}
                      </Button>
                    );
                  })}
                </div>
              )}
              {claimed && (
                <p className="text-sm text-primary font-semibold">✓ Claimed for today. Come back tomorrow!</p>
              )}
              {picked != null && challenge.payload.explanation && (
                <p className="text-xs text-muted-foreground border-l-2 border-primary pl-3">
                  {challenge.payload.explanation}
                </p>
              )}
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
