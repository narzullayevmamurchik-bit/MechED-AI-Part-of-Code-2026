import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface GameDef {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  xp_per_play: number;
  difficulty: string;
}

export interface GameRun {
  id: string;
  user_id: string;
  game_slug: string;
  score: number;
  xp_awarded: number;
  completed_at: string;
}

export interface GameLeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  best_score: number;
  plays: number;
  rank: number;
}

export function useGames() {
  const { user } = useAuth();
  const [games, setGames] = useState<GameDef[]>([]);
  const [myRuns, setMyRuns] = useState<GameRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("game_definitions" as any).select("*").eq("is_active", true).order("category");
      setGames((data as any) ?? []);
      if (user) {
        const { data: runs } = await supabase
          .from("game_runs" as any)
          .select("*")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(50);
        setMyRuns((runs as any) ?? []);
      }
      setLoading(false);
    })();
  }, [user]);

  const submitRun = useCallback(
    async (slug: string, score: number, durationS = 0, metadata: Record<string, unknown> = {}) => {
      if (!user) return null;
      const { data, error } = await supabase.rpc("submit_game_run" as any, {
        _slug: slug,
        _score: Math.round(score),
        _duration_s: Math.round(durationS),
        _metadata: metadata,
      });
      if (error) {
        toast({ title: "Failed to save run", description: error.message, variant: "destructive" });
        return null;
      }
      const result = data as { xp: number; new_badges: string[] };
      if (result?.xp) toast({ title: `+${result.xp} XP earned!`, description: `Score: ${score}` });
      if (result?.new_badges?.length) {
        toast({ title: "🏆 New badge unlocked!", description: result.new_badges.join(", ") });
      }
      return result;
    },
    [user]
  );

  return { games, myRuns, loading, submitRun };
}

export async function fetchGameLeaderboard(slug: string, timeframe: "all" | "weekly" = "all", limit = 25) {
  const { data, error } = await supabase.rpc("get_game_leaderboard" as any, {
    _slug: slug,
    _timeframe: timeframe,
    _limit: limit,
  });
  if (error) {
    console.warn("game leaderboard failed", error);
    return [];
  }
  return (data as GameLeaderboardEntry[]) ?? [];
}

export function useGameState<T = Record<string, unknown>>(slug: string, initial: T) {
  const { user } = useAuth();
  const [state, setState] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("game_state" as any)
        .select("state")
        .eq("user_id", user.id)
        .eq("game_slug", slug)
        .maybeSingle();
      if (data?.state) setState({ ...initial, ...(data.state as T) });
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, slug]);

  const save = useCallback(
    async (next: T) => {
      setState(next);
      if (!user) return;
      await supabase
        .from("game_state" as any)
        .upsert({ user_id: user.id, game_slug: slug, state: next as any, updated_at: new Date().toISOString() });
    },
    [user, slug]
  );

  return { state, save, loaded };
}
