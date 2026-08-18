import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, ScanLine, AlertTriangle, CheckCircle2, Languages } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface JobRow {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string | null;
  status: string;
  overall_confidence: number | null;
  detected_languages: string[];
  attempts: number;
  error: string | null;
  created_at: string;
}

const STATUSES = ["all", "queued", "processing", "done", "low_confidence", "failed"] as const;

const statusTone = (s: string) =>
  s === "done"
    ? "bg-emerald-500/10 text-emerald-500"
    : s === "low_confidence"
      ? "bg-amber-500/10 text-amber-500"
      : s === "failed"
        ? "bg-destructive/10 text-destructive"
        : "bg-secondary text-muted-foreground";

export const AdminOcrManager = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>("all");
  const [retrying, setRetrying] = useState<string | null>(null);

  // Settings
  const [settings, setSettings] = useState<{ languages: string[]; low_confidence_threshold: number; auto_use_threshold: number }>({
    languages: ["ru", "uz-cyrl", "uz-latn", "en", "de"],
    low_confidence_threshold: 60,
    auto_use_threshold: 85,
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const q = supabase.from("ocr_jobs").select("*").order("created_at", { ascending: false }).limit(200);
    const { data } = await q;
    setJobs((data ?? []) as JobRow[]);
    const { data: s } = await supabase.from("app_settings").select("value").eq("key", "ocr").maybeSingle();
    if (s?.value) setSettings({ ...settings, ...(s.value as object) });
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void fetchAll();
    const ch = supabase
      .channel("admin_ocr_jobs_feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "ocr_jobs" }, () => void fetchAll())
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [fetchAll]);

  const filtered = useMemo(
    () => (filter === "all" ? jobs : jobs.filter((j) => j.status === filter)),
    [jobs, filter],
  );

  const stats = useMemo(() => {
    const total = jobs.length;
    const done = jobs.filter((j) => j.status === "done").length;
    const low = jobs.filter((j) => j.status === "low_confidence").length;
    const failed = jobs.filter((j) => j.status === "failed").length;
    const confs = jobs.filter((j) => j.overall_confidence !== null).map((j) => j.overall_confidence!);
    const avg = confs.length ? Math.round(confs.reduce((s, v) => s + v, 0) / confs.length) : 0;
    return { total, done, low, failed, avg };
  }, [jobs]);

  const retry = async (id: string) => {
    setRetrying(id);
    const { error } = await supabase.functions.invoke("ocr-retry", { body: { job_id: id } });
    setRetrying(null);
    if (error) toast({ title: "Retry failed", description: error.message, variant: "destructive" });
    else toast({ title: "Re-queued", description: "OCR job is processing again" });
  };

  const saveSettings = async () => {
    const { error } = await supabase.from("app_settings").upsert({
      key: "ocr",
      value: settings as never,
      updated_at: new Date().toISOString(),
    });
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Saved", description: "OCR settings updated" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ScanLine className="w-5 h-5 text-accent" />
        <h2 className="text-base font-bold text-foreground">OCR Pipeline</h2>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Total jobs" value={stats.total} />
        <Kpi label="Successful" value={stats.done} tone="good" />
        <Kpi label="Low confidence" value={stats.low} tone="warn" />
        <Kpi label="Failed" value={stats.failed} tone="bad" />
        <Kpi label="Avg confidence" value={`${stats.avg}%`} />
      </div>

      {/* Settings */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">OCR Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Languages (comma-separated)</label>
            <input
              value={settings.languages.join(", ")}
              onChange={(e) => setSettings((s) => ({ ...s, languages: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) }))}
              className="w-full px-3 py-2 rounded-lg bg-secondary text-sm border-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Low-confidence threshold</label>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.low_confidence_threshold}
              onChange={(e) => setSettings((s) => ({ ...s, low_confidence_threshold: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg bg-secondary text-sm border-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Auto-use threshold</label>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.auto_use_threshold}
              onChange={(e) => setSettings((s) => ({ ...s, auto_use_threshold: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg bg-secondary text-sm border-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
        <button onClick={saveSettings} className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold">
          Save settings
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium capitalize",
              filter === s ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {s.replace("_", " ")}
          </button>
        ))}
        <button onClick={fetchAll} className="ml-auto px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 bg-secondary text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Queue */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No jobs match this filter.</div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">When</th>
                <th className="text-left px-3 py-2">Entity</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Confidence</th>
                <th className="text-left px-3 py-2">Languages</th>
                <th className="text-left px-3 py-2">Attempts</th>
                <th className="text-right px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <tr key={j.id} className="border-t border-border">
                  <td className="px-3 py-2 text-muted-foreground">{format(new Date(j.created_at), "MMM d HH:mm")}</td>
                  <td className="px-3 py-2 text-foreground">{j.entity_type}<br /><span className="text-muted-foreground text-[10px] font-mono">{j.entity_id?.slice(0, 8) ?? "—"}</span></td>
                  <td className="px-3 py-2"><span className={cn("px-2 py-0.5 rounded font-semibold", statusTone(j.status))}>{j.status.replace("_", " ")}</span></td>
                  <td className="px-3 py-2">
                    {j.overall_confidence !== null ? (
                      <span className={cn(
                        "font-semibold",
                        j.overall_confidence >= 85 ? "text-emerald-500" : j.overall_confidence >= 60 ? "text-amber-500" : "text-destructive",
                      )}>
                        {j.overall_confidence}%
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground"><span className="inline-flex items-center gap-1"><Languages className="w-3 h-3" />{(j.detected_languages ?? []).join(", ") || "—"}</span></td>
                  <td className="px-3 py-2 text-muted-foreground">{j.attempts}</td>
                  <td className="px-3 py-2 text-right">
                    {(j.status === "failed" || j.status === "low_confidence") && (
                      <button
                        onClick={() => retry(j.id)}
                        disabled={retrying === j.id}
                        className="px-2 py-1 rounded bg-accent/20 text-accent text-[11px] font-semibold inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        {retrying === j.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const Kpi = ({ label, value, tone }: { label: string; value: number | string; tone?: "good" | "warn" | "bad" }) => (
  <div className="bg-card border border-border rounded-xl p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={cn(
      "text-xl font-bold mt-1",
      tone === "good" && "text-emerald-500",
      tone === "warn" && "text-amber-500",
      tone === "bad" && "text-destructive",
      !tone && "text-foreground",
    )}>{value}</p>
  </div>
);
