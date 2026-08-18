import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Save, X, Shield, ShieldOff, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useExpertsDb, useSpecializations, DbExpert } from "@/hooks/useExpertsDb";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const emptyForm = (): Partial<DbExpert> => ({
  name: "", title: "", position: "", institution: "", bio: "",
  avatar: "👤", availability: "available", is_lead: false, is_verified: true,
  research_interests: "", publications: [], languages: [], specializations: [],
});

export const AdminExpertsManagerDb = () => {
  const { experts, reload } = useExpertsDb();
  const { specializations, reload: reloadSpecs } = useSpecializations();
  const [tab, setTab] = useState("experts");

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="experts">Experts ({experts.length})</TabsTrigger>
        <TabsTrigger value="specs">Specializations ({specializations.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="experts"><ExpertsTab experts={experts} specs={specializations} reload={reload} /></TabsContent>
      <TabsContent value="specs"><SpecsTab specs={specializations} reload={reloadSpecs} /></TabsContent>
    </Tabs>
  );
};

/* ---------- Experts ---------- */
function ExpertsTab({ experts, specs, reload }: { experts: DbExpert[]; specs: any[]; reload: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<DbExpert>>(emptyForm());
  const [selectedSpecs, setSelectedSpecs] = useState<Set<string>>(new Set());
  const [linkUserId, setLinkUserId] = useState("");

  const startCreate = () => {
    setForm(emptyForm()); setSelectedSpecs(new Set()); setLinkUserId("");
    setCreating(true); setEditing(null);
  };

  const startEdit = (e: DbExpert) => {
    setForm({ ...e });
    setSelectedSpecs(new Set(e.specializations.map((s) => s.id)));
    setLinkUserId(e.user_id || "");
    setEditing(e.id); setCreating(false);
  };

  const save = async () => {
    if (!form.name?.trim()) { toast.error("Name required"); return; }
    const payload: any = {
      name: form.name, title: form.title || "", position: form.position || "",
      institution: form.institution || "", bio: form.bio || "", avatar: form.avatar || "👤",
      photo_url: form.photo_url || null, research_interests: form.research_interests || "",
      publications: form.publications || [], languages: form.languages || [],
      availability: form.availability || "available",
      email: form.email || null, telegram: form.telegram || null, phone: form.phone || null,
      is_verified: !!form.is_verified, is_lead: !!form.is_lead,
      user_id: linkUserId.trim() || null,
    };

    let expertId = editing;
    if (creating) {
      const { data, error } = await supabase.from("experts" as any).insert(payload).select().single();
      if (error) { toast.error(error.message); return; }
      expertId = (data as any).id;
    } else if (editing) {
      const { error } = await supabase.from("experts" as any).update(payload).eq("id", editing);
      if (error) { toast.error(error.message); return; }
    }

    // Sync specializations
    if (expertId) {
      await supabase.from("expert_specialization_links" as any).delete().eq("expert_id", expertId);
      const rows = Array.from(selectedSpecs).map((sid) => ({ expert_id: expertId, specialization_id: sid }));
      if (rows.length) await supabase.from("expert_specialization_links" as any).insert(rows);
    }

    toast.success(creating ? "Expert added" : "Expert updated");
    setCreating(false); setEditing(null);
    reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this expert?")) return;
    const { error } = await supabase.from("experts" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removed"); reload();
  };

  const toggleSpec = (id: string) => {
    setSelectedSpecs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Experts ({experts.length})</h3>
        <Button size="sm" onClick={startCreate} className="gap-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> Add Expert</Button>
      </div>

      {(creating || editing) && (
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3 border border-border">
          <div className="grid grid-cols-2 gap-3">
            <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name" />
            <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title (Professor / PhD)" />
            <Input value={form.position || ""} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Position" />
            <Input value={form.institution || ""} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="Institution" />
          </div>
          <Textarea value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Bio" rows={3} />
          <Textarea value={form.research_interests || ""} onChange={(e) => setForm({ ...form, research_interests: e.target.value })} placeholder="Research interests" rows={2} />
          <div className="grid grid-cols-3 gap-3">
            <Input value={form.avatar || ""} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="Avatar emoji" />
            <Input value={form.photo_url || ""} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="Photo URL (optional)" />
            <Select value={form.availability || "available"} onValueChange={(v) => setForm({ ...form, availability: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
            <Input value={form.telegram || ""} onChange={(e) => setForm({ ...form, telegram: e.target.value })} placeholder="Telegram (@handle)" />
            <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
          </div>
          <Input
            value={(form.publications || []).join(" | ")}
            onChange={(e) => setForm({ ...form, publications: e.target.value.split("|").map((s) => s.trim()).filter(Boolean) })}
            placeholder="Publications (separate by |)"
          />
          <Input
            value={(form.languages || []).join(", ")}
            onChange={(e) => setForm({ ...form, languages: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            placeholder="Languages (comma separated)"
          />

          <div>
            <p className="text-xs text-muted-foreground mb-2">Specializations:</p>
            <div className="flex flex-wrap gap-1.5">
              {specs.map((s) => (
                <Badge
                  key={s.id}
                  variant={selectedSpecs.has(s.id) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleSpec(s.id)}
                >{s.icon} {s.name}</Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={!!form.is_lead} onChange={(e) => setForm({ ...form, is_lead: e.target.checked })} /> Lead Expert
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={!!form.is_verified} onChange={(e) => setForm({ ...form, is_verified: e.target.checked })} /> Verified
            </label>
            <div className="flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={linkUserId}
                onChange={(e) => setLinkUserId(e.target.value)}
                placeholder="Linked auth user ID (optional)"
                className="h-8 text-xs w-72"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={save} className="gap-1"><Save className="w-3 h-3" /> Save</Button>
            <Button size="sm" variant="outline" onClick={() => { setCreating(false); setEditing(null); }} className="gap-1"><X className="w-3 h-3" /> Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-1 max-h-[500px] overflow-y-auto">
        {experts.map((e) => (
          <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/30 group">
            <span className="text-lg">{e.avatar}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
              <p className="text-xs text-muted-foreground truncate">{e.title} · {e.institution}</p>
            </div>
            {e.is_lead && <Badge variant="secondary" className="text-[10px]">Lead</Badge>}
            {e.is_verified ? <Shield className="w-3.5 h-3.5 text-primary" /> : <ShieldOff className="w-3.5 h-3.5 text-muted-foreground" />}
            {e.user_id && <Badge variant="outline" className="text-[10px]">linked</Badge>}
            <button onClick={() => startEdit(e)} className="opacity-0 group-hover:opacity-100 p-1"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => remove(e.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Specializations ---------- */
function SpecsTab({ specs, reload }: { specs: any[]; reload: () => void }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🔬");

  const add = async () => {
    if (!name.trim()) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
    const { error } = await supabase.from("expert_specializations" as any).insert({
      slug, name: name.trim(), icon: icon || "🔬",
      sort_order: (specs.at(-1)?.sort_order ?? 0) + 10,
    });
    if (error) { toast.error(error.message); return; }
    setName(""); setIcon("🔬");
    toast.success("Specialization added");
    reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this specialization?")) return;
    const { error } = await supabase.from("expert_specializations" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    reload();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">Name</p>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Robotics" />
        </div>
        <div className="w-24">
          <p className="text-xs text-muted-foreground mb-1">Icon</p>
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🦾" />
        </div>
        <Button onClick={add} className="gap-1.5"><Plus className="w-4 h-4" /> Add</Button>
      </div>

      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {specs.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/30 group">
            <span className="text-lg">{s.icon}</span>
            <span className="flex-1 text-sm text-foreground">{s.name}</span>
            <span className="text-xs text-muted-foreground">{s.slug}</span>
            <button onClick={() => remove(s.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
