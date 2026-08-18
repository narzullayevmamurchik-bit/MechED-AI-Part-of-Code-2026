import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2, Edit2, Save, X, ExternalLink, Globe, Github, Linkedin, Briefcase, Sparkles, Trophy, Award, Share2, Copy, Check } from "lucide-react";
import { fetchUserSkills, fetchPortfolio, evaluateSkills, type UserSkill, type PortfolioProject } from "@/hooks/useCareers";
import { useGamification } from "@/hooks/useGamification";
import { toast } from "sonner";

interface ProfileFull {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  country: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  open_to_work: boolean;
  portfolio_public: boolean;
  manual_skills: string[];
  portfolio_slug: string | null;
}

const Portfolio = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { stats, badges } = useGamification();

  const targetId = !userId || userId === "me" ? authUser?.id ?? "" : userId;
  const isOwner = targetId === authUser?.id;

  const [profile, setProfile] = useState<ProfileFull | null>(null);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<Partial<ProfileFull>>({});

  const [newProject, setNewProject] = useState<Partial<PortfolioProject>>({});
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = profile?.portfolio_slug
    ? `${window.location.origin}${window.location.pathname}#/p/${profile.portfolio_slug}`
    : null;

  const copyShareLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Share link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const load = async () => {
    if (!targetId) return;
    setLoading(true);
    const [p, sk, pr] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", targetId).maybeSingle(),
      fetchUserSkills(targetId),
      fetchPortfolio(targetId),
    ]);
    setProfile((p.data as unknown as ProfileFull) ?? null);
    setSkills(sk);
    setProjects(pr);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [targetId]);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const res = await evaluateSkills();
      if (res) {
        toast.success(`Evaluated ${res.skills.length} skills`);
        await load();
      } else {
        toast.error("AI evaluation failed");
      }
    } finally {
      setEvaluating(false);
    }
  };

  const saveProfile = async () => {
    if (!authUser) return;
    const { error } = await supabase.from("profiles").update(profileDraft as any).eq("user_id", authUser.id);
    if (error) {
      toast.error("Failed to save profile");
      return;
    }
    toast.success("Profile updated");
    setEditingProfile(false);
    await load();
  };

  const addProject = async () => {
    if (!authUser || !newProject.title?.trim()) return;
    const { error } = await supabase.from("portfolio_projects" as any).insert({
      user_id: authUser.id,
      title: newProject.title,
      description: newProject.description ?? "",
      role: newProject.role ?? null,
      outcomes: newProject.outcomes ?? null,
      tags: newProject.tags ?? [],
      link_url: newProject.link_url ?? null,
    });
    if (error) {
      toast.error("Failed to add project");
      return;
    }
    setNewProject({});
    setShowProjectForm(false);
    await load();
  };

  const deleteProject = async (id: string) => {
    await supabase.from("portfolio_projects" as any).delete().eq("id", id);
    await load();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background"><Sidebar />
        <main className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-background"><Sidebar />
        <main className="flex-1 p-6">
          <p className="text-muted-foreground">Profile not found or not public.</p>
        </main>
      </div>
    );
  }

  const initials = (profile.display_name ?? "U").charAt(0).toUpperCase();

  const profStyle = (p: string) => p === "advanced" ? "bg-accent text-accent-foreground" : p === "intermediate" ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground";

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl mx-auto space-y-6">
          {/* HERO */}
          <Card className="p-6">
            <div className="flex items-start gap-5 flex-wrap">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-[260px]">
                {editingProfile ? (
                  <div className="space-y-2">
                    <Input placeholder="Headline (e.g. Metallurgy student & welding intern)" value={profileDraft.headline ?? profile.headline ?? ""} onChange={(e) => setProfileDraft((p) => ({ ...p, headline: e.target.value }))} />
                    <textarea className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm" rows={3} placeholder="Bio" value={profileDraft.bio ?? profile.bio ?? ""} onChange={(e) => setProfileDraft((p) => ({ ...p, bio: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Country" value={profileDraft.country ?? profile.country ?? ""} onChange={(e) => setProfileDraft((p) => ({ ...p, country: e.target.value }))} />
                      <Input placeholder="Website URL" value={profileDraft.website_url ?? profile.website_url ?? ""} onChange={(e) => setProfileDraft((p) => ({ ...p, website_url: e.target.value }))} />
                      <Input placeholder="LinkedIn URL" value={profileDraft.linkedin_url ?? profile.linkedin_url ?? ""} onChange={(e) => setProfileDraft((p) => ({ ...p, linkedin_url: e.target.value }))} />
                      <Input placeholder="GitHub URL" value={profileDraft.github_url ?? profile.github_url ?? ""} onChange={(e) => setProfileDraft((p) => ({ ...p, github_url: e.target.value }))} />
                    </div>
                    <div className="flex gap-3 text-sm">
                      <label className="flex items-center gap-1"><input type="checkbox" checked={profileDraft.open_to_work ?? profile.open_to_work} onChange={(e) => setProfileDraft((p) => ({ ...p, open_to_work: e.target.checked }))} /> Open to work</label>
                      <label className="flex items-center gap-1"><input type="checkbox" checked={profileDraft.portfolio_public ?? profile.portfolio_public} onChange={(e) => setProfileDraft((p) => ({ ...p, portfolio_public: e.target.checked }))} /> Public portfolio</label>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveProfile}><Save className="w-3.5 h-3.5" /> Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingProfile(false); setProfileDraft({}); }}><X className="w-3.5 h-3.5" /> Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h1 className="text-2xl font-bold text-foreground">{profile.display_name}</h1>
                        {profile.headline && <p className="text-sm text-muted-foreground mt-1">{profile.headline}</p>}
                      </div>
                      {profile.open_to_work && <Badge className="bg-green-500 text-white">Open to work</Badge>}
                    </div>
                    {profile.bio && <p className="text-sm text-foreground/90 mt-3">{profile.bio}</p>}
                    <div className="flex gap-3 mt-4 text-sm flex-wrap">
                      {profile.country && <span className="text-muted-foreground">{profile.country}</span>}
                      {profile.website_url && <a className="flex items-center gap-1 text-accent hover:underline" href={profile.website_url} target="_blank" rel="noopener noreferrer"><Globe className="w-3.5 h-3.5" /> Website</a>}
                      {profile.linkedin_url && <a className="flex items-center gap-1 text-accent hover:underline" href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"><Linkedin className="w-3.5 h-3.5" /> LinkedIn</a>}
                      {profile.github_url && <a className="flex items-center gap-1 text-accent hover:underline" href={profile.github_url} target="_blank" rel="noopener noreferrer"><Github className="w-3.5 h-3.5" /> GitHub</a>}
                    </div>
                    {isOwner && (
                      <div className="flex gap-2 mt-4 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => { setEditingProfile(true); setProfileDraft(profile); }}><Edit2 className="w-3.5 h-3.5" /> Edit profile</Button>
                        {profile.portfolio_public && shareUrl && (
                          <Button variant="outline" size="sm" onClick={copyShareLink}>
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                            {copied ? "Copied!" : "Copy share link"}
                          </Button>
                        )}
                        {profile.portfolio_public && profile.portfolio_slug && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`#/p/${profile.portfolio_slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5" /> View public page
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              {isOwner && stats && (
                <div className="flex flex-col gap-2 text-right">
                  <div className="flex items-center gap-2 text-sm"><Trophy className="w-4 h-4 text-accent" /> Lvl {stats.level} · {stats.total_xp} XP</div>
                  <div className="text-xs text-muted-foreground">{badges.length} badges · {stats.current_streak}🔥 streak</div>
                </div>
              )}
            </div>
          </Card>

          {/* SKILLS */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Award className="w-5 h-5" /> Skills</h2>
              {isOwner && (
                <Button size="sm" variant="outline" onClick={handleEvaluate} disabled={evaluating}>
                  <Sparkles className="w-3.5 h-3.5" /> {evaluating ? "Evaluating..." : "AI evaluate skills"}
                </Button>
              )}
            </div>
            {skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">{isOwner ? "Run AI evaluation to derive your skills from your activity." : "No skills listed."}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skills.map((s) => (
                  <div key={s.id} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground capitalize">{s.skill.replace(/_/g, " ")}</span>
                      <Badge className={`text-xs ${profStyle(s.proficiency)}`}>{s.proficiency}</Badge>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${Math.min(100, s.score)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* PORTFOLIO PROJECTS */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Briefcase className="w-5 h-5" /> Portfolio Projects</h2>
              {isOwner && !showProjectForm && (
                <Button size="sm" onClick={() => setShowProjectForm(true)}><Plus className="w-3.5 h-3.5" /> Add project</Button>
              )}
            </div>

            {showProjectForm && (
              <div className="p-4 rounded-lg border border-border bg-secondary/30 space-y-2 mb-4">
                <Input placeholder="Project title" value={newProject.title ?? ""} onChange={(e) => setNewProject((p) => ({ ...p, title: e.target.value }))} />
                <textarea className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm" rows={3} placeholder="Description" value={newProject.description ?? ""} onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Your role" value={newProject.role ?? ""} onChange={(e) => setNewProject((p) => ({ ...p, role: e.target.value }))} />
                  <Input placeholder="Outcome / impact" value={newProject.outcomes ?? ""} onChange={(e) => setNewProject((p) => ({ ...p, outcomes: e.target.value }))} />
                </div>
                <Input placeholder="External link (optional)" value={newProject.link_url ?? ""} onChange={(e) => setNewProject((p) => ({ ...p, link_url: e.target.value }))} />
                <Input placeholder="Tags (comma separated)" onChange={(e) => setNewProject((p) => ({ ...p, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) }))} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addProject}><Plus className="w-3.5 h-3.5" /> Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowProjectForm(false); setNewProject({}); }}><X className="w-3.5 h-3.5" /> Cancel</Button>
                </div>
              </div>
            )}

            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">{isOwner ? "Add your engineering projects, internships, and contributions." : "No projects yet."}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {projects.map((pr) => (
                  <div key={pr.id} className="p-4 rounded-lg border border-border group relative">
                    {isOwner && (
                      <button onClick={() => deleteProject(pr.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <h3 className="font-semibold text-foreground">{pr.title}</h3>
                    {pr.role && <p className="text-xs text-muted-foreground">{pr.role}</p>}
                    <p className="text-sm text-foreground/90 mt-2">{pr.description}</p>
                    {pr.outcomes && <p className="text-xs text-accent mt-2">→ {pr.outcomes}</p>}
                    {pr.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {pr.tags.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                      </div>
                    )}
                    {pr.link_url && (
                      <a className="flex items-center gap-1 text-xs text-accent hover:underline mt-2" href={pr.link_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3" /> View project
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* BADGES */}
          {isOwner && badges.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4"><Trophy className="w-5 h-5" /> Achievements</h2>
              <div className="flex gap-2 flex-wrap">
                {badges.map((b) => (
                  <div key={b.id} className="px-3 py-1.5 rounded-full bg-secondary text-sm flex items-center gap-1">
                    <span>{b.badge.icon}</span> {b.badge.name}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Portfolio;
