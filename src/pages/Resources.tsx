import { useState, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useResources, useResourceCategories, DbResource, ResourceCategory } from "@/hooks/useResources";
import { useEngineeringFields } from "@/hooks/useEngineeringFields";
import {
  Search, SlidersHorizontal, Loader2, X, ArrowLeft, Star, Eye, Download, ExternalLink, Pin, Sparkles, BookOpen, LayoutGrid, List as ListIcon, Library,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SuggestResourceDialog } from "@/components/resources/SuggestResourceDialog";
import { toast } from "sonner";
import { canPreviewInline, isDirectFileUrl, buildDownloadUrl, suggestFilename } from "@/lib/resourceLinks";


const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  intermediate: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  advanced: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

const accessBadge: Record<string, string> = {
  public: "bg-secondary text-secondary-foreground",
  university: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  premium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  research: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
};

const Resources = () => {
  const { resources, loading, logView, logDownload } = useResources({ status: "approved" });
  const { categories } = useResourceCategories();
  const { fields } = useEngineeringFields();
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<ResourceCategory | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<"newest" | "popular" | "rated" | "downloads">("newest");
  const [difficulty, setDifficulty] = useState("all");
  const [access, setAccess] = useState("all");
  const [language, setLanguage] = useState("all");
  const [kind, setKind] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const resourcesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of resources) {
      if (r.category_id) map.set(r.category_id, (map.get(r.category_id) || 0) + 1);
    }
    return map;
  }, [resources]);

  const featured = useMemo(() => resources.filter((r) => r.is_featured).slice(0, 6), [resources]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = resources.filter((r) => {
      if (selectedField && r.field_id !== selectedField) return false;
      if (selectedCat && r.category_id !== selectedCat.id) return false;
      if (difficulty !== "all" && r.difficulty !== difficulty) return false;
      if (access !== "all" && r.access_level !== access) return false;
      if (language !== "all" && r.language !== language) return false;
      if (kind !== "all" && (r.resource_kind || "") !== kind) return false;
      if (q) {
        const haystack = `${r.title} ${r.subtitle ?? ""} ${r.description} ${r.author ?? ""} ${(r.authors ?? []).join(" ")} ${r.publisher ?? ""} ${r.isbn ?? ""} ${(r.tags ?? []).join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    list.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      if (sort === "popular") return b.view_count - a.view_count;
      if (sort === "rated") return b.rating_avg - a.rating_avg;
      if (sort === "downloads") return b.download_count - a.download_count;
      return +new Date(b.created_at) - +new Date(a.created_at);
    });
    return list;
  }, [resources, selectedField, selectedCat, search, sort, difficulty, access, language, kind]);

  const languages = useMemo(() => Array.from(new Set(resources.map((r) => r.language).filter(Boolean))).sort(), [resources]);
  const kinds = useMemo(() => Array.from(new Set(resources.map((r) => r.resource_kind).filter(Boolean))).sort() as string[], [resources]);
  const resourcesByField = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of resources) if (r.field_id) m.set(r.field_id, (m.get(r.field_id) || 0) + 1);
    return m;
  }, [resources]);

  const openResource = (r: DbResource) => {
    if (!r.url || !r.url.trim()) {
      toast.error("This resource has no file attached yet. Please contact an administrator.");
      return;
    }
    void logView(r.id);
    if (r.type === "video" && r.url.includes("youtu")) {
      window.open(r.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (canPreviewInline(r.url, r.type)) {
      setPreviewUrl(r.url);
      return;
    }
    // Not renderable in an iframe (djvu, cad, archives, office docs, external pages):
    // open directly so the browser or OS handles it.
    if (isDirectFileUrl(r.url) && !["pdf", "image"].includes(r.type)) {
      toast.info("This file type can't be previewed in the browser — opening the file instead.");
    }
    window.open(r.url, "_blank", "noopener,noreferrer");
  };

  const downloadResource = async (r: DbResource) => {
    if (!r.url || !r.url.trim()) {
      toast.error("File unavailable — this resource has no file attached.");
      return;
    }
    void logDownload(r.id);
    window.open(buildDownloadUrl(r.url, suggestFilename(r.title, r.url)), "_blank", "noopener,noreferrer");
  };


  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {previewUrl && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
            <div className="bg-card rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-medium text-foreground">Preview</span>
                <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}><X className="w-4 h-4" /> Close</Button>
              </div>
              <iframe src={previewUrl} className="flex-1 w-full" title="Resource preview" />
            </div>
          </div>
        )}

        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Library className="w-5 h-5 text-primary" /> Engineering Digital Library</h1>
            <p className="text-sm text-muted-foreground">
              {selectedField ? fields.find(f=>f.id===selectedField)?.name : selectedCat ? selectedCat.name : "Browse by engineering discipline"}
            </p>
          </div>
          <SuggestResourceDialog />
        </header>

        <div className="p-6 md:p-8 space-y-6">
          {/* Field discipline strip */}
          {fields.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              <button
                onClick={() => { setSelectedField(null); setSelectedCat(null); }}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedField===null ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"}`}
              >All fields <Badge variant="secondary" className="text-[10px]">{resources.length}</Badge></button>
              {fields.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setSelectedField(f.id === selectedField ? null : f.id); setSelectedCat(null); }}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedField===f.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"}`}
                >
                  <span>{f.icon || "🔧"}</span>{f.name}
                  <Badge variant={selectedField===f.id ? "outline" : "secondary"} className="text-[10px]">{resourcesByField.get(f.id) || 0}</Badge>
                </button>
              ))}
            </div>
          )}

          {!selectedCat ? (
            <>
              {featured.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-primary" /> Featured</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {featured.map((r) => <ResourceCard key={r.id} resource={r} categories={categories} onOpen={openResource} onDownload={downloadResource} compact />)}
                  </div>
                </section>
              )}

              <section>
                <h2 className="text-sm font-semibold text-foreground mb-3">Categories</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCat(c)}
                      className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all group"
                      style={{ borderTopColor: c.color, borderTopWidth: 3 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl">{c.icon}</span>
                        <Badge variant="secondary" className="text-[10px]">{resourcesByCategory.get(c.id) || 0}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">{c.name}</p>
                      {c.description && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                    </button>
                  ))}
                </div>
              </section>

              {selectedField && (
                <section>
                  <h2 className="text-sm font-semibold text-foreground mb-3">Resources in this field</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((r) => <ResourceCard key={r.id} resource={r} categories={categories} onOpen={openResource} onDownload={downloadResource} />)}
                  </div>
                </section>
              )}
            </>
          ) : (
            <>

              <Button variant="ghost" size="sm" onClick={() => setSelectedCat(null)} className="gap-1"><ArrowLeft className="w-4 h-4" /> All specializations</Button>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search title, description, author, tags…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={sort} onValueChange={(v: any) => setSort(v)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="popular">Most viewed</SelectItem>
                    <SelectItem value="downloads">Most downloaded</SelectItem>
                    <SelectItem value="rated">Top rated</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </Button>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-primary text-primary-foreground" : "bg-card"}`}><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-primary text-primary-foreground" : "bg-card"}`}><ListIcon className="w-4 h-4" /></button>
                </div>
              </div>

              {showFilters && (
                <Card>
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Kind</p>
                      <Select value={kind} onValueChange={setKind}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All kinds</SelectItem>
                          {kinds.map((k) => <SelectItem key={k} value={k}>{k.replace(/_/g," ")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Difficulty</p>
                      <Select value={difficulty} onValueChange={setDifficulty}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Access</p>
                      <Select value={access} onValueChange={setAccess}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="university">University</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="research">Research</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Language</p>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {languages.map((l) => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              <p className="text-sm text-muted-foreground">{filtered.length} resource{filtered.length !== 1 ? "s" : ""}</p>

              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-lg">No resources yet in this category</p>
                  <p className="text-sm mt-1">Be the first — use “Suggest a Resource” above.</p>
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((r) => <ResourceCard key={r.id} resource={r} categories={categories} onOpen={openResource} onDownload={downloadResource} />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((r) => <ResourceRow key={r.id} resource={r} onOpen={openResource} />)}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

function ResourceCard({ resource, categories, onOpen, onDownload, compact }: { resource: DbResource; categories: ResourceCategory[]; onOpen: (r: DbResource) => void; onDownload?: (r: DbResource) => void | Promise<void>; compact?: boolean }) {
  const cat = categories.find((c) => c.id === resource.category_id);
  const diffClass = difficultyColors[resource.difficulty] || "";
  const authorLine = resource.authors && resource.authors.length > 0 ? resource.authors.join(", ") : resource.author;
  return (
    <div className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col">
      {resource.cover_url && (
        <div className="h-32 bg-secondary/40 flex items-center justify-center overflow-hidden border-b border-border">
          <img src={resource.cover_url} alt={resource.title} className="max-h-full object-contain" />
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-xl" style={{ background: (cat?.color || "#f97316") + "20", color: cat?.color || "#f97316" }}>
            {cat?.icon || "📄"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase">{resource.resource_kind || resource.type}</Badge>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${diffClass}`}>{resource.difficulty}</Badge>
              {resource.is_pinned && <Pin className="w-3 h-3 text-primary" />}
              <Badge className={`text-[10px] px-1.5 py-0 ${accessBadge[resource.access_level]}`}>{resource.access_level}</Badge>
            </div>
            <h3 className="font-semibold text-card-foreground text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">{resource.title}</h3>
            {resource.subtitle && <p className="text-[11px] text-muted-foreground/80 mt-0.5 line-clamp-1">{resource.subtitle}</p>}
          </div>
        </div>
        {!compact && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{resource.description}</p>}
        {authorLine && <p className="text-[11px] text-muted-foreground/80 mb-1 line-clamp-1"><span className="font-medium text-muted-foreground">By</span> {authorLine}</p>}
        {(resource.publisher || resource.publication_year) && (
          <p className="text-[11px] text-muted-foreground/70 mb-2">
            {[resource.publisher, resource.edition, resource.publication_year].filter(Boolean).join(" · ")}
          </p>
        )}
        {resource.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {resource.tags.slice(0, 4).map((t) => <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">#{t}</Badge>)}
          </div>
        )}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-3 mt-auto border-t border-border">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {resource.view_count}</span>
          <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {resource.download_count}</span>
          {resource.rating_count > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {resource.rating_avg.toFixed(1)}</span>}
          {onDownload && isDirectFileUrl(resource.url) && (
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={(e) => { e.stopPropagation(); void onDownload(resource); }} title="Download">
              <Download className="w-3 h-3" />
            </Button>
          )}
          <Button variant="default" size="sm" className="ml-auto text-xs h-7 gap-1" onClick={() => onOpen(resource)}>
            {canPreviewInline(resource.url, resource.type) ? "Preview" : <>Open <ExternalLink className="w-3 h-3" /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ResourceRow({ resource, onOpen }: { resource: DbResource; onOpen: (r: DbResource) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{resource.title}</p>
          {resource.is_pinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground truncate">{resource.author || resource.description}</p>
      </div>
      <Badge variant="outline" className="text-[10px] uppercase">{resource.type}</Badge>
      <span className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1"><Eye className="w-3 h-3" /> {resource.view_count}</span>
      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onOpen(resource)}>Open</Button>
    </div>
  );
}

export default Resources;
