import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Award, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGamification, fetchRecentXp, type XpTransaction } from "@/hooks/useGamification";
import { XpProgressCard } from "@/components/gamification/XpProgressCard";
import { StreakCard } from "@/components/gamification/StreakCard";
import { BadgesGrid } from "@/components/gamification/BadgesGrid";
import { Leaderboard } from "@/components/gamification/Leaderboard";

const sourceLabel: Record<string, string> = {
  lesson_complete: "Completed lesson",
  scenario_decision: "Scenario decision",
  scenario_complete: "Scenario complete",
  assignment_graded: "Assignment graded",
  collab_task_done: "Project task done",
  daily_streak: "Streak bonus",
  badge_unlock: "Badge unlocked",
  admin_grant: "Admin grant",
};

export default function Achievements() {
  const { user } = useAuth();
  const { stats, badges, allBadges, loading, recordDailyActivity } = useGamification();
  const [recent, setRecent] = useState<XpTransaction[]>([]);

  // Mark today as active when the page loads
  useEffect(() => {
    if (user) {
      void recordDailyActivity();
      void fetchRecentXp(user.id, 25).then(setRecent);
    }
  }, [user, recordDailyActivity]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <header className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Achievements</h1>
            <p className="text-sm text-muted-foreground">
              Track your XP, streaks, badges, and rank against the global community.
            </p>
          </div>
        </header>

        {loading ? (
          <Card className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <XpProgressCard stats={stats} />
              <StreakCard stats={stats} />
            </div>

            <Tabs defaultValue="badges">
              <TabsList>
                <TabsTrigger value="badges">
                  <Award className="w-4 h-4 mr-2" />
                  Badges ({badges.length}/{allBadges.length})
                </TabsTrigger>
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                <TabsTrigger value="history">Recent XP</TabsTrigger>
              </TabsList>

              <TabsContent value="badges" className="mt-4">
                <Card className="p-5">
                  <BadgesGrid catalog={allBadges} earned={badges} />
                </Card>
              </TabsContent>

              <TabsContent value="leaderboard" className="mt-4">
                <Leaderboard />
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <Card className="p-5">
                  {recent.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      No XP yet — complete a lesson or scenario to start earning.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {recent.map((tx) => (
                        <li key={tx.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {tx.reason || sourceLabel[tx.source] || tx.source}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.created_at).toLocaleString()} · {tx.category}
                            </p>
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              tx.amount > 0 ? "text-primary" : "text-destructive"
                            }`}
                          >
                            {tx.amount > 0 ? "+" : ""}
                            {tx.amount} XP
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
