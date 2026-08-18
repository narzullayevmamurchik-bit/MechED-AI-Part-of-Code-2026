import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Save, X, Upload, Briefcase, Building2 } from "lucide-react";
import { toast } from "sonner";
import type { Company, Job } from "@/hooks/useCareers";

const INDUSTRIES = ["metallurgy", "mining_metallurgy", "engineering", "automotive", "materials", "robotics", "energy"];
const JOB_TYPES = ["full_time", "part_time", "internship", "research", "contract"];

export const AdminCompaniesManager = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Company>>({});
  const [creating, setCreating] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [newJob, setNewJob] = useState<Partial<Job>>({ type: "full_time", status: "open", required_skills: [] });

  const load = async () => {
    setLoading(true);
    const [c, j] = await Promise.all([
      supabase.from("companies" as any).select("*").order("name"),
      supabase.from("jobs" as any).select("*, company:companies(name)").order("posted_at", { ascending: false }),
    ]);
    setCompanies((c.data as unknown as Company[]) ?? []);
    setJobs((j.data as unknown as Job[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!draft.name?.trim()) return toast.error("Name required");
    const payload = {
      name: draft.name,
      slug: draft.slug ?? draft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      logo_url: draft.logo_url ?? null,
      website_url: draft.website_url ?? null,
      careers_url: draft.careers_url ?? null,
      industry: draft.industry ?? "engineering",
      country: draft.country ?? null,
      description: draft.description ?? "",
      featured: draft.featured ?? false,
    };
    const { error } = editingId
      ? await supabase.from("companies" as any).update(payload).eq("id", editingId)
      : await supabase.from("companies" as any).insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Updated" : "Created");
    setEditingId(null); setCreating(false); setDraft({});
    await load();
  };

  const deleteCompany = async (id: string) => {
    if (!confirm("Delete company and all its jobs?")) return;
    await supabase.from("companies" as any).delete().eq("id", id);
    await load();
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>, companyId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `${companyId}.${ext}`;
    const { error } = await supabase.storage.from("company-logos").upload(path, file, { upsert: true });
    if (error) return toast.error("Upload failed");
    const { data } = supabase.storage.from("company-logos").getPublicUrl(path);
    await supabase.from("companies" as any).update({ logo_url: `${data.publicUrl}?t=${Date.now()}` }).eq("id", companyId);
    toast.success("Logo updated");
    await load();
  };

  const addJob = async () => {
    if (!selectedCompanyId || !newJob.title?.trim()) return toast.error("Title required");
    const { error } = await supabase.from("jobs" as any).insert({
      company_id: selectedCompanyId,
      title: newJob.title,
      description: newJob.description ?? "",
      type: newJob.type ?? "full_time",
      location: newJob.location ?? null,
      remote: newJob.remote ?? false,
      apply_url: newJob.apply_url ?? null,
      required_skills: newJob.required_skills ?? [],
      status: "open",
    });
    if (error) return toast.error(error.message);
    toast.success("Job posted");
    setNewJob({ type: "full_time", status: "open", required_skills: [] });
    setShowJobForm(false);
    await load();
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Delete job?")) return;
    await supabase.from("jobs" as any).delete().eq("id", id);
    await load();
  };

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const companyJobs = jobs.filter((j) => j.company_id === selectedCompanyId);

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;

  if (selectedCompanyId && selectedCompany) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedCompanyId(null)}>← Back to companies</Button>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            {selectedCompany.logo_url ? <img src={selectedCompany.logo_url} className="w-12 h-12 rounded object-cover" /> : <Building2 className="w-12 h-12 text-muted-foreground" />}
            <div>
              <h3 className="font-semibold text-foreground">{selectedCompany.name}</h3>
              <p className="text-xs text-muted-foreground">{selectedCompany.country} · {selectedCompany.industry}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Briefcase className="w-4 h-4" /> Jobs ({companyJobs.length})</h3>
            {!showJobForm && <Button size="sm" onClick={() => setShowJobForm(true)}><Plus className="w-3.5 h-3.5" /> New job</Button>}
          </div>
          {showJobForm && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2 mb-4">
              <Input placeholder="Job title" value={newJob.title ?? ""} onChange={(e) => setNewJob((p) => ({ ...p, title: e.target.value }))} />
              <textarea className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm" rows={3} placeholder="Description" value={newJob.description ?? ""} onChange={(e) => setNewJob((p) => ({ ...p, description: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <select className="px-3 py-2 rounded-md bg-background border border-border text-sm" value={newJob.type} onChange={(e) => setNewJob((p) => ({ ...p, type: e.target.value as any }))}>
                  {JOB_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                </select>
                <Input placeholder="Location" value={newJob.location ?? ""} onChange={(e) => setNewJob((p) => ({ ...p, location: e.target.value }))} />
                <Input placeholder="Apply URL" value={newJob.apply_url ?? ""} onChange={(e) => setNewJob((p) => ({ ...p, apply_url: e.target.value }))} />
                <Input placeholder="Required skills (comma)" onChange={(e) => setNewJob((p) => ({ ...p, required_skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} />
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={newJob.remote ?? false} onChange={(e) => setNewJob((p) => ({ ...p, remote: e.target.checked }))} /> Remote</label>
              <div className="flex gap-2">
                <Button size="sm" onClick={addJob}><Save className="w-3.5 h-3.5" /> Post</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowJobForm(false)}><X className="w-3.5 h-3.5" /> Cancel</Button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {companyJobs.map((j) => (
              <div key={j.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div>
                  <p className="text-sm font-medium text-foreground">{j.title}</p>
                  <p className="text-xs text-muted-foreground">{j.type.replace("_", " ")} · {j.location ?? "Remote"}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteJob(j.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            ))}
            {companyJobs.length === 0 && <p className="text-xs text-muted-foreground">No jobs yet for this company.</p>}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Companies ({companies.length})</h3>
        {!creating && <Button size="sm" onClick={() => { setCreating(true); setDraft({}); }}><Plus className="w-3.5 h-3.5" /> New company</Button>}
      </div>

      {(creating || editingId) && (
        <Card className="p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Name" value={draft.name ?? ""} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Country" value={draft.country ?? ""} onChange={(e) => setDraft((p) => ({ ...p, country: e.target.value }))} />
            <select className="px-3 py-2 rounded-md bg-background border border-border text-sm" value={draft.industry ?? "engineering"} onChange={(e) => setDraft((p) => ({ ...p, industry: e.target.value }))}>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i.replace("_", " ")}</option>)}
            </select>
            <Input placeholder="Website URL" value={draft.website_url ?? ""} onChange={(e) => setDraft((p) => ({ ...p, website_url: e.target.value }))} />
            <Input placeholder="Careers URL" value={draft.careers_url ?? ""} onChange={(e) => setDraft((p) => ({ ...p, careers_url: e.target.value }))} />
            <Input placeholder="Logo URL (or upload after save)" value={draft.logo_url ?? ""} onChange={(e) => setDraft((p) => ({ ...p, logo_url: e.target.value }))} />
          </div>
          <textarea className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm" rows={2} placeholder="Description" value={draft.description ?? ""} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.featured ?? false} onChange={(e) => setDraft((p) => ({ ...p, featured: e.target.checked }))} /> Featured</label>
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Save className="w-3.5 h-3.5" /> Save</Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setCreating(false); setDraft({}); }}><X className="w-3.5 h-3.5" /> Cancel</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {companies.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                {c.logo_url ? <img src={c.logo_url} className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <p className="font-medium text-sm text-foreground truncate">{c.name}</p>
                  {c.featured && <Badge variant="outline" className="text-xs">★</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{c.industry.replace("_", " ")} · {c.country}</p>
                <div className="flex gap-1 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedCompanyId(c.id)}><Briefcase className="w-3 h-3" /> Jobs</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingId(c.id); setDraft(c); }}><Edit2 className="w-3 h-3" /></Button>
                  <label className="cursor-pointer p-1.5 rounded hover:bg-secondary text-muted-foreground" title="Upload logo">
                    <Upload className="w-3.5 h-3.5" />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(e, c.id)} />
                  </label>
                  <Button size="sm" variant="ghost" onClick={() => deleteCompany(c.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
