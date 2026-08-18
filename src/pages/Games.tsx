import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Trophy, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useGames } from "@/hooks/useGames";
import { useGamification } from "@/hooks/useGamification";
import { GameTile } from "@/components/games/GameTile";
import { XpProgressCard } from "@/components/gamification/XpProgressCard";
import { StreakCard } from "@/components/gamification/StreakCard";
import { BadgesGrid } from "@/components/gamification/BadgesGrid";
import { Leaderboard } from "@/components/gamification/Leaderboard";

const ROUTES: Record<string, string> = {
  career: "/games/career",
  "metallurgy-lab": "/games/lab/metallurgy",
  cnc: "/games/lab/cnc",
  materials: "/games/materials",
  factory: "/games/factory",
  quiz: "/games/quiz",
  puzzles: "/games/puzzles",
  research: "/games/research",
  daily: "/games/daily",
};

export default function Games() {
  const { games, loading } = useGames();
  const { stats, badges, allBadges } = useGamification();

  const byCategory = games.reduce<Record<string, typeof games>>((acc, g) => {
    (acc[g.category] = acc[g.category] || []).push(g);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <header className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Engineering Games &amp; Simulation Center</h1>
            <p className="text-sm text-muted-foreground">
              Learn engineering through play — simulations, quizzes, puzzles, and career progression.
            </p>
          </div>
        </header>

        {/* Daily challenge banner */}
        <Card className="p-5 mb-6 border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              <div>
                <p className="font-bold">Today&apos;s Daily Challenge</p>
                <p className="text-sm text-muted-foreground">New engineering problem every day — claim XP once per day.</p>
              </div>
            </div>
            <Link
              to="/games/daily"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
            >
              Play today
            </Link>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <XpProgressCard stats={stats} />
          <StreakCard stats={stats} />
        </div>

        <Tabs defaultValue="games">
          <TabsList>
            <TabsTrigger value="games">
              <Gamepad2 className="w-4 h-4 mr-2" /> Games
            </TabsTrigger>
            <TabsTrigger value="badges">
              <Trophy className="w-4 h-4 mr-2" /> Badges ({badges.length}/{allBadges.length})
            </TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="mt-4 space-y-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading games...</p>
            ) : (
              Object.entries(byCategory).map(([cat, list]) => (
                <section key={cat}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {cat}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map((g) => (
                      <GameTile
                        key={g.id}
                        to={ROUTES[g.slug] ?? "/games"}
                        icon={g.icon}
                        name={g.name}
                        description={g.description}
                        difficulty={g.difficulty}
                        xp={g.xp_per_play}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </TabsContent>

          <TabsContent value="badges" className="mt-4">
            <Card className="p-5">
              <BadgesGrid catalog={allBadges} earned={badges} />
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-4">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
