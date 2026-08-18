import { useState, useMemo } from "react";
import {
  useResources, useResourceCategories, DbResource, ResourceCategory,
  ACCEPT_ATTR, MAX_UPLOAD_MB, validateFile, detectResourceType,
} from "@/hooks/useResources";
import { useEngineeringFields } from "@/hooks/useEngineeringFields";
import {
  Plus, Edit2, Trash2, Save, X, Upload, Loader2, ExternalLink, Pin, Star, CheckCircle2, XCircle, Folder, FileStack, BarChart3, Inbox, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

const TYPES = ["pdf", "djvu", "video", "image", "doc", "presentation", "dataset", "archive", "cad", "link"];
const KINDS = ["textbook","handbook","reference","lecture_notes","research_paper","manual","standard","dataset","educational_pdf","open_course","thesis","video","tool","link","other"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const ACCESS = ["public", "university", "premium", "research"];

const emptyForm = {
  title: "", subtitle: "", description: "", type: "link", category_id: "", url: "", author: "",
  authors: "", publisher: "", edition: "", publication_year: "", isbn: "", doi: "", cover_url: "",
  field_id: "", specialization_id: "", resource_kind: "reference", license: "", external_source_url: "",
  difficulty: "beginner", language: "en", tags: "", thumbnail_url: "",
  access_level: "public", is_featured: false, is_pinned: false, is_recommended: false,
  category: "general", status: "approved",
};

/* ---------------- Categories tab ---------------- */
function CategoriesTab() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useResourceCategories();
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "📁", color: "#f97316", description: "", sort_order: 999 });

  const start = (c?: ResourceCategory) => {
    if (c) { setEditing(c.id); setCreating(false); setForm({ name: c.name, icon: c.icon, color: c.color, description: c.description, sort_order: c.sort_order }); }
    else { setCreating(true); setEditing(null); setForm({ name: "", icon: "📁", color: "#f97316", description: "", sort_order: 999 }); }
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    if (creating) await createCategory(form as any);
    else if (editing) await updateCategory(editing, form as any);
    setEditing(null); setCreating(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Specialization categories ({categories.length})</h3>
        <Button size="sm" onClick={() => start()} className="gap-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> New category</Button>
      </div>

      {(creating || editing) && (
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3 border border-border">
          <div className="grid grid-cols-4 gap-3">
            <Input className="col-span-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name *" />
            <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Icon (emoji)" />
            <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" rows={2} />
          <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} placeholder="Sort order" />
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Save className="w-3 h-3 mr-1" /> Save</Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(null); setCreating(false); }}><X className="w-3 h-3 mr-1" /> Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card group" style={{ borderLeftColor: c.color, borderLeftWidth: 4 }}>
            <span className="text-2xl">{c.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{c.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{c.slug} · order {c.sort_order}</p>
            </div>
            <button onClick={() => start(c)} className="opacity-0 group-hover:opacity-100 p-1"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => { if (confirm(`Delete "${c.name}"? Resources in it will become uncategorized.`)) void deleteCategory(c.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Resources tab ---------------- */
function ResourcesTab({ status, title }: { status: "all" | "approved" | "pending"; title: string }) {
  const { resources, loading, createResource, updateResource, deleteResource, approveResource, rejectResource, uploadFile } = useResources({ status });
  const { categories } = useResourceCategories();
  const { fields } = useEngineeringFields();
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [search, setSearch] = useState("");

  const specsForField = useMemo(() => {
    const f = fields.find(x => x.id === form.field_id);
    return f?.specializations || [];
  }, [fields, form.field_id]);

  const startCreate = () => { setForm({ ...emptyForm }); setCreating(true); setEditing(null); };
  const startEdit = (r: DbResource) => {
    setForm({
      title: r.title, subtitle: r.subtitle || "", description: r.description, type: r.type, category_id: r.category_id || "",
      url: r.url, author: r.author || "", authors: (r.authors || []).join(", "),
      publisher: r.publisher || "", edition: r.edition || "",
      publication_year: r.publication_year ? String(r.publication_year) : "",
      isbn: r.isbn || "", doi: r.doi || "", cover_url: r.cover_url || "",
      field_id: r.field_id || "", specialization_id: r.specialization_id || "",
      resource_kind: r.resource_kind || "reference",
      license: r.license || "", external_source_url: r.external_source_url || "",
      difficulty: r.difficulty, language: r.language,
      tags: (r.tags || []).join(", "), thumbnail_url: r.thumbnail_url || "",
      access_level: r.access_level, is_featured: r.is_featured, is_pinned: r.is_pinned,
      is_recommended: !!(r as any).is_recommended,
      category: r.category, status: r.status,
    });
    setEditing(r.id); setCreating(false);
  };
  const cancel = () => { setCreating(false); setEditing(null); setForm(emptyForm); setProgress(0); };

  const save = async () => {
    if (!form.title?.trim()) return;
    if (uploading) { toast.error("Please wait for the file upload to finish."); return; }
    if (!form.url?.trim()) { toast.error("A file upload or URL is required so students can open the resource."); return; }
    const payload: any = {

      ...form,
      tags: typeof form.tags === "string" ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : form.tags,
      authors: typeof form.authors === "string" ? form.authors.split(",").map((s: string) => s.trim()).filter(Boolean) : form.authors,
      category_id: form.category_id || null,
      field_id: form.field_id || null,
      specialization_id: form.specialization_id || null,
      publication_year: form.publication_year ? parseInt(form.publication_year, 10) : null,
    };
    if (creating) await createResource(payload);
    else if (editing) await updateResource(editing, payload);
    cancel();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const v = validateFile(file); if (!v.ok) { toast.error(v.message); e.target.value = ""; return; }
    setUploading(true); setProgress(0);
    const url = await uploadFile(file, setProgress);
    if (url) setForm((f: any) => ({ ...f, url, title: f.title || file.name.replace(/\.[^.]+$/, ""), type: detectResourceType(file) }));
    setUploading(false); e.target.value = "";
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    setUploading(true);
    let done = 0;
    for (const f of files) {
      const v = validateFile(f); if (!v.ok) { toast.error(`${f.name}: ${v.message}`); continue; }
      setProgress(0);
      const url = await uploadFile(f, setProgress);
      if (url) {
        await createResource({
          title: f.name.replace(/\.[^.]+$/, ""), description: "", type: detectResourceType(f),
          url, category: "general", difficulty: "beginner", language: "en",
          tags: [], status: "approved", access_level: "public",
        } as any);
        done++;
      }
    }
    setUploading(false); e.target.value = "";
    toast.success(`Bulk uploaded ${done}/${files.length}`);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim(); if (!q) return resources;
    return resources.filter((r) => (`${r.title} ${r.description} ${r.author ?? ""}`).toLowerCase().includes(q));
  }, [resources, search]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  const isEditing = creating || editing;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold">{title} ({resources.length})</h3>
        <div className="flex gap-2">
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-xs w-48" />
          <label className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-secondary text-xs font-medium cursor-pointer hover:bg-secondary/70">
            <FileStack className="w-3.5 h-3.5" /> Bulk upload
            <input type="file" multiple className="hidden" disabled={uploading} accept={ACCEPT_ATTR} onChange={handleBulkUpload} />
          </label>
          <Button size="sm" onClick={startCreate} className="gap-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> Add</Button>
        </div>
      </div>

      {isEditing && (
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3 border border-border">
          <div className="space-y-2">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20 w-fit">
              <Upload className="w-3.5 h-3.5" /> {uploading ? `Uploading… ${progress}%` : "Upload file"}
              <input type="file" className="hidden" onChange={handleFile} disabled={uploading} accept={ACCEPT_ATTR} />
            </label>
            <p className="text-[11px] text-muted-foreground">Allowed: PDF, DJVU, Office, Images, Video, CAD, Archives · Max {MAX_UPLOAD_MB} MB</p>
            {uploading && <Progress value={progress} className="h-1.5" />}
            {form.url && !uploading && (
              <a href={form.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                <ExternalLink className="w-3 h-3" /> Preview file
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title *" />
            <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Subtitle" />
          </div>
          <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="URL (auto-filled on upload)" />
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} />

          <div className="grid grid-cols-3 gap-3">
            <Select value={form.field_id || "_none"} onValueChange={(v) => setForm({ ...form, field_id: v === "_none" ? "" : v, specialization_id: "" })}>
              <SelectTrigger><SelectValue placeholder="Engineering field" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="_none">— No field —</SelectItem>
                {fields.map((f) => <SelectItem key={f.id} value={f.id}>{f.icon || "🔧"} {f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.specialization_id || "_none"} onValueChange={(v) => setForm({ ...form, specialization_id: v === "_none" ? "" : v })} disabled={!form.field_id}>
              <SelectTrigger><SelectValue placeholder="Specialization" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="_none">— No specialization —</SelectItem>
                {specsForField.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.resource_kind} onValueChange={(v) => setForm({ ...form, resource_kind: v })}>
              <SelectTrigger><SelectValue placeholder="Kind" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {KINDS.map((k) => <SelectItem key={k} value={k}>{k.replace(/_/g," ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.category_id || "_none"} onValueChange={(v) => setForm({ ...form, category_id: v === "_none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Sub-category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— None —</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} placeholder="Authors (comma separated)" />
            <Input value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} placeholder="Publisher" />
            <Input value={form.edition} onChange={(e) => setForm({ ...form, edition: e.target.value })} placeholder="Edition (e.g. 5th)" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Input value={form.publication_year} onChange={(e) => setForm({ ...form, publication_year: e.target.value })} placeholder="Year" type="number" />
            <Input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} placeholder="ISBN" />
            <Input value={form.doi} onChange={(e) => setForm({ ...form, doi: e.target.value })} placeholder="DOI" />
            <Input value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} placeholder="License" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="Cover image URL" />
            <Input value={form.external_source_url} onChange={(e) => setForm({ ...form, external_source_url: e.target.value })} placeholder="Original source URL" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Primary author (legacy)" />
            <Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} placeholder="Language (en/ru/uz)" />
            <Select value={form.access_level} onValueChange={(v) => setForm({ ...form, access_level: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ACCESS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags (comma separated)" />
          <Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="Thumbnail URL (optional)" />
          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={!!form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured</label>
            <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={!!form.is_pinned} onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })} /> Pinned</label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save}><Save className="w-3 h-3 mr-1" /> Save</Button>
            <Button size="sm" variant="outline" onClick={cancel}><X className="w-3 h-3 mr-1" /> Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-1 max-h-[500px] overflow-y-auto">
        {filtered.map((r) => {
          const cat = categories.find((c) => c.id === r.category_id);
          return (
            <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/30 group border border-transparent hover:border-border">
              <span className="text-lg shrink-0">{cat?.icon || "📄"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  {r.is_pinned && <Pin className="w-3 h-3 text-primary" />}
                  {r.is_featured && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                  <Badge variant="outline" className="text-[10px] uppercase">{r.type}</Badge>
                  {r.status !== "approved" && <Badge variant="secondary" className="text-[10px]">{r.status}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {cat?.name || "Uncategorized"} · {r.difficulty} · {r.language} · {r.view_count} views
                </p>
              </div>
              {r.status === "pending" && (
                <>
                  <button onClick={() => approveResource(r.id)} className="p-1 text-emerald-600 hover:bg-emerald-500/10 rounded" title="Approve"><CheckCircle2 className="w-4 h-4" /></button>
                  <button onClick={() => { const reason = prompt("Rejection reason?") || ""; void rejectResource(r.id, reason); }} className="p-1 text-red-600 hover:bg-red-500/10 rounded" title="Reject"><XCircle className="w-4 h-4" /></button>
                </>
              )}
              <button onClick={() => startEdit(r)} className="opacity-0 group-hover:opacity-100 p-1"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => { if (confirm(`Delete "${r.title}"?`)) void deleteResource(r.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No resources.</p>}
      </div>
    </div>
  );
}

/* ---------------- Analytics tab ---------------- */
function AnalyticsTab() {
  const { resources, loading } = useResources();
  const { categories } = useResourceCategories();

  const stats = useMemo(() => {
    const total = resources.length;
    const totalViews = resources.reduce((s, r) => s + r.view_count, 0);
    const totalDownloads = resources.reduce((s, r) => s + r.download_count, 0);
    const pending = resources.filter((r) => r.status === "pending").length;
    const byCat = categories.map((c) => ({
      cat: c, count: resources.filter((r) => r.category_id === c.id).length,
      views: resources.filter((r) => r.category_id === c.id).reduce((s, r) => s + r.view_count, 0),
    })).sort((a, b) => b.count - a.count);
    const top = [...resources].sort((a, b) => b.view_count - a.view_count).slice(0, 8);
    return { total, totalViews, totalDownloads, pending, byCat, top };
  }, [resources, categories]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  const maxCat = Math.max(1, ...stats.byCat.map((b) => b.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total resources", value: stats.total },
          { label: "Total views", value: stats.totalViews },
          { label: "Downloads", value: stats.totalDownloads },
          { label: "Pending review", value: stats.pending },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-[11px] uppercase text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Resources by specialization</h3>
        <div className="space-y-1.5">
          {stats.byCat.slice(0, 12).map((b) => (
            <div key={b.cat.id} className="flex items-center gap-3">
              <span className="text-base w-6">{b.cat.icon}</span>
              <span className="text-xs w-48 truncate">{b.cat.name}</span>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(b.count / maxCat) * 100}%`, background: b.cat.color }} />
              </div>
              <span className="text-xs text-muted-foreground w-16 text-right">{b.count} items</span>
              <span className="text-xs text-muted-foreground w-20 text-right">{b.views} views</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Top viewed resources</h3>
        <div className="space-y-1">
          {stats.top.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border">
              <p className="text-sm flex-1 truncate">{r.title}</p>
              <Badge variant="outline" className="text-[10px]">{r.view_count} views</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Container ---------------- */
export const AdminResourceManagerDb = () => {
  return (
    <Tabs defaultValue="resources" className="w-full">
      <TabsList>
        <TabsTrigger value="resources" className="gap-1.5"><Folder className="w-3.5 h-3.5" /> Resources</TabsTrigger>
        <TabsTrigger value="pending" className="gap-1.5"><Inbox className="w-3.5 h-3.5" /> Pending</TabsTrigger>
        <TabsTrigger value="categories" className="gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Categories</TabsTrigger>
        <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Analytics</TabsTrigger>
      </TabsList>
      <TabsContent value="resources" className="mt-4"><ResourcesTab status="all" title="All resources" /></TabsContent>
      <TabsContent value="pending" className="mt-4"><ResourcesTab status="pending" title="Pending review" /></TabsContent>
      <TabsContent value="categories" className="mt-4"><CategoriesTab /></TabsContent>
      <TabsContent value="analytics" className="mt-4"><AnalyticsTab /></TabsContent>
    </Tabs>
  );
};
