import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Brain, Loader2, Trophy, Users, Swords, User as UserIcon, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGames } from "@/hooks/useGames";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ShieldAlert } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Q {
  question: string;
  options: string[];
  correct_idx: number;
  explanation?: string;
}

type Mode = "solo" | "multiplayer" | "tournament";
type Phase = "lobby" | "playing" | "results";

interface PlayerState {
  id: string;
  name: string;
  score: number;
  answered: number;
  totalMs: number;
  ready?: boolean;
  eliminated?: boolean;
}

const TOPICS = [
  "Metallurgy",
  "Material Science",
  "Mechanics",
  "Thermodynamics",
  "Manufacturing",
  "Mechatronics",
  "AI in Engineering",
];
const QUESTION_SECONDS = 20;
const QUESTION_COUNT = 10;
// Anti-cheat thresholds
const MIN_ANSWER_MS = 700; // answers faster than this are suspicious
const MAX_BLURS_PER_QUESTION = 2; // leaving tab too many times forfeits the question
const REPLAY_COOLDOWN_MS = 25_000; // prevent rapid replay farming
const SUSPICIOUS_REPLAY_WINDOW_MS = 5 * 60_000;
const SUSPICIOUS_REPLAY_COUNT = 4; // >=4 runs in 5min flags account
const CHEAT_XP_PENALTY = 0.4; // multiplier applied to score when flagged

function makeCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

async function generateQuiz(topic: string, difficulty: string, count: number): Promise<Q[]> {
  const { data, error } = await supabase.functions.invoke("game-master", {
    body: { action: "generate_quiz", topic, difficulty, count },
  });
  if (error) throw error;
  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  return (parsed.questions || []) as Q[];
}

export default function QuizArena() {
  const { user, displayName } = useAuth();
  const { submitRun } = useGames();

  const [mode, setMode] = useState<Mode>("solo");
  const [phase, setPhase] = useState<Phase>("lobby");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [difficulty, setDifficulty] = useState("normal");
  const [loading, setLoading] = useState(false);

  // Room
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Players
  const me: PlayerState = useMemo(
    () => ({ id: user?.id ?? "anon", name: displayName ?? "You", score: 0, answered: 0, totalMs: 0 }),
    [user?.id, displayName]
  );
  const [players, setPlayers] = useState<Record<string, PlayerState>>({});

  // Game
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [questionStart, setQuestionStart] = useState<number>(0);
  const [remaining, setRemaining] = useState(QUESTION_SECONDS);

  // Anti-cheat tracking (per-run)
  const [blursThisQuestion, setBlursThisQuestion] = useState(0);
  const [totalBlurs, setTotalBlurs] = useState(0);
  const [fastAnswers, setFastAnswers] = useState(0); // answers under MIN_ANSWER_MS
  const [forcedAnswers, setForcedAnswers] = useState(0); // forfeits from tab-switching
  const lastRunAtRef = useRef<number>(0);
  const recentRunsRef = useRef<number[]>([]);
  const [cheatLocked, setCheatLocked] = useState(false);

  // Tournament
  const [tRound, setTRound] = useState(1);
  const [tFinalRanks, setTFinalRanks] = useState<PlayerState[]>([]);

  // ---- Realtime helpers ----
  const broadcast = useCallback((event: string, payload: any) => {
    channelRef.current?.send({ type: "broadcast", event, payload });
  }, []);

  const updateMe = useCallback(
    (patch: Partial<PlayerState>) => {
      setPlayers((p) => {
        const cur = p[me.id] ?? me;
        const next = { ...cur, ...patch };
        const map = { ...p, [me.id]: next };
        channelRef.current?.track(next).catch(() => {});
        return map;
      });
    },
    [me]
  );

  const teardownChannel = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => () => teardownChannel(), [teardownChannel]);

  // ---- Timer ----
  useEffect(() => {
    if (phase !== "playing" || picked != null) return;
    setRemaining(QUESTION_SECONDS);
    setBlursThisQuestion(0);
    const start = Date.now();
    setQuestionStart(start);
    const t = setInterval(() => {
      const left = Math.max(0, QUESTION_SECONDS - Math.floor((Date.now() - start) / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(t);
        pick(-1, true);
      }
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, phase]);

  // ---- Anti-cheat: tab/window blur detection ----
  useEffect(() => {
    if (phase !== "playing" || picked != null) return;
    const onBlur = () => {
      setBlursThisQuestion((prev) => {
        const next = prev + 1;
        setTotalBlurs((b) => b + 1);
        if (next >= MAX_BLURS_PER_QUESTION) {
          toast({
            title: "Question forfeited",
            description: "Tab-switching detected during an active question.",
            variant: "destructive",
          });
          setForcedAnswers((f) => f + 1);
          // Force a wrong answer so they can't keep cheating
          setTimeout(() => pick(-1, true), 0);
        } else {
          toast({
            title: "Anti-cheat warning",
            description: `Stay on this tab during questions (${MAX_BLURS_PER_QUESTION - next} left).`,
          });
        }
        return next;
      });
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") onBlur();
    };
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, phase, picked]);

  // ---- Anti-cheat: block copy/paste/context-menu during play ----
  useEffect(() => {
    if (phase !== "playing") return;
    const block = (e: Event) => {
      e.preventDefault();
    };
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("contextmenu", block);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("contextmenu", block);
    };
  }, [phase]);

  // ---- Question advance / end ----
  const finishGame = useCallback(
    async (final: PlayerState[]) => {
      const ranked = [...final].sort((a, b) => b.score - a.score || a.totalMs - b.totalMs);
      setTFinalRanks(ranked);
      setPhase("results");
      const mine = ranked.find((p) => p.id === me.id);

      // ---- Anti-cheat: replay-rate tracking ----
      const now = Date.now();
      lastRunAtRef.current = now;
      recentRunsRef.current = [...recentRunsRef.current, now].filter(
        (t) => now - t < SUSPICIOUS_REPLAY_WINDOW_MS
      );
      const rapidReplay = recentRunsRef.current.length >= SUSPICIOUS_REPLAY_COUNT;

      const flags: string[] = [];
      if (fastAnswers >= 3) flags.push("rapid_answers");
      if (totalBlurs >= MAX_BLURS_PER_QUESTION) flags.push("tab_switching");
      if (forcedAnswers > 0) flags.push("forfeited_questions");
      if (rapidReplay) flags.push("replay_farming");

      if (flags.length) {
        setCheatLocked(true);
        toast({
          title: "Suspicious activity detected",
          description: `Flags: ${flags.join(", ")}. XP reduced for this run.`,
          variant: "destructive",
        });
      }

      if (mine && user) {
        const rawPct = Math.round((mine.score / (questions.length * 100)) * 100);
        const pct = flags.length ? Math.round(rawPct * CHEAT_XP_PENALTY) : rawPct;
        await submitRun("quiz", pct, 0, {
          mode,
          topic,
          difficulty,
          rank: ranked.findIndex((p) => p.id === me.id) + 1,
          anti_cheat: {
            flags,
            fast_answers: fastAnswers,
            tab_blurs: totalBlurs,
            forfeited: forcedAnswers,
            recent_runs: recentRunsRef.current.length,
            penalized: flags.length > 0,
          },
        });
      }
    },
    [me.id, user, questions.length, submitRun, mode, topic, difficulty, fastAnswers, totalBlurs, forcedAnswers]
  );

  const nextQuestion = useCallback(() => {
    setPicked(null);
    setIdx((i) => i + 1);
  }, []);

  const pick = useCallback(
    (i: number, timedOut = false) => {
      if (picked != null) return; // Locked: cannot change answer once submitted
      setPicked(i);
      const q = questions[idx];
      if (!q) return;
      const elapsed = Math.min(QUESTION_SECONDS * 1000, Date.now() - questionStart);
      const correct = i === q.correct_idx;

      // ---- Anti-cheat: detect impossibly fast answers ----
      const suspiciousFast = !timedOut && i >= 0 && elapsed < MIN_ANSWER_MS;
      if (suspiciousFast) setFastAnswers((n) => n + 1);

      // Score: 100 base + speed bonus up to 50; suspiciously fast = 0 (no speed-bot rewards)
      const speedBonus = correct && !suspiciousFast ? Math.round(50 * (1 - elapsed / (QUESTION_SECONDS * 1000))) : 0;
      const gained = correct && !suspiciousFast ? 100 + speedBonus : 0;
      const cur = players[me.id] ?? me;
      const updated: PlayerState = {
        ...cur,
        score: cur.score + gained,
        answered: cur.answered + 1,
        totalMs: cur.totalMs + elapsed,
      };
      setPlayers((p) => ({ ...p, [me.id]: updated }));
      channelRef.current?.track(updated).catch(() => {});
      broadcast("answered", { id: me.id, qIdx: idx, gained, timedOut, suspiciousFast });

      if (mode === "solo") {
        setTimeout(() => {
          if (idx + 1 >= questions.length) finishGame([updated]);
          else nextQuestion();
        }, 1100);
      }
      // multi/tournament: host advances when all answered
    },
    [picked, questions, idx, questionStart, players, me, broadcast, mode, finishGame, nextQuestion]
  );

  // Host-driven advancement for multi/tournament
  useEffect(() => {
    if (!isHost || mode === "solo" || phase !== "playing") return;
    const active = Object.values(players).filter((p) => !p.eliminated);
    if (active.length === 0) return;
    const allAnswered = active.every((p) => p.answered > idx);
    if (allAnswered) {
      const t = setTimeout(() => {
        if (idx + 1 >= questions.length) {
          broadcast("finish", { players: Object.values(players) });
          finishGame(Object.values(players));
        } else {
          broadcast("next", { idx: idx + 1 });
          nextQuestion();
        }
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [players, idx, isHost, mode, phase, questions.length, broadcast, finishGame, nextQuestion]);

  // ---- Room setup ----
  const setupChannel = useCallback(
    (code: string, host: boolean) => {
      teardownChannel();
      const ch = supabase.channel(`quiz-${code}`, { config: { presence: { key: me.id } } });
      channelRef.current = ch;

      ch.on("presence", { event: "sync" }, () => {
        const state = ch.presenceState() as Record<string, PlayerState[]>;
        const map: Record<string, PlayerState> = {};
        Object.values(state).forEach((arr) => {
          const p = arr[0];
          if (p?.id) map[p.id] = p;
        });
        setPlayers(map);
      });

      ch.on("broadcast", { event: "start" }, ({ payload }) => {
        setQuestions(payload.questions);
        setIdx(0);
        setPicked(null);
        setPhase("playing");
      });
      ch.on("broadcast", { event: "next" }, ({ payload }) => {
        setIdx(payload.idx);
        setPicked(null);
      });
      ch.on("broadcast", { event: "finish" }, ({ payload }) => {
        finishGame(payload.players);
      });
      ch.on("broadcast", { event: "round" }, ({ payload }) => {
        setTRound(payload.round);
        setQuestions(payload.questions);
        setIdx(0);
        setPicked(null);
        setPlayers((p) => {
          const next: Record<string, PlayerState> = {};
          for (const [k, v] of Object.entries(p)) {
            const elim = (payload.eliminated as string[]).includes(k);
            next[k] = { ...v, score: 0, answered: 0, totalMs: 0, eliminated: elim };
          }
          return next;
        });
        setPhase("playing");
      });

      ch.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await ch.track({ ...me, ready: false });
          setIsHost(host);
        }
      });
    },
    [me, teardownChannel, finishGame]
  );

  const hostRoom = () => {
    const code = makeCode();
    setRoomCode(code);
    setupChannel(code, true);
  };
  const joinRoom = () => {
    if (!joinCode.trim()) return;
    const code = joinCode.trim().toUpperCase();
    setRoomCode(code);
    setupChannel(code, false);
  };

  // ---- Anti-cheat: enforce a cooldown between runs ----
  const checkReplayCooldown = (): boolean => {
    const since = Date.now() - lastRunAtRef.current;
    if (lastRunAtRef.current && since < REPLAY_COOLDOWN_MS) {
      const wait = Math.ceil((REPLAY_COOLDOWN_MS - since) / 1000);
      toast({
        title: "Slow down",
        description: `Please wait ${wait}s before starting another quiz.`,
        variant: "destructive",
      });
      return false;
    }
    if (cheatLocked) {
      toast({
        title: "Run blocked",
        description: "Refresh the page to reset anti-cheat lock.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const resetAntiCheatCounters = () => {
    setFastAnswers(0);
    setTotalBlurs(0);
    setForcedAnswers(0);
    setBlursThisQuestion(0);
  };

  const startSolo = async () => {
    if (!checkReplayCooldown()) return;
    setLoading(true);
    try {
      const qs = await generateQuiz(topic, difficulty, QUESTION_COUNT);
      resetAntiCheatCounters();
      setQuestions(qs);
      setPlayers({ [me.id]: { ...me, score: 0, answered: 0, totalMs: 0 } });
      setIdx(0);
      setPicked(null);
      setPhase("playing");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const hostStart = async () => {
    if (!checkReplayCooldown()) return;
    setLoading(true);
    try {
      const qs = await generateQuiz(topic, difficulty, QUESTION_COUNT);
      resetAntiCheatCounters();
      setQuestions(qs);
      setIdx(0);
      setPicked(null);
      setPlayers((p) => {
        const next: Record<string, PlayerState> = {};
        for (const [k, v] of Object.entries(p)) next[k] = { ...v, score: 0, answered: 0, totalMs: 0, eliminated: false };
        return next;
      });
      broadcast("start", { questions: qs });
      setPhase("playing");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Tournament: between rounds, eliminate bottom half
  const hostNextRound = async () => {
    const ranked = Object.values(players)
      .filter((p) => !p.eliminated)
      .sort((a, b) => b.score - a.score || a.totalMs - b.totalMs);
    if (ranked.length <= 1) return;
    const survivors = ranked.slice(0, Math.max(1, Math.floor(ranked.length / 2)));
    const eliminated = Object.values(players)
      .filter((p) => !survivors.find((s) => s.id === p.id))
      .map((p) => p.id);
    setLoading(true);
    try {
      const qs = await generateQuiz(topic, difficulty, QUESTION_COUNT);
      setQuestions(qs);
      broadcast("round", { round: tRound + 1, questions: qs, eliminated });
      setTRound((r) => r + 1);
      setIdx(0);
      setPicked(null);
      setPlayers((p) => {
        const next: Record<string, PlayerState> = {};
        for (const [k, v] of Object.entries(p))
          next[k] = { ...v, score: 0, answered: 0, totalMs: 0, eliminated: eliminated.includes(k) };
        return next;
      });
      setPhase("playing");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    teardownChannel();
    setPhase("lobby");
    setRoomCode("");
    setJoinCode("");
    setIsHost(false);
    setPlayers({});
    setQuestions([]);
    setIdx(0);
    setPicked(null);
    setTRound(1);
    setTFinalRanks([]);
  };

  // ---- UI ----
  const playerList = Object.values(players);
  const activePlayers = playerList.filter((p) => !p.eliminated);
  const meState = players[me.id] ?? me;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto w-full">
        <Link to="/games" className="text-sm text-muted-foreground hover:text-primary">← Back to Games</Link>
        <header className="flex items-center gap-3 mb-6 mt-4">
          <Brain className="w-8 h-8 text-primary" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Engineering Quiz Arena</h1>
            <p className="text-sm text-muted-foreground">
              Solo practice, head-to-head multiplayer, or knockout tournaments.
            </p>
          </div>
          {roomCode && phase !== "results" && (
            <Badge variant="outline" className="font-mono text-base px-3 py-1">
              Room {roomCode}
            </Badge>
          )}
        </header>

        {phase === "lobby" && !roomCode && (
          <Card className="p-6 space-y-5">
            <div className="grid grid-cols-3 gap-2">
              {(["solo", "multiplayer", "tournament"] as Mode[]).map((m) => (
                <Button
                  key={m}
                  variant={mode === m ? "default" : "outline"}
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => setMode(m)}
                >
                  {m === "solo" && <UserIcon className="w-4 h-4" />}
                  {m === "multiplayer" && <Users className="w-4 h-4" />}
                  {m === "tournament" && <Swords className="w-4 h-4" />}
                  <span className="capitalize text-xs">{m}</span>
                </Button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Topic</label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TOPICS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Difficulty</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {mode === "solo" ? (
              <Button onClick={startSolo} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start solo quiz"}
              </Button>
            ) : (
              <div className="space-y-3">
                <Button onClick={hostRoom} className="w-full">
                  Host a {mode === "tournament" ? "tournament" : "match"}
                </Button>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter room code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="font-mono uppercase"
                    maxLength={5}
                  />
                  <Button variant="outline" onClick={joinRoom} disabled={!joinCode.trim()}>
                    Join
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {mode === "multiplayer"
                    ? "First to finish all questions with the highest score wins."
                    : "Knockout rounds — bottom half is eliminated each round until one champion remains."}
                </p>
              </div>
            )}
          </Card>
        )}

        {phase === "lobby" && roomCode && (
          <Card className="p-6 space-y-5">
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Share this code</p>
              <p className="text-4xl font-mono font-bold text-primary tracking-widest mt-1">{roomCode}</p>
            </div>
            <PlayerListView players={playerList} meId={me.id} />
            {isHost ? (
              <Button onClick={hostStart} disabled={loading || playerList.length < 2} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Start ${mode}`}
                {playerList.length < 2 && <span className="ml-2 text-xs opacity-70">(need 2+ players)</span>}
              </Button>
            ) : (
              <p className="text-center text-sm text-muted-foreground">Waiting for host to start…</p>
            )}
            <Button variant="ghost" onClick={resetAll} className="w-full">Leave room</Button>
          </Card>
        )}

        {phase === "playing" && questions[idx] && (
          <div className="space-y-4">
            <Card className="p-3 border-primary/30 bg-primary/5 flex items-center gap-2 text-xs">
              <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
              <span className="text-muted-foreground">
                Anti-cheat active: answers lock on submit, copy/paste disabled,
                tab-switching is tracked
                {blursThisQuestion > 0 && (
                  <span className="ml-1 text-destructive font-semibold">
                    ({blursThisQuestion}/{MAX_BLURS_PER_QUESTION} blur{blursThisQuestion === 1 ? "" : "s"} this question)
                  </span>
                )}
                .
              </span>
            </Card>
            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Badge variant="outline">Q {idx + 1}/{questions.length}</Badge>
                {mode === "tournament" && <Badge variant="secondary">Round {tRound}</Badge>}
                <span className="font-mono">{remaining}s</span>
              </div>
              <Progress value={(remaining / QUESTION_SECONDS) * 100} className="h-1.5" />
            </Card>

            <Card className="p-6 space-y-4">
              <p className="text-base font-medium">{questions[idx].question}</p>
              <div className="space-y-2">
                {questions[idx].options.map((o, i) => {
                  const reveal = picked != null;
                  const isCorrect = reveal && i === questions[idx].correct_idx;
                  const isWrong = picked === i && i !== questions[idx].correct_idx;
                  return (
                    <Button
                      key={i}
                      variant={isCorrect ? "default" : isWrong ? "destructive" : "outline"}
                      className="w-full justify-start h-auto py-3 text-left whitespace-normal"
                      onClick={() => pick(i)}
                      disabled={picked != null || meState.eliminated}
                    >
                      <span className="font-mono text-xs mr-2">{String.fromCharCode(65 + i)}.</span> {o}
                    </Button>
                  );
                })}
              </div>
              {picked != null && questions[idx].explanation && (
                <p className="text-xs text-muted-foreground border-l-2 border-primary pl-3">
                  {questions[idx].explanation}
                </p>
              )}
              {meState.eliminated && (
                <p className="text-center text-sm text-muted-foreground">
                  You've been eliminated — spectating until the final.
                </p>
              )}
            </Card>

            {mode !== "solo" && (
              <Card className="p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Live standings</p>
                <PlayerListView players={playerList} meId={me.id} showScore currentIdx={idx} />
              </Card>
            )}
          </div>
        )}

        {phase === "results" && (
          <Card className="p-6 space-y-5">
            <div className="text-center">
              <Trophy className="w-10 h-10 text-primary mx-auto" />
              <h2 className="text-xl font-bold mt-2">
                {mode === "tournament" && activePlayers.length <= 1
                  ? "Tournament Champion"
                  : "Final Results"}
              </h2>
            </div>
            <ol className="space-y-2">
              {tFinalRanks.map((p, i) => (
                <li
                  key={p.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                    p.id === me.id ? "bg-primary/5 border-primary/30" : "border-border"
                  }`}
                >
                  <Badge variant={i === 0 ? "default" : "outline"} className="w-8 justify-center">
                    {i === 0 ? <Crown className="w-3 h-3" /> : `#${i + 1}`}
                  </Badge>
                  <span className="flex-1 text-sm font-medium">
                    {p.name} {p.id === me.id && <span className="text-xs text-muted-foreground">(you)</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">{(p.totalMs / 1000).toFixed(1)}s</span>
                  <span className="text-sm font-bold text-primary">{p.score}</span>
                </li>
              ))}
            </ol>
            <div className="flex gap-2">
              {mode === "tournament" && isHost && activePlayers.length > 1 && (
                <Button onClick={hostNextRound} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Start round ${tRound + 1}`}
                </Button>
              )}
              <Button variant="outline" onClick={resetAll} className="flex-1">
                Back to lobby
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

function PlayerListView({
  players,
  meId,
  showScore,
  currentIdx,
}: {
  players: PlayerState[];
  meId: string;
  showScore?: boolean;
  currentIdx?: number;
}) {
  const sorted = [...players].sort((a, b) => b.score - a.score || a.totalMs - b.totalMs);
  return (
    <ul className="space-y-1.5">
      {sorted.map((p, i) => {
        const answered = currentIdx != null && p.answered > currentIdx;
        return (
          <li
            key={p.id}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              p.id === meId ? "bg-primary/5 ring-1 ring-primary/30" : "bg-muted/40"
            } ${p.eliminated ? "opacity-50" : ""}`}
          >
            <Badge variant="outline" className="w-7 justify-center text-xs">#{i + 1}</Badge>
            <span className="flex-1 text-sm font-medium truncate">
              {p.name} {p.id === meId && <span className="text-xs text-muted-foreground">(you)</span>}
              {p.eliminated && <span className="ml-2 text-xs text-destructive">out</span>}
            </span>
            {answered && <Badge variant="secondary" className="text-[10px]">✓</Badge>}
            {showScore && <span className="text-sm font-bold text-primary">{p.score}</span>}
          </li>
        );
      })}
    </ul>
  );
}
