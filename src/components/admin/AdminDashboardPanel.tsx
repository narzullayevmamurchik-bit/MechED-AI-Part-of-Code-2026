import {
  Users, BookOpen, Building2, Briefcase, Send, Library, FlaskConical,
  Activity, Plus, RefreshCw, TrendingUp, Trophy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminStats, type DailySeries } from "@/hooks/useAdminStats";
import { AdminActivityLog } from "./AdminActivityLog";

interface QuickAction {
  label: string;
  icon: typeof Plus;
  onClick: () => void;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof Users;
  accent?: boolean;
}

const KpiCard = ({ label, value, sub, icon: Icon, accent }: KpiCardProps) => (
  <div className={`bg-card border ${accent ? "border-accent/40" : "border-border"} rounded-xl p-4`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
  </div>
);

const Sparkline = ({ data, height = 64, color = "hsl(var(--accent))" }: { data: DailySeries[]; height?: number; color?: string }) => {
  if (!data.length) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100;
  const step = w / Math.max(1, data.length - 1);
  const points = data.map((d, i) => `${(i * step).toFixed(2)},${(height - (d.value / max) * (height - 8) - 4).toFixed(2)}`).join(" ");
  const area = `0,${height} ${points} ${w},${height}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polygon points={area} fill={color} opacity="0.15" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

interface Props {
  onQuickAction: (key: "course" | "expert" | "company" | "job" | "resource" | "project") => void;
}

export const AdminDashboardPanel = ({ onQuickAction }: Props) => {
  const navigate = useNavigate();
  const { stats, signupSeries, activitySeries, topUsers, topCourses, loading, refresh } = useAdminStats();

  const quickActions: QuickAction[] = [
    { label: "Add Course", icon: BookOpen, onClick: () => onQuickAction("course") },
    { label: "Add Expert", icon: Users, onClick: () => onQuickAction("expert") },
    { label: "Add Company", icon: Building2, onClick: () => onQuickAction("company") },
    { label: "Add Job", icon: Briefcase, onClick: () => onQuickAction("job") },
    { label: "Add Resource", icon: Library, onClick: () => onQuickAction("resource") },
    { label: "Add Project", icon: FlaskConical, onClick: () => onQuickAction("project") },
  ];

  const totalSignups30 = signupSeries.reduce((s, d) => s + d.value, 0);
  const totalActivity30 = activitySeries.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="bg-card border border-accent/30 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
          </div>
          <button
            onClick={refresh}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg bg-secondary/40 hover:bg-accent hover:text-accent-foreground transition-colors text-xs font-medium text-foreground"
            >
              <a.icon className="w-4 h-4" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Users" value={stats?.totalUsers ?? "—"} icon={Users} />
        <KpiCard
          label="Active Now"
          value={stats?.activeUsers ?? "—"}
          sub="last 5 minutes"
          icon={Activity}
          accent
        />
        <KpiCard label="Courses" value={stats?.totalCourses ?? "—"} sub={`${stats?.publishedCourses ?? 0} published`} icon={BookOpen} />
        <KpiCard label="Resources" value={stats?.totalResources ?? "—"} icon={Library} />
        <KpiCard label="Companies" value={stats?.totalCompanies ?? "—"} icon={Building2} />
        <KpiCard label="Jobs" value={stats?.totalJobs ?? "—"} icon={Briefcase} />
        <KpiCard label="Applications" value={stats?.totalApplications ?? "—"} icon={Send} />
        <KpiCard label="Projects" value={stats?.totalProjects ?? "—"} icon={FlaskConical} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">User Growth</h3>
              <p className="text-xs text-muted-foreground">Signups · last 30 days</p>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-accent">
              <TrendingUp className="w-4 h-4" /> {totalSignups30}
            </span>
          </div>
          <Sparkline data={signupSeries} />
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Course Engagement</h3>
              <p className="text-xs text-muted-foreground">Activity events · last 30 days</p>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-primary">
              <Activity className="w-4 h-4" /> {totalActivity30}
            </span>
          </div>
          <Sparkline data={activitySeries} color="hsl(var(--primary))" />
        </div>
      </div>

      {/* Top users + top courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Most Active Users</h3>
            <span className="text-xs text-muted-foreground ml-auto">this week</span>
          </div>
          {topUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No XP earned this week yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {topUsers.map((u) => (
                <li key={u.user_id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-secondary/40">
                  <span className="text-xs font-bold text-muted-foreground w-5 text-center">{u.rank}</span>
                  <span className="text-sm text-foreground flex-1 truncate">{u.display_name}</span>
                  <span className="text-xs text-muted-foreground">Lvl {u.level}</span>
                  <span className="text-xs font-semibold text-accent tabular-nums">{u.xp} XP</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Most Popular Courses</h3>
            <span className="text-xs text-muted-foreground ml-auto">last 30 days</span>
          </div>
          {topCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No course activity recorded yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {topCourses.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-secondary/40 cursor-pointer"
                  onClick={() => navigate(`/course/${c.id}`)}
                >
                  <span className="text-lg">{c.icon}</span>
                  <span className="text-sm text-foreground flex-1 truncate">{c.title}</span>
                  <span className="text-xs font-semibold text-primary tabular-nums">{c.events}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Activity log */}
      <AdminActivityLog limit={30} />
    </div>
  );
};
