import { useState } from "react";
import { Expert, ExpertCategory, categoryInfo } from "@/data/experts";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { loadExperts, saveExperts } from "@/hooks/useExperts";

const allCategories: ExpertCategory[] = ["machining", "machine_design", "materials", "heat_treatment", "cad_cam", "innovation"];

export const AdminExpertManager = () => {
  const [experts, setExperts] = useState<Expert[]>(loadExperts);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Expert>>({});

  const update = (list: Expert[]) => {
    setExperts(list);
    saveExperts(list);
  };

  const startCreate = () => {
    setForm({
      id: `e-${Date.now()}`,
      name: "",
      title: "",
      position: "",
      institution: "",
      bio: "",
      expertise: [],
      categories: [],
      avatar: "👤",
    });
    setCreating(true);
    setEditing(null);
  };

  const startEdit = (e: Expert) => {
    setForm({ ...e });
    setEditing(e.id);
    setCreating(false);
  };

  const handleSave = () => {
    if (!form.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    if (creating) {
      update([...experts, form as Expert]);
      toast.success("Expert added");
    } else if (editing) {
      update(experts.map((e) => (e.id === editing ? { ...e, ...form } as Expert : e)));
      toast.success("Expert updated");
    }
    setCreating(false);
    setEditing(null);
    setForm({});
  };

  const handleDelete = (id: string) => {
    update(experts.filter((e) => e.id !== id));
    toast.success("Expert removed");
  };

  const toggleCategory = (cat: ExpertCategory) => {
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
        <h3 className="text-sm font-semibold text-foreground">Experts ({experts.length})</h3>
        <Button size="sm" onClick={startCreate} className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Add Expert
        </Button>
      </div>

      {isEditing && (
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3 border border-border">
          <div className="grid grid-cols-2 gap-3">
            <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name" />
            <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title (e.g. Professor)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input value={form.position || ""} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Position" />
            <Input value={form.institution || ""} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="Institution" />
          </div>
          <Textarea value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Bio" rows={2} />
          <div className="grid grid-cols-3 gap-3">
            <Input value={form.avatar || ""} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="Avatar emoji" />
            <Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
            <Input value={form.telegram || ""} onChange={(e) => setForm({ ...form, telegram: e.target.value })} placeholder="Telegram" />
          </div>
          <Input
            value={(form.expertise || []).join(", ")}
            onChange={(e) => setForm({ ...form, expertise: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            placeholder="Expertise (comma-separated)"
          />
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
                  {categoryInfo[cat].icon} {cat.replace(/_/g, " ")}
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
        {experts.map((e) => (
          <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/30 group">
            <span className="text-lg">{e.avatar}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
              <p className="text-xs text-muted-foreground">{e.title} · {e.institution}</p>
            </div>
            {e.isLead && <Badge variant="secondary" className="text-[10px]">Lead</Badge>}
            <button onClick={() => startEdit(e)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => handleDelete(e.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};
