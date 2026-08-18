import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useJournals, useJournalMutations, matchJournals, type Journal, type MatchResult } from "@/hooks/useJournals";
import { useAdmin } from "@/hooks/useAdmin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  BookOpen, Search, Sparkles, Shield, ShieldAlert, ShieldX, ExternalLink, Mail,
  Calculator, GitCompare, ClipboardList, Loader2, Plus, Pencil, Trash2, Upload, Globe, DollarSign, CheckCircle2, AlertTriangle,
} from "lucide-react";

const SUBJECTS = [
  "Materials Science","Metallurgy","Mechanical Engineering","Manufacturing","Mechatronics",
  "Machine Learning","Robotics","Welding","Heat Treatment","Industrial Engineering","Foundry & Casting",
];

const RiskBadge = ({ status }: { status: Journal["risk_status"] }) => {
  if (status === "safe") return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 gap-1"><Shield className="w-3 h-3" />SAFE</Badge>;
  if (status === "caution") return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 gap-1"><ShieldAlert className="w-3 h-3" />CAUTION</Badge>;
  return <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30 gap-1"><ShieldX className="w-3 h-3" />HIGH RISK</Badge>;
};

const IndexingBadges = ({ j }: { j: Journal }) => (
  <div className="flex flex-wrap gap-1">
    {j.is_scopus && <Badge variant="outline" className="text-[10px]">Scopus</Badge>}
    {j.is_wos && <Badge variant="outline" className="text-[10px]">WoS</Badge>}
    {j.is_esci && <Badge variant="outline" className="text-[10px]">ESCI</Badge>}
    {j.is_oak && <Badge variant="outline" className="text-[10px]">OAK</Badge>}
    {j.is_doaj && <Badge variant="outline" className="text-[10px]">DOAJ</Badge>}
    {j.is_open_access && <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-500">Open Access</Badge>}
    {j.quartile && <Badge variant="outline" className="text-[10px]">{j.quartile}</Badge>}
  </div>
);

// ---------- Journal Profile Dialog ----------
const JournalProfileDialog = ({ j, open, onOpenChange }: { j: Journal | null; open: boolean; onOpenChange: (v: boolean) => void }) => {
  if (!j) return null;
  const feeStr = j.apc_amount != null ? `${j.apc_amount.toLocaleString()} ${j.apc_currency || "USD"}` : "Free";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-lg leading-snug">{j.name}</DialogTitle>
              <DialogDescription className="mt-1">{j.publisher} • {j.country}</DialogDescription>
            </div>
            <RiskBadge status={j.risk_status} />
          </div>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <IndexingBadges j={j} />
          {j.risk_note && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-500 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />{j.risk_note}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Fact label="ISSN" value={j.issn} />
            <Fact label="e-ISSN" value={j.e_issn} />
            <Fact label="Region" value={j.region === "uzbekistan" ? "Uzbekistan" : "International"} />
            <Fact label="APC" value={feeStr} icon={<DollarSign className="w-3 h-3" />} />
            <Fact label="Review time" value={j.review_time_weeks ? `${j.review_time_weeks} weeks` : null} />
            <Fact label="Acceptance rate" value={j.acceptance_rate ? `${j.acceptance_rate}%` : null} />
            <Fact label="Frequency" value={j.publication_frequency} />
            <Fact label="Citation style" value={j.citation_style} />
            <Fact label="Max pages" value={j.max_pages?.toString()} />
            <Fact label="Abstract words" value={j.abstract_min_words || j.abstract_max_words ? `${j.abstract_min_words ?? "—"}–${j.abstract_max_words ?? "—"}` : null} />
            <Fact label="Plagiarism threshold" value={j.plagiarism_threshold ? `${j.plagiarism_threshold}%` : null} />
            <Fact label="Languages" value={j.languages?.join(", ") || null} />
          </div>
          {j.scope && <Section title="Scope & Aims"><p className="text-muted-foreground leading-relaxed">{j.scope}{j.aims ? " " + j.aims : ""}</p></Section>}
          {j.subject_areas.length > 0 && <Section title="Subject areas"><div className="flex flex-wrap gap-1">{j.subject_areas.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}</div></Section>}
          {j.figure_requirements && <Section title="Figure requirements"><p className="text-muted-foreground text-xs">{j.figure_requirements}</p></Section>}
          {(j.contact_email || j.editorial_office || j.editor_info) && (
            <Section title="Contact">
              {j.contact_email && <p className="text-xs flex items-center gap-1.5"><Mail className="w-3 h-3" />{j.contact_email}</p>}
              {j.editorial_office && <p className="text-xs text-muted-foreground">{j.editorial_office}</p>}
              {j.editor_info && <p className="text-xs text-muted-foreground">{j.editor_info}</p>}
            </Section>
          )}
        </div>
        <DialogFooter className="flex-wrap gap-2">
          {j.website && <Button asChild size="sm" variant="outline"><a href={j.website} target="_blank" rel="noreferrer"><Globe className="w-3.5 h-3.5 mr-1" />Website</a></Button>}
          {j.submission_url && <Button asChild size="sm"><a href={j.submission_url} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5 mr-1" />Submit</a></Button>}
          {j.template_url && <Button asChild size="sm" variant="outline"><a href={j.template_url} target="_blank" rel="noreferrer">Template</a></Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
const Fact = ({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) => (
  <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="text-xs font-medium flex items-center gap-1">{icon}{value || "—"}</div></div>
);
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{title}</div>{children}</div>
);

// ---------- Admin Editor Dialog ----------
const emptyJournal: Partial<Journal> = {
  name: "", region: "international", risk_status: "safe", is_active: true,
  subject_areas: [], keywords: [], languages: ["English"], apc_currency: "USD",
};

const isUrl = (v: string) => /^https?:\/\/\S+\.\S+/.test(v.trim());
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const norm = (v?: string | null) => (v || "").trim().toLowerCase().replace(/\s+/g, " ");

const validateJournal = (form: Partial<Journal>, all: Journal[], existingId?: string): string | null => {
  const name = (form.name || "").trim();
  if (name.length < 3) return "Journal name must be at least 3 characters";
  const dupName = all.find((j) => j.id !== existingId && norm(j.name) === norm(name));
  if (dupName) return `A journal named "${dupName.name}" already exists`;
  for (const key of ["issn", "e_issn"] as const) {
    const v = (form[key] || "").trim();
    if (!v) continue;
    if (!/^\d{4}-\d{3}[\dxX]$/.test(v)) return `${key === "issn" ? "ISSN" : "e-ISSN"} must look like 1234-5678`;
    const dup = all.find((j) => j.id !== existingId && (norm(j.issn) === norm(v) || norm(j.e_issn) === norm(v)));
    if (dup) return `ISSN ${v} is already used by "${dup.name}"`;
  }
  for (const [label, val] of [["Website", form.website], ["Submission URL", form.submission_url], ["Template URL", form.template_url]] as const) {
    if (val && !isUrl(val)) return `${label} must be a valid http(s) URL`;
  }
  if (form.contact_email && !isEmail(form.contact_email)) return "Contact email is not valid";
  if (form.apc_amount != null && form.apc_amount < 0) return "APC amount cannot be negative";
  if (form.acceptance_rate != null && (form.acceptance_rate < 0 || form.acceptance_rate > 100)) return "Acceptance rate must be 0–100";
  if (form.plagiarism_threshold != null && (form.plagiarism_threshold < 0 || form.plagiarism_threshold > 100)) return "Plagiarism threshold must be 0–100";
  if (form.review_time_weeks != null && form.review_time_weeks < 0) return "Review time cannot be negative";
  if (form.risk_status !== "safe" && !(form.risk_note || "").trim()) return "Add a risk note when marking a journal as caution or high risk";
  return null;
};

const AdminEditor = ({ open, onOpenChange, existing, journals }: { open: boolean; onOpenChange: (v: boolean) => void; existing: Journal | null; journals: Journal[] }) => {
  const [form, setForm] = useState<Partial<Journal>>(existing ?? emptyJournal);
  const [error, setError] = useState<string | null>(null);
  const { upsert } = useJournalMutations();
  const set = (k: keyof Journal, v: any) => setForm((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (open) { setForm(existing ?? emptyJournal); setError(null); }
  }, [open, existing]);

  const save = async () => {
    const problem = validateJournal(form, journals, existing?.id);
    if (problem) { setError(problem); return toast({ title: problem, variant: "destructive" }); }
    setError(null);
    try {
      await upsert.mutateAsync({ ...form, name: (form.name || "").trim() });
      toast({ title: existing ? "Journal updated" : "Journal added" });
      onOpenChange(false);
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{existing ? "Edit journal" : "Add journal"}</DialogTitle></DialogHeader>
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-2.5 text-xs text-destructive flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Name *" className="col-span-2"><Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Publisher"><Input value={form.publisher || ""} onChange={(e) => set("publisher", e.target.value)} /></Field>
          <Field label="Country"><Input value={form.country || ""} onChange={(e) => set("country", e.target.value)} /></Field>
          <Field label="ISSN"><Input placeholder="1234-5678" value={form.issn || ""} onChange={(e) => set("issn", e.target.value)} /></Field>
          <Field label="e-ISSN"><Input placeholder="1234-5678" value={form.e_issn || ""} onChange={(e) => set("e_issn", e.target.value)} /></Field>
          <Field label="Region">
            <Select value={form.region} onValueChange={(v) => set("region", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="international">International</SelectItem><SelectItem value="uzbekistan">Uzbekistan</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Quartile">
            <Select value={form.quartile || "none"} onValueChange={(v) => set("quartile", v === "none" ? null : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">—</SelectItem>{["Q1","Q2","Q3","Q4"].map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Website"><Input placeholder="https://…" value={form.website || ""} onChange={(e) => set("website", e.target.value)} /></Field>
          <Field label="Submission URL"><Input placeholder="https://…" value={form.submission_url || ""} onChange={(e) => set("submission_url", e.target.value)} /></Field>
          <Field label="Template URL"><Input placeholder="https://…" value={form.template_url || ""} onChange={(e) => set("template_url", e.target.value)} /></Field>
          <Field label="Publication frequency"><Input placeholder="Quarterly" value={form.publication_frequency || ""} onChange={(e) => set("publication_frequency", e.target.value)} /></Field>
          <Field label="APC amount"><Input type="number" value={form.apc_amount ?? ""} onChange={(e) => set("apc_amount", e.target.value ? Number(e.target.value) : null)} /></Field>
          <Field label="APC currency"><Input value={form.apc_currency || "USD"} onChange={(e) => set("apc_currency", e.target.value)} /></Field>
          <Field label="Review time (weeks)"><Input type="number" value={form.review_time_weeks ?? ""} onChange={(e) => set("review_time_weeks", e.target.value ? Number(e.target.value) : null)} /></Field>
          <Field label="Acceptance rate %"><Input type="number" value={form.acceptance_rate ?? ""} onChange={(e) => set("acceptance_rate", e.target.value ? Number(e.target.value) : null)} /></Field>
          <Field label="Contact email"><Input value={form.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} /></Field>
          <Field label="Citation style"><Input value={form.citation_style || ""} onChange={(e) => set("citation_style", e.target.value)} /></Field>
          <Field label="Editorial office"><Input value={form.editorial_office || ""} onChange={(e) => set("editorial_office", e.target.value)} /></Field>
          <Field label="Responsible person / editor"><Input value={form.editor_info || ""} onChange={(e) => set("editor_info", e.target.value)} /></Field>
          <Field label="Max pages"><Input type="number" value={form.max_pages ?? ""} onChange={(e) => set("max_pages", e.target.value ? Number(e.target.value) : null)} /></Field>
          <Field label="Plagiarism threshold %"><Input type="number" value={form.plagiarism_threshold ?? ""} onChange={(e) => set("plagiarism_threshold", e.target.value ? Number(e.target.value) : null)} /></Field>
          <Field label="Abstract min words"><Input type="number" value={form.abstract_min_words ?? ""} onChange={(e) => set("abstract_min_words", e.target.value ? Number(e.target.value) : null)} /></Field>
          <Field label="Abstract max words"><Input type="number" value={form.abstract_max_words ?? ""} onChange={(e) => set("abstract_max_words", e.target.value ? Number(e.target.value) : null)} /></Field>
          <Field label="Languages (comma-sep)" className="col-span-2">
            <Input value={(form.languages || []).join(", ")} onChange={(e) => set("languages", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
          </Field>
          <Field label="Subject areas (comma-sep)" className="col-span-2">
            <Input value={(form.subject_areas || []).join(", ")} onChange={(e) => set("subject_areas", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
          </Field>
          <Field label="Keywords (comma-sep)" className="col-span-2">
            <Input value={(form.keywords || []).join(", ")} onChange={(e) => set("keywords", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
          </Field>
          <Field label="Scope" className="col-span-2"><Textarea rows={2} value={form.scope || ""} onChange={(e) => set("scope", e.target.value)} /></Field>
          <Field label="Aims" className="col-span-2"><Textarea rows={2} value={form.aims || ""} onChange={(e) => set("aims", e.target.value)} /></Field>
          <Field label="Important requirements / notes" className="col-span-2"><Textarea rows={2} value={form.formatting_guide || ""} onChange={(e) => set("formatting_guide", e.target.value)} /></Field>
          <Field label="Figure requirements" className="col-span-2"><Textarea rows={2} value={form.figure_requirements || ""} onChange={(e) => set("figure_requirements", e.target.value)} /></Field>
          <Field label="Risk status">
            <Select value={form.risk_status} onValueChange={(v) => set("risk_status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="safe">Safe</SelectItem><SelectItem value="caution">Warning / caution</SelectItem><SelectItem value="high_risk">High risk</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Risk note"><Input value={form.risk_note || ""} onChange={(e) => set("risk_note", e.target.value)} /></Field>
          <div className="col-span-2 flex flex-wrap gap-4 pt-2">
            {(["is_scopus","is_wos","is_esci","is_oak","is_doaj","is_open_access","is_active"] as const).map((k) => (
              <label key={k} className="flex items-center gap-1.5 text-xs">
                <Checkbox checked={!!form[k]} onCheckedChange={(v) => set(k, !!v)} />{k.replace("is_","").toUpperCase()}
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
const Field = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={className}><div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>{children}</div>
);


// ---------- Bulk import ----------
const BulkImport = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [csv, setCsv] = useState("");
  const { bulkImport } = useJournalMutations();

  const doImport = async () => {
    try {
      const lines = csv.trim().split(/\r?\n/);
      if (lines.length < 2) throw new Error("CSV needs a header + rows");
      const headers = lines[0].split(",").map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const cells = line.split(",").map((c) => c.trim());
        const row: any = {};
        headers.forEach((h, i) => {
          const v = cells[i];
          if (["subject_areas","keywords","languages"].includes(h)) row[h] = v ? v.split(";").map((x) => x.trim()) : [];
          else if (["is_scopus","is_wos","is_esci","is_oak","is_doaj","is_open_access","is_active"].includes(h)) row[h] = v?.toLowerCase() === "true";
          else if (["apc_amount","acceptance_rate","plagiarism_threshold","review_time_weeks","max_pages","abstract_min_words","abstract_max_words"].includes(h)) row[h] = v ? Number(v) : null;
          else row[h] = v || null;
        });
        if (!row.region) row.region = "international";
        if (!row.risk_status) row.risk_status = "safe";
        return row;
      });
      await bulkImport.mutateAsync(rows);
      toast({ title: `Imported ${rows.length} journals` });
      onOpenChange(false); setCsv("");
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk import journals (CSV)</DialogTitle>
          <DialogDescription>Header row required. Use ; to separate array values (subject_areas, keywords, languages).</DialogDescription>
        </DialogHeader>
        <div className="text-[11px] font-mono bg-muted p-2 rounded">name,publisher,country,region,issn,quartile,apc_amount,is_scopus,is_wos,is_oak,subject_areas,keywords</div>
        <Textarea rows={10} placeholder="name,publisher,country,..." value={csv} onChange={(e) => setCsv(e.target.value)} className="font-mono text-xs" />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={doImport} disabled={bulkImport.isPending}>{bulkImport.isPending ? "Importing..." : "Import"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---------- AI Matcher ----------
const AiMatcher = ({ onOpenJournal }: { onOpenJournal: (j: Journal) => void }) => {
  const [title, setTitle] = useState("");
  const [abstractText, setAbstractText] = useState("");
  const [keywordsStr, setKeywordsStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);

  const run = async () => {
    if (title.trim().length < 5) return toast({ title: "Title too short", variant: "destructive" });
    setLoading(true); setResult(null);
    try {
      const r = await matchJournals({ title, abstract: abstractText, keywords: keywordsStr.split(",").map((k) => k.trim()).filter(Boolean) });
      setResult(r);
    } catch (e: any) {
      toast({ title: "Matcher failed", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /><h3 className="font-semibold text-sm">AI Journal Matcher</h3></div>
        <Input placeholder="Manuscript title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea rows={4} placeholder="Abstract (optional but improves matching)" value={abstractText} onChange={(e) => setAbstractText(e.target.value)} />
        <Input placeholder="Keywords (comma-separated)" value={keywordsStr} onChange={(e) => setKeywordsStr(e.target.value)} />
        <Button onClick={run} disabled={loading} className="w-full sm:w-auto">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyzing…</> : <><Sparkles className="w-4 h-4 mr-2" />Find best journals</>}
        </Button>
      </div>

      {result && (
        <div className="space-y-4">
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Best matches</h4>
            <div className="space-y-2">
              {result.matches.map((m) => (
                <MatchCard key={m.id} m={m} onOpen={onOpenJournal} />
              ))}
              {result.matches.length === 0 && <p className="text-sm text-muted-foreground">No strong matches. Try adding more keywords.</p>}
            </div>
          </div>
          {result.alternatives.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Alternatives</h4>
              <div className="space-y-2">{result.alternatives.map((m) => <MatchCard key={m.id} m={m as any} onOpen={onOpenJournal} />)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MatchCard = ({ m, onOpen }: { m: MatchResult["matches"][number]; onOpen: (j: Journal) => void }) => (
  <button onClick={() => onOpen(m.journal)} className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-sm">{m.journal.name}</h4>
          <RiskBadge status={m.journal.risk_status} />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{m.journal.publisher}</p>
        <p className="text-xs mt-2 leading-relaxed">{m.reason}</p>
        <div className="flex gap-3 mt-2 text-[11px] text-muted-foreground">
          {m.est_review_weeks && <span>~{m.est_review_weeks}w review</span>}
          {m.est_cost && <span>{m.est_cost}</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-2xl font-bold text-primary">{m.fit}%</div>
        <div className="text-[10px] uppercase text-muted-foreground">fit</div>
      </div>
    </div>
  </button>
);

// ---------- Comparison ----------
const Comparison = ({ journals }: { journals: Journal[] }) => {
  const [ids, setIds] = useState<string[]>([]);
  const selected = journals.filter((j) => ids.includes(j.id)).slice(0, 4);
  const toggle = (id: string) => setIds((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length >= 4 ? s : [...s, id]);
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><GitCompare className="w-4 h-4" />Pick up to 4 journals to compare</h3>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {journals.map((j) => (
            <label key={j.id} className="flex items-center gap-2 text-xs hover:bg-muted/50 rounded p-1">
              <Checkbox checked={ids.includes(j.id)} onCheckedChange={() => toggle(j.id)} disabled={!ids.includes(j.id) && ids.length >= 4} />
              <span>{j.name}</span>
            </label>
          ))}
        </div>
      </div>
      {selected.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead><tr className="border-b border-border"><th className="text-left p-2 text-muted-foreground">Attribute</th>{selected.map((j) => <th key={j.id} className="text-left p-2">{j.name}</th>)}</tr></thead>
            <tbody>
              {[
                ["Publisher", (j: Journal) => j.publisher],
                ["Quartile", (j: Journal) => j.quartile],
                ["Scopus", (j: Journal) => j.is_scopus ? "✓" : "—"],
                ["WoS", (j: Journal) => j.is_wos ? "✓" : "—"],
                ["Open Access", (j: Journal) => j.is_open_access ? "✓" : "—"],
                ["APC", (j: Journal) => j.apc_amount != null ? `${j.apc_amount} ${j.apc_currency}` : "Free"],
                ["Review weeks", (j: Journal) => j.review_time_weeks ?? "—"],
                ["Acceptance", (j: Journal) => j.acceptance_rate ? `${j.acceptance_rate}%` : "—"],
                ["Risk", (j: Journal) => j.risk_status],
              ].map(([label, fn]) => (
                <tr key={label as string} className="border-b border-border/50">
                  <td className="p-2 font-medium text-muted-foreground">{label as string}</td>
                  {selected.map((j) => <td key={j.id} className="p-2">{(fn as any)(j)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ---------- APC Calculator ----------
const ApcCalculator = ({ journals }: { journals: Journal[] }) => {
  const [pickIds, setPickIds] = useState<string[]>([]);
  const [discount, setDiscount] = useState(0);
  const [rate, setRate] = useState(1);
  const picked = journals.filter((j) => pickIds.includes(j.id));
  const total = picked.reduce((sum, j) => sum + (j.apc_amount || 0), 0) * (1 - discount / 100) * rate;
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2"><Calculator className="w-4 h-4" />APC Calculator</h3>
      <div className="max-h-32 overflow-y-auto space-y-1">
        {journals.filter((j) => j.apc_amount != null).map((j) => (
          <label key={j.id} className="flex items-center gap-2 text-xs">
            <Checkbox checked={pickIds.includes(j.id)} onCheckedChange={(v) => setPickIds((s) => v ? [...s, j.id] : s.filter((x) => x !== j.id))} />
            <span>{j.name}</span><span className="ml-auto text-muted-foreground">{j.apc_amount} {j.apc_currency}</span>
          </label>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Discount %"><Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} /></Field>
        <Field label="Currency multiplier"><Input type="number" step="0.01" value={rate} onChange={(e) => setRate(Number(e.target.value) || 1)} /></Field>
      </div>
      <div className="text-lg font-bold">Estimated: {total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
    </div>
  );
};

// ---------- Submission Checklist ----------
const Checklist = ({ j }: { j: Journal | null }) => {
  const items = [
    "Manuscript matches scope & subject areas",
    j?.abstract_max_words ? `Abstract within ${j.abstract_min_words ?? 0}–${j.abstract_max_words} words` : "Abstract within journal limits",
    j?.max_pages ? `Manuscript ≤ ${j.max_pages} pages` : "Manuscript within page limit",
    j?.citation_style ? `References formatted in ${j.citation_style} style` : "References in required citation style",
    j?.plagiarism_threshold ? `Similarity < ${j.plagiarism_threshold}%` : "Plagiarism check passed",
    "Figures at required resolution / format",
    "Cover letter drafted",
    "Author info & ORCID ready",
    "Conflict of interest declared",
    "Ethics / funding statements included",
  ];
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><ClipboardList className="w-4 h-4" />Submission Checklist{j && <span className="text-xs font-normal text-muted-foreground">— {j.name}</span>}</h3>
      <ul className="space-y-1.5">
        {items.map((it) => <li key={it} className="flex items-start gap-2 text-xs"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{it}</li>)}
      </ul>
    </div>
  );
};

// ================== MAIN ==================
export const PublicationCenter = () => {
  const { data: journals = [], isLoading } = useJournals();
  const { isAdmin } = useAdmin();

  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [subject, setSubject] = useState<string>("all");
  const [indexing, setIndexing] = useState<string>("all");
  const [quartile, setQuartile] = useState<string>("all");
  const [risk, setRisk] = useState<string>("all");
  const [oaOnly, setOaOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);

  const [openJournal, setOpenJournal] = useState<Journal | null>(null);
  const [editing, setEditing] = useState<Journal | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(() => {
    return journals.filter((j) => {
      if (q && !`${j.name} ${j.publisher} ${j.keywords.join(" ")} ${j.subject_areas.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (region !== "all" && j.region !== region) return false;
      if (subject !== "all" && !j.subject_areas.includes(subject)) return false;
      if (quartile !== "all" && j.quartile !== quartile) return false;
      if (risk !== "all" && j.risk_status !== risk) return false;
      if (oaOnly && !j.is_open_access) return false;
      if (freeOnly && !(j.apc_amount == null || j.apc_amount === 0)) return false;
      if (indexing !== "all") {
        const map: Record<string, keyof Journal> = { scopus: "is_scopus", wos: "is_wos", oak: "is_oak", doaj: "is_doaj", esci: "is_esci" };
        if (!j[map[indexing]]) return false;
      }
      return true;
    });
  }, [journals, q, region, subject, indexing, quartile, risk, oaOnly, freeOnly]);

  const stats = useMemo(() => ({
    total: journals.length,
    scopus: journals.filter((j) => j.is_scopus).length,
    oa: journals.filter((j) => j.is_open_access).length,
    free: journals.filter((j) => !j.apc_amount).length,
    uz: journals.filter((j) => j.region === "uzbekistan").length,
  }), [journals]);

  return (
    <div className="space-y-6">
      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          ["Total", stats.total], ["Scopus", stats.scopus], ["Open Access", stats.oa], ["Free (no APC)", stats.free], ["Uzbekistan", stats.uz],
        ].map(([l, v]) => (
          <div key={l as string} className="bg-card border border-border rounded-xl p-3">
            <div className="text-[10px] uppercase text-muted-foreground">{l as string}</div>
            <div className="text-lg font-bold">{v as number}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="browse">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 h-auto gap-1 p-1">
          <TabsTrigger value="browse" className="text-xs gap-1"><BookOpen className="w-3.5 h-3.5" />Browse</TabsTrigger>
          <TabsTrigger value="match" className="text-xs gap-1"><Sparkles className="w-3.5 h-3.5" />AI Matcher</TabsTrigger>
          <TabsTrigger value="compare" className="text-xs gap-1"><GitCompare className="w-3.5 h-3.5" />Compare</TabsTrigger>
          <TabsTrigger value="tools" className="text-xs gap-1"><Calculator className="w-3.5 h-3.5" />Tools</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin" className="text-xs gap-1"><Pencil className="w-3.5 h-3.5" />Admin</TabsTrigger>}
        </TabsList>

        {/* Browse */}
        <TabsContent value="browse" className="space-y-4 mt-4">
          <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search journals, keywords, subjects…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select value={region} onValueChange={setRegion}><SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="all">All regions</SelectItem><SelectItem value="international">International</SelectItem><SelectItem value="uzbekistan">Uzbekistan</SelectItem>
            </SelectContent></Select>
            <Select value={subject} onValueChange={setSubject}><SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="all">All subjects</SelectItem>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent></Select>
            <Select value={indexing} onValueChange={setIndexing}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="all">All indexing</SelectItem>{["scopus","wos","esci","oak","doaj"].map((x) => <SelectItem key={x} value={x}>{x.toUpperCase()}</SelectItem>)}
            </SelectContent></Select>
            <Select value={quartile} onValueChange={setQuartile}><SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="all">All Q</SelectItem>{["Q1","Q2","Q3","Q4"].map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
            </SelectContent></Select>
            <Select value={risk} onValueChange={setRisk}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="all">All risk</SelectItem>{["safe","caution","high_risk"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent></Select>
            <label className="flex items-center gap-1.5 text-xs px-2"><Checkbox checked={oaOnly} onCheckedChange={(v) => setOaOnly(!!v)} />OA only</label>
            <label className="flex items-center gap-1.5 text-xs px-2"><Checkbox checked={freeOnly} onCheckedChange={(v) => setFreeOnly(!!v)} />Free only</label>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((j) => (
                <button key={j.id} onClick={() => setOpenJournal(j)} className="text-left bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm leading-tight">{j.name}</h3>
                    <RiskBadge status={j.risk_status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{j.publisher} • {j.country}</p>
                  <div className="mt-2"><IndexingBadges j={j} /></div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{j.apc_amount != null ? `${j.apc_amount} ${j.apc_currency}` : "Free"}</span>
                    {j.review_time_weeks && <span>~{j.review_time_weeks}w</span>}
                  </div>
                </button>
              ))}
              {filtered.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12 text-sm">No journals match your filters.</p>}
            </div>
          )}
        </TabsContent>

        {/* AI Matcher */}
        <TabsContent value="match" className="mt-4"><AiMatcher onOpenJournal={setOpenJournal} /></TabsContent>

        {/* Compare */}
        <TabsContent value="compare" className="mt-4"><Comparison journals={journals} /></TabsContent>

        {/* Tools */}
        <TabsContent value="tools" className="mt-4 grid gap-4 md:grid-cols-2">
          <ApcCalculator journals={journals} />
          <Checklist j={openJournal} />
        </TabsContent>

        {/* Admin */}
        {isAdmin && (
          <TabsContent value="admin" className="mt-4">
            <AdminJournalsPanel
              journals={journals}
              onAdd={() => { setEditing(null); setEditorOpen(true); }}
              onEdit={(j) => { setEditing(j); setEditorOpen(true); }}
              onImport={() => setImportOpen(true)}
            />
          </TabsContent>
        )}
      </Tabs>

      <JournalProfileDialog j={openJournal} open={!!openJournal} onOpenChange={(v) => !v && setOpenJournal(null)} />
      {isAdmin && <AdminEditor open={editorOpen} onOpenChange={setEditorOpen} existing={editing} journals={journals} />}
      {isAdmin && <BulkImport open={importOpen} onOpenChange={setImportOpen} />}
    </div>
  );
};

// ---------- Admin journals management panel ----------
const AdminJournalsPanel = ({ journals, onAdd, onEdit, onImport }: {
  journals: Journal[];
  onAdd: () => void;
  onEdit: (j: Journal) => void;
  onImport: () => void;
}) => {
  const { remove } = useJournalMutations();
  const [aq, setAq] = useState("");
  const [aRegion, setARegion] = useState("all");
  const [aRisk, setARisk] = useState("all");
  const [aIndex, setAIndex] = useState("all");
  const [aStatus, setAStatus] = useState("all");
  const [sort, setSort] = useState("name");
  const [pendingDelete, setPendingDelete] = useState<Journal | null>(null);

  const rows = useMemo(() => {
    const list = journals.filter((j) => {
      if (aq && !`${j.name} ${j.publisher ?? ""} ${j.country ?? ""} ${j.issn ?? ""} ${j.subject_areas.join(" ")}`.toLowerCase().includes(aq.toLowerCase())) return false;
      if (aRegion !== "all" && j.region !== aRegion) return false;
      if (aRisk !== "all" && j.risk_status !== aRisk) return false;
      if (aStatus !== "all" && j.is_active !== (aStatus === "active")) return false;
      if (aIndex !== "all") {
        const map: Record<string, keyof Journal> = { scopus: "is_scopus", wos: "is_wos", oak: "is_oak", doaj: "is_doaj", esci: "is_esci", oa: "is_open_access" };
        if (!j[map[aIndex]]) return false;
      }
      return true;
    });
    const cmp: Record<string, (a: Journal, b: Journal) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      publisher: (a, b) => (a.publisher || "").localeCompare(b.publisher || ""),
      country: (a, b) => (a.country || "").localeCompare(b.country || ""),
      quartile: (a, b) => (a.quartile || "Z").localeCompare(b.quartile || "Z"),
      apc: (a, b) => (a.apc_amount ?? 0) - (b.apc_amount ?? 0),
      updated: (a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""),
    };
    return [...list].sort(cmp[sort] || cmp.name);
  }, [journals, aq, aRegion, aRisk, aIndex, aStatus, sort]);

  const doDelete = async () => {
    if (!pendingDelete) return;
    try {
      await remove.mutateAsync(pendingDelete.id);
      toast({ title: `Deleted "${pendingDelete.name}"` });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Button size="sm" onClick={onAdd}><Plus className="w-3.5 h-3.5 mr-1" />Add journal</Button>
        <Button size="sm" variant="outline" onClick={onImport}><Upload className="w-3.5 h-3.5 mr-1" />Bulk import</Button>
        <span className="text-xs text-muted-foreground ml-auto">{rows.length} of {journals.length} journals</span>
      </div>

      <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search name, publisher, country, ISSN…" value={aq} onChange={(e) => setAq(e.target.value)} />
        </div>
        <Select value={aRegion} onValueChange={setARegion}><SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="all">All regions</SelectItem><SelectItem value="international">International</SelectItem><SelectItem value="uzbekistan">Uzbekistan</SelectItem>
        </SelectContent></Select>
        <Select value={aRisk} onValueChange={setARisk}><SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="all">All risk</SelectItem><SelectItem value="safe">Safe</SelectItem><SelectItem value="caution">Warning</SelectItem><SelectItem value="high_risk">High risk</SelectItem>
        </SelectContent></Select>
        <Select value={aIndex} onValueChange={setAIndex}><SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="all">All indexing</SelectItem>{["scopus","wos","esci","oak","doaj","oa"].map((x) => <SelectItem key={x} value={x}>{x === "oa" ? "Open Access" : x.toUpperCase()}</SelectItem>)}
        </SelectContent></Select>
        <Select value={aStatus} onValueChange={setAStatus}><SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="all">Any status</SelectItem><SelectItem value="active">Published</SelectItem><SelectItem value="inactive">Hidden</SelectItem>
        </SelectContent></Select>
        <Select value={sort} onValueChange={setSort}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="name">Sort: Name</SelectItem>
          <SelectItem value="publisher">Sort: Publisher</SelectItem>
          <SelectItem value="country">Sort: Country</SelectItem>
          <SelectItem value="quartile">Sort: Quartile</SelectItem>
          <SelectItem value="apc">Sort: APC</SelectItem>
          <SelectItem value="updated">Sort: Recently updated</SelectItem>
        </SelectContent></Select>
      </div>

      <div className="bg-card border border-border rounded-xl divide-y divide-border max-h-[520px] overflow-y-auto">
        {rows.map((j) => (
          <div key={j.id} className="flex items-center gap-2 p-2 text-xs">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate flex items-center gap-1.5">
                {j.name}
                {!j.is_active && <Badge variant="outline" className="text-[9px]">hidden</Badge>}
              </div>
              <div className="text-muted-foreground text-[11px] truncate">
                {[j.publisher, j.country, j.quartile, j.apc_amount != null ? `${j.apc_amount} ${j.apc_currency || "USD"}` : "Free"].filter(Boolean).join(" • ")}
              </div>
            </div>
            <div className="hidden md:block"><IndexingBadges j={j} /></div>
            <RiskBadge status={j.risk_status} />
            <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Edit ${j.name}`} onClick={() => onEdit(j)}><Pencil className="w-3.5 h-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" aria-label={`Delete ${j.name}`} onClick={() => setPendingDelete(j)}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-center text-muted-foreground py-10 text-sm">No journals match these filters.</p>}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(v) => !v && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this journal?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{pendingDelete?.name}&quot; will be permanently removed from the journal database. This cannot be undone —
              consider unchecking ACTIVE instead to hide it from students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} disabled={remove.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {remove.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
