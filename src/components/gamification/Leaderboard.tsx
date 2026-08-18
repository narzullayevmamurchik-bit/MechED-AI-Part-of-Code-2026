import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchLeaderboard,
  type LeaderboardCategory,
  type LeaderboardEntry,
  type Timeframe,
} from "@/hooks/useGamification";

const CATEGORIES: { value: LeaderboardCategory; label: string }[] = [
  { value: "learner", label: "Learners" },
  { value: "engineer", label: "Engineers" },
  { value: "contributor", label: "Contributors" },
];

const rankStyle = (rank: number) => {
  if (rank === 1) return "bg-amber-500/15 text-amber-600 border-amber-500/30";
  if (rank === 2) return "bg-slate-400/15 text-slate-500 border-slate-400/30";
  if (rank === 3) return "bg-orange-700/15 text-orange-700 border-orange-700/30";
  return "bg-muted text-muted-foreground";
};

export function Leaderboard() {
  const { user } = useAuth();
  const [category, setCategory] = useState<LeaderboardCategory>("learner");
  const [timeframe, setTimeframe] = useState<Timeframe>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard(category, timeframe).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [category, timeframe]);

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Leaderboard</h2>
        </div>
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
          <TabsList>
            <TabsTrigger value="weekly">This week</TabsTrigger>
            <TabsTrigger value="all">All time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={category} onValueChange={(v) => setCategory(v as LeaderboardCategory)}>
        <TabsList className="grid grid-cols-3 w-full">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.value} value={c.value}>
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {CATEGORIES.map((c) => (
          <TabsContent key={c.value} value={c.value} className="mt-3">
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : entries.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No scores yet — be the first on the board!
              </p>
            ) : (
              <ul className="space-y-1.5">
                {entries.map((e) => {
                  const isMe = user?.id === e.user_id;
                  return (
                    <li
                      key={e.user_id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isMe ? "bg-primary/5 ring-1 ring-primary/30" : "hover:bg-muted/50"
                      }`}
                    >
                      <Badge variant="outline" className={`w-8 justify-center ${rankStyle(e.rank)}`}>
                        #{e.rank}
                      </Badge>
                      <Avatar className="w-8 h-8">
                        {e.avatar_url && <AvatarImage src={e.avatar_url} />}
                        <AvatarFallback>{e.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {e.display_name} {isMe && <span className="text-xs text-muted-foreground">(you)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">Lvl {e.level}</p>
                      </div>
                      <p className="text-sm font-bold text-primary">{e.xp.toLocaleString()} XP</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
