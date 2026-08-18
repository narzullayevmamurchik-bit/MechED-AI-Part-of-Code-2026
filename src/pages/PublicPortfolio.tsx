import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchPublicPortfolioBySlug, type PublicPortfolio } from "@/hooks/useCareers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Globe, Github, Linkedin, Briefcase, Trophy, Award, ExternalLink, ArrowRight, Sparkles } from "lucide-react";

const profStyle = (p: string) =>
  p === "advanced" ? "bg-accent text-accent-foreground" :
  p === "intermediate" ? "bg-primary/20 text-primary" :
  "bg-secondary text-secondary-foreground";

const PublicPortfolioPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PublicPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const res = await fetchPublicPortfolioBySlug(slug);
      if (!res) setNotFound(true);
      else setData(res);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md space-y-3">
          <h1 className="text-2xl font-semibold text-foreground">Portfolio not found</h1>
          <p className="text-sm text-muted-foreground">This portfolio may be private or the link is invalid.</p>
          <Button asChild><Link to="/">Go to homepage</Link></Button>
        </div>
      </div>
    );
  }

  const { profile, skills, projects, badges, gamification } = data;
  const initials = (profile.display_name ?? "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Top nav */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="w-4 h-4 text-accent" /> MetalLearn
          </Link>
          <Button size="sm" variant="outline" asChild>
            <Link to="/auth">Sign in <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* HERO */}
        <Card className="p-6">
          <div className="flex items-start gap-5 flex-wrap">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-[260px]">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{profile.display_name}</h1>
                  {profile.headline && <p className="text-sm text-muted-foreground mt-1">{profile.headline}</p>}
                </div>
                {profile.open_to_work && <Badge className="bg-emerald-500 text-white">Open to work</Badge>}
              </div>
              {profile.bio && <p className="text-sm text-foreground/90 mt-3">{profile.bio}</p>}
              <div className="flex gap-3 mt-4 text-sm flex-wrap">
                {profile.country && <span className="text-muted-foreground">{profile.country}</span>}
                {profile.website_url && <a className="flex items-center gap-1 text-accent hover:underline" href={profile.website_url} target="_blank" rel="noopener noreferrer"><Globe className="w-3.5 h-3.5" /> Website</a>}
                {profile.linkedin_url && <a className="flex items-center gap-1 text-accent hover:underline" href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"><Linkedin className="w-3.5 h-3.5" /> LinkedIn</a>}
                {profile.github_url && <a className="flex items-center gap-1 text-accent hover:underline" href={profile.github_url} target="_blank" rel="noopener noreferrer"><Github className="w-3.5 h-3.5" /> GitHub</a>}
              </div>
            </div>
            {gamification && (
              <div className="flex flex-col gap-1 text-right">
                <div className="flex items-center gap-2 text-sm justify-end"><Trophy className="w-4 h-4 text-accent" /> Lvl {gamification.level} · {gamification.total_xp} XP</div>
                <div className="text-xs text-muted-foreground">{badges.length} badges · {gamification.current_streak}🔥 streak</div>
              </div>
            )}
          </div>
        </Card>

        {/* SKILLS */}
        {skills.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4"><Award className="w-5 h-5" /> Skills</h2>
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
          </Card>
        )}

        {/* PROJECTS */}
        {projects.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4"><Briefcase className="w-5 h-5" /> Portfolio Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map((pr) => (
                <div key={pr.id} className="p-4 rounded-lg border border-border">
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
          </Card>
        )}

        {/* BADGES */}
        {badges.length > 0 && (
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

        <div className="text-center text-xs text-muted-foreground py-4">
          Built on MetalLearn · <Link to="/" className="text-accent hover:underline">Create your portfolio</Link>
        </div>
      </main>
    </div>
  );
};

export default PublicPortfolioPage;
