import { useState } from "react";
import { resources as staticResources, Resource, ResourceCategory, ResourceType, DifficultyLevel, resourceCategoryInfo } from "@/data/resources";
import { Plus, Edit2, Trash2, Save, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Local state manager for resources (stored in localStorage for persistence)
const STORAGE_KEY = "admin_resources";

const loadResources = (): Resource[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [...staticResources];
  } catch {
    return [...staticResources];
  }
};

const saveResources = (r: Resource[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
};

const allTypes: ResourceType[] = ["pdf", "video", "link", "tool"];
const allDifficulties: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];
const allCategories: ResourceCategory[] = ["materials_science", "metallurgy", "mechanical_engineering", "heat_treatment", "cad_cam", "ai_ml", "robotics"];

export const AdminResourceManager = () => {
  const [resources, setResources] = useState<Resource[]>(loadResources);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Resource>>({});

  const update = (list: Resource[]) => {
    setResources(list);
    saveResources(list);
  };

  const startCreate = () => {
    setForm({
      id: `r-${Date.now()}`,
      title: "",
      type: "link",
      categories: [],
      description: "",
      url: "",
      difficulty: "beginner",
      dateAdded: new Date().toISOString().split("T")[0],
    });
    setCreating(true);
    setEditing(null);
  };

  const startEdit = (r: Resource) => {
    setForm({ ...r });
    setEditing(r.id);
    setCreating(false);
  };

  const handleSave = () => {
    if (!form.title?.trim() || !form.url?.trim()) {
      toast.error("Title and URL are required");
      return;
    }
    if (creating) {
      update([...resources, form as Resource]);
      toast.success("Resource added");
    } else if (editing) {
      update(resources.map((r) => (r.id === editing ? { ...r, ...form } as Resource : r)));
      toast.success("Resource updated");
    }
    setCreating(false);
    setEditing(null);
    setForm({});
  };

  const handleDelete = (id: string) => {
    update(resources.filter((r) => r.id !== id));
    toast.success("Resource deleted");
  };

  const toggleCategory = (cat: ResourceCategory) => {
    const current = form.categories || [];
    setForm({
      ...form,
      categories: current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat],
    });
  };

  const isEditing = creating || editing;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Resources ({resources.length})</h3>
        <Button size="sm" onClick={startCreate} className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Add Resource
        </Button>
      </div>

      {isEditing && (
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3 border border-border">
          <div className="grid grid-cols-2 gap-3">
            <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
            <Input value={form.url || ""} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="URL" />
          </div>
          <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} />
          <div className="grid grid-cols-3 gap-3">
            <Select value={form.type || "link"} onValueChange={(v) => setForm({ ...form, type: v as ResourceType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {allTypes.map((t) => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.difficulty || "beginner"} onValueChange={(v) => setForm({ ...form, difficulty: v as DifficultyLevel })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {allDifficulties.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input value={form.author || ""} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author (optional)" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Categories:</p>
            <div className="flex flex-wrap gap-1.5">
              {allCategories.map((cat) => (
                <Badge
                  key={cat}
                  variant={(form.categories || []).includes(cat) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleCategory(cat)}
                >
                  {resourceCategoryInfo[cat].icon} {cat.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} className="gap-1"><Save className="w-3 h-3" /> Save</Button>
            <Button size="sm" variant="outline" onClick={() => { setCreating(false); setEditing(null); setForm({}); }} className="gap-1"><X className="w-3 h-3" /> Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {resources.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/30 group">
            <span className="text-lg">{resourceCategoryInfo[r.categories[0]]?.icon || "📄"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.type} · {r.difficulty}</p>
            </div>
            <button onClick={() => startEdit(r)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => handleDelete(r.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};
