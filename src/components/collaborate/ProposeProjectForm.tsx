import { useState } from "react";
import { useCollaboration, type CollabProject } from "@/hooks/useCollaboration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onCreated: () => void;
  onCancel: () => void;
}

export const ProposeProjectForm = ({ onCreated, onCancel }: Props) => {
  const { proposeProject, callAI } = useCollaboration();
  const [form, setForm] = useState({
    title: "",
    topic: "",
    description: "",
    country_focus: "",
    max_team_size: 5,
  });
  const [roles, setRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [ideaBusy, setIdeaBusy] = useState(false);
  const [ideas, setIdeas] = useState<{ title: string; summary: string; difficulty: string }[]>([]);

  const addRole = (val?: string) => {
    const r = (val ?? roleInput).trim();
    if (!r) return;
    if (roles.includes(r)) return;
    setRoles([...roles, r]);
    setRoleInput("");
  };

  const suggestTeam = async () => {
    if (!form.topic.trim()) {
      toast.error("Enter a topic first");
      return;
    }
    setAiBusy(true);
    try {
      const data = await callAI("suggest_team", { topic: form.topic, description: form.description });
      if (data?.roles) {
        const fresh = (data.roles as { title: string }[]).map((r) => r.title).filter((r) => !roles.includes(r));
        setRoles([...roles, ...fresh]);
        setForm((f) => ({ ...f, max_team_size: data.recommended_size ?? f.max_team_size }));
        toast.success("Team suggestion applied", { description: data.rationale });
      }
    } catch (e) {
      toast.error("AI suggestion failed");
    } finally {
      setAiBusy(false);
    }
  };

  const generateIdeas = async () => {
    if (!form.topic.trim()) {
      toast.error("Enter a topic first");
      return;
    }
    setIdeaBusy(true);
    try {
      const data = await callAI("generate_ideas", { topic: form.topic });
      setIdeas(data?.ideas ?? []);
    } catch (e) {
      toast.error("AI failed to generate ideas");
    } finally {
      setIdeaBusy(false);
    }
  };

  const submit = async () => {
    if (!form.title.trim() || !form.topic.trim() || !form.description.trim()) {
      toast.error("Title, topic and description are required");
      return;
    }
    if (roles.length < 2) {
      toast.error("Add at least 2 roles");
      return;
    }
    setSubmitting(true);
    try {
      await proposeProject({
        title: form.title,
        topic: form.topic,
        description: form.description,
        country_focus: form.country_focus,
        roles,
        max_team_size: form.max_team_size,
      });
      toast.success("Project submitted for admin review");
      onCreated();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to submit";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Propose a global project</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Project title</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Low-carbon steel for emerging markets" maxLength={120} />
        </div>
        <div>
          <Label>Country focus (optional)</Label>
          <Input value={form.country_focus} onChange={(e) => setForm({ ...form, country_focus: e.target.value })} placeholder="e.g. Global, Uzbekistan, EU" maxLength={80} />
        </div>
      </div>

      <div>
        <Label>Topic</Label>
        <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Sustainable steel production" maxLength={120} />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What problem will the team explore? What's the deliverable?" rows={4} maxLength={2000} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={suggestTeam} disabled={aiBusy}>
          {aiBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          AI: Suggest team
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={generateIdeas} disabled={ideaBusy}>
          {ideaBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          AI: Generate ideas
        </Button>
      </div>

      {ideas.length > 0 && (
        <div className="space-y-2 bg-secondary/30 rounded-xl p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase">AI ideas</p>
          {ideas.map((idea, i) => (
            <button
              key={i}
              type="button"
              className="block w-full text-left p-3 rounded-lg border border-border hover:border-primary transition"
              onClick={() => setForm({ ...form, title: idea.title, description: idea.summary })}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{idea.title}</p>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">{idea.difficulty}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{idea.summary}</p>
            </button>
          ))}
        </div>
      )}

      <div>
        <Label>Team roles ({roles.length})</Label>
        <div className="flex gap-2">
          <Input
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            placeholder="e.g. Materials engineer"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRole();
              }
            }}
            maxLength={60}
          />
          <Button type="button" size="icon" variant="secondary" onClick={() => addRole()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {roles.map((r) => (
            <span key={r} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
              {r}
              <button type="button" onClick={() => setRoles(roles.filter((x) => x !== r))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <Label>Max team size</Label>
        <Input
          type="number"
          min={2}
          max={10}
          value={form.max_team_size}
          onChange={(e) => setForm({ ...form, max_team_size: parseInt(e.target.value || "5", 10) })}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={submit} disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Submit for review
        </Button>
      </div>
    </div>
  );
};
