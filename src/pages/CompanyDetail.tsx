import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, ExternalLink, Globe, Briefcase, MapPin, Sparkles, Send, Clock } from "lucide-react";
import type { Company, Job, JobFit, JobApplication, ApplicationEvent } from "@/hooks/useCareers";
import { fetchCompanyJobs, matchJob, fetchApplicationByJob, fetchApplicationEvents, withdrawApplication } from "@/hooks/useCareers";
import { toast } from "sonner";
import { JobFitResults } from "@/components/careers/JobFitResults";
import { ApplyJobDialog } from "@/components/careers/ApplyJobDialog";
import { ApplicationTimeline } from "@/components/careers/ApplicationTimeline";

const CompanyDetail = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluatingJobId, setEvaluatingJobId] = useState<string | null>(null);
  const [fits, setFits] = useState<Record<string, JobFit>>({});
  const [applications, setApplications] = useState<Record<string, JobApplication>>({});
  const [events, setEvents] = useState<Record<string, ApplicationEvent[]>>({});
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  const loadApplications = async (list: Job[]) => {
    const map: Record<string, JobApplication> = {};
    const evMap: Record<string, ApplicationEvent[]> = {};
    await Promise.all(list.map(async (j) => {
      const a = await fetchApplicationByJob(j.id);
      if (a) {
        map[j.id] = a;
        evMap[j.id] = await fetchApplicationEvents(a.id);
      }
    }));
    setApplications(map);
    setEvents(evMap);
  };

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      setLoading(true);
      const [c, j] = await Promise.all([
        supabase.from("companies" as any).select("*").eq("id", companyId).maybeSingle(),
        fetchCompanyJobs(companyId),
      ]);
      setCompany((c.data as unknown as Company) ?? null);
      setJobs(j);
      await loadApplications(j);
      setLoading(false);
    })();
  }, [companyId]);

  const evaluateFit = async (jobId: string) => {
    setEvaluatingJobId(jobId);
    try {
      const fit = await matchJob(jobId);
      if (!fit) {
        toast.error("Unable to evaluate fit");
        return;
      }
      setFits((prev) => ({ ...prev, [jobId]: fit }));
    } finally {
      setEvaluatingJobId(null);
    }
  };

  const handleWithdraw = async (jobId: string) => {
    const app = applications[jobId];
    if (!app) return;
    const ok = await withdrawApplication(app.id);
    if (ok) {
      toast.success("Application withdrawn");
      await loadApplications(jobs);
    } else {
      toast.error("Failed to withdraw");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background"><Sidebar />
        <main className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></main>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex min-h-screen bg-background"><Sidebar />
        <main className="flex-1 p-6">
          <Button variant="ghost" onClick={() => navigate("/careers")}><ArrowLeft className="w-4 h-4" /> Back</Button>
          <p className="text-muted-foreground mt-6">Company not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate("/careers")} className="mb-2"><ArrowLeft className="w-4 h-4" /> Back to Careers</Button>

          <Card className="p-6">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                {company.logo_url ? <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" /> : <Building2 className="w-10 h-10 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                  <Badge variant="secondary">{company.industry.replace("_", " ")}</Badge>
                  {company.country && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {company.country}</span>}
                  {company.size && <span>{company.size}</span>}
                  {company.founded_year && <span>Founded {company.founded_year}</span>}
                </div>
                <p className="mt-3 text-foreground/90">{company.description}</p>
                <div className="flex gap-2 mt-4">
                  {company.website_url && (
                    <Button asChild><a href={company.website_url} target="_blank" rel="noopener noreferrer"><Globe className="w-4 h-4" /> Visit Website</a></Button>
                  )}
                  {company.careers_url && (
                    <Button variant="outline" asChild><a href={company.careers_url} target="_blank" rel="noopener noreferrer"><Briefcase className="w-4 h-4" /> View Careers</a></Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <div>
            <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2"><Briefcase className="w-5 h-5" /> Open Positions ({jobs.length})</h2>
            {jobs.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No positions posted on the platform yet.</p>
                {company.careers_url && (
                  <Button className="mt-4" asChild>
                    <a href={company.careers_url} target="_blank" rel="noopener noreferrer">Browse on company site <ExternalLink className="w-3.5 h-3.5 ml-1" /></a>
                  </Button>
                )}
              </Card>
            ) : (
              <div className="space-y-3">
                {jobs.map((j) => {
                  const application = applications[j.id];
                  const isApplied = !!application && application.status !== "withdrawn";
                  return (
                    <Card key={j.id} className="p-5">
                      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{j.title}</h3>
                          <div className="text-xs text-muted-foreground flex gap-2 items-center mt-1 flex-wrap">
                            <Badge variant="secondary">{j.type.replace("_", " ")}</Badge>
                            {j.location && <span>{j.location}</span>}
                            {j.remote && <Badge variant="outline">Remote</Badge>}
                            {j.min_level > 1 && <span>Min level {j.min_level}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => evaluateFit(j.id)} disabled={evaluatingJobId === j.id}>
                            <Sparkles className="w-3.5 h-3.5" /> {evaluatingJobId === j.id ? "Analyzing..." : fits[j.id] ? "Re-analyze" : "Check fit"}
                          </Button>
                          {isApplied ? (
                            <Button size="sm" variant="ghost" onClick={() => handleWithdraw(j.id)}>
                              <Clock className="w-3.5 h-3.5" /> Withdraw
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => setApplyJob(j)}>
                              <Send className="w-3.5 h-3.5" /> Apply
                            </Button>
                          )}
                          {j.apply_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={j.apply_url} target="_blank" rel="noopener noreferrer">External <ExternalLink className="w-3.5 h-3.5 ml-1" /></a>
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{j.description}</p>
                      {j.required_skills.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-3">
                          {j.required_skills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                        </div>
                      )}

                      {application && (
                        <div className="mt-4 p-4 rounded-lg bg-secondary/40 border border-border">
                          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Your application</div>
                          <ApplicationTimeline status={application.status} events={events[j.id]} />
                        </div>
                      )}

                      {fits[j.id] && (
                        <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border">
                          <JobFitResults fit={fits[j.id]} jobId={j.id} />
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {applyJob && (
        <ApplyJobDialog
          job={applyJob}
          open={!!applyJob}
          onClose={() => setApplyJob(null)}
          onApplied={() => loadApplications(jobs)}
        />
      )}
    </div>
  );
};

export default CompanyDetail;
