import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building2, ArrowRight, ExternalLink, MessageSquarePlus, ArrowUpRight, FileDown } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchMyApplications, fetchApplicationEvents, withdrawApplication, type JobApplication, type ApplicationEvent } from "@/hooks/useCareers";
import { ApplicationTimeline } from "@/components/careers/ApplicationTimeline";
import { AdvanceStageDialog } from "@/components/careers/AdvanceStageDialog";
import { exportApplicationPacket } from "@/lib/exportApplicationPacket";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Applications = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [events, setEvents] = useState<Record<string, ApplicationEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [stageDialog, setStageDialog] = useState<{ app: JobApplication; noteOnly: boolean } | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleExport = async (app: JobApplication) => {
    setExportingId(app.id);
    try {
      const name = (user?.user_metadata as any)?.display_name || user?.email || undefined;
      await exportApplicationPacket(app, name);
      toast.success("Packet ready — use the print dialog to save as PDF");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate packet");
    } finally {
      setExportingId(null);
    }
  };

  const load = async () => {
    setLoading(true);
    const list = await fetchMyApplications();
    setApps(list);
    const evMap: Record<string, ApplicationEvent[]> = {};
    await Promise.all(list.map(async (a) => { evMap[a.id] = await fetchApplicationEvents(a.id); }));
    setEvents(evMap);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const handleWithdraw = async (id: string) => {
    const ok = await withdrawApplication(id);
    if (ok) { toast.success("Withdrawn"); void load(); }
    else toast.error("Failed to withdraw");
  };

  const counts = {
    active: apps.filter((a) => !["rejected", "withdrawn"].includes(a.status)).length,
    offers: apps.filter((a) => a.status === "offer").length,
    closed: apps.filter((a) => ["rejected", "withdrawn"].includes(a.status)).length,
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Briefcase className="w-6 h-6" /> My Applications</h1>
            <p className="text-sm text-muted-foreground mt-1">Track every job you've applied to and watch the status timeline update.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4"><div className="text-xs text-muted-foreground">Active</div><div className="text-2xl font-bold text-foreground">{counts.active}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Offers</div><div className="text-2xl font-bold text-emerald-500">{counts.offers}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Closed</div><div className="text-2xl font-bold text-muted-foreground">{counts.closed}</div></Card>
          </div>

          {loading ? (
            <div className="flex justify-center p-12"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
          ) : apps.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground mb-4">You haven't applied to any jobs yet.</p>
              <Button asChild><Link to="/careers">Browse companies <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {apps.map((a) => {
                const closed = ["rejected", "withdrawn", "offer"].includes(a.status);
                return (
                  <Card key={a.id} className="p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{a.job?.title ?? "Job"}</h3>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {a.company ? (
                            <Link to={`/careers/${a.company_id}`} className="hover:text-accent">{a.company.name}</Link>
                          ) : "Company"}
                          {a.job?.location && <span>· {a.job.location}</span>}
                          {a.job?.type && <Badge variant="secondary" className="text-xs">{a.job.type.replace("_", " ")}</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {a.job?.apply_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={a.job.apply_url} target="_blank" rel="noopener noreferrer">External <ExternalLink className="w-3.5 h-3.5 ml-1" /></a>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setStageDialog({ app: a, noteOnly: true })}>
                          <MessageSquarePlus className="w-3.5 h-3.5" /> Add note
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleExport(a)} disabled={exportingId === a.id}>
                          <FileDown className="w-3.5 h-3.5" /> {exportingId === a.id ? "Preparing…" : "Export packet"}
                        </Button>
                        {!closed && (
                          <Button size="sm" onClick={() => setStageDialog({ app: a, noteOnly: false })}>
                            <ArrowUpRight className="w-3.5 h-3.5" /> Update stage
                          </Button>
                        )}
                        {!["rejected", "withdrawn", "offer"].includes(a.status) && (
                          <Button size="sm" variant="ghost" onClick={() => handleWithdraw(a.id)}>Withdraw</Button>
                        )}
                      </div>
                    </div>
                    <ApplicationTimeline status={a.status} events={events[a.id]} />
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {stageDialog && (
        <AdvanceStageDialog
          open={!!stageDialog}
          onClose={() => setStageDialog(null)}
          applicationId={stageDialog.app.id}
          currentStatus={stageDialog.app.status}
          noteOnly={stageDialog.noteOnly}
          onUpdated={() => void load()}
        />
      )}
    </div>
  );
};

export default Applications;
