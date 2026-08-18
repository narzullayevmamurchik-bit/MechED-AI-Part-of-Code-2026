import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useExpertById, useFollowExpert } from "@/hooks/useExpertsDb";
import { usePublicQuestions } from "@/hooks/useExpertQA";
import { useLanguage } from "@/i18n/LanguageContext";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Send, Shield, Award, Building2, Briefcase, Star, Users, Clock, MessageCircle, Bookmark, BookmarkCheck, MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AskExpertDialog } from "@/components/experts/AskExpertDialog";
import { useAuth } from "@/hooks/useAuth";

const availabilityLabel = (a: string) =>
  a === "available" ? "Available now" : a === "busy" ? "Busy" : "Offline";

const availabilityColor = (a: string) => ({
  available: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  busy: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  offline: "bg-muted text-muted-foreground border-border",
}[a as "available" | "busy" | "offline"] || "");

const ExpertProfile = () => {
  const { expertId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { expert, loading } = useExpertById(expertId);
  const { isFollowing, toggle } = useFollowExpert(expert?.id);
  const [askOpen, setAskOpen] = useState(false);
  const { questions: publicQs } = usePublicQuestions(expert?.id);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">Loading…</main>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="flex min-h-screen bg-background font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">{t("experts_not_found")}</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/experts")}>
              <ArrowLeft className="w-4 h-4 mr-2" />{t("back")}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/experts")} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />{t("experts_back_list")}
          </Button>
          <h1 className="text-xl font-bold text-foreground">{expert.name}</h1>
        </header>

        <div className="p-6 md:p-8 max-w-4xl space-y-6">
          {/* Hero */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center text-5xl shrink-0 overflow-hidden">
                  {expert.photo_url ? <img src={expert.photo_url} alt={expert.name} className="w-full h-full object-cover" /> : expert.avatar}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold text-foreground">{expert.name}</h2>
                    {expert.is_lead && (
                      <Badge variant="default" className="gap-1"><Award className="w-3 h-3" />{t("experts_lead")}</Badge>
                    )}
                    {expert.is_verified && (
                      <Badge variant="outline" className="gap-1 text-primary border-primary/30">
                        <Shield className="w-3 h-3" />{t("experts_verified")}
                      </Badge>
                    )}
                    <Badge variant="outline" className={`gap-1 ${availabilityColor(expert.availability)}`}>
                      ● {availabilityLabel(expert.availability)}
                    </Badge>
                  </div>
                  <p className="text-primary font-medium">{expert.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Briefcase className="w-4 h-4" />{expert.position}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="w-4 h-4" />{expert.institution}</div>

                  <div className="flex flex-wrap gap-3 pt-3">
                    <Button onClick={() => setAskOpen(true)} disabled={!user} className="gap-1.5">
                      <MessageCircle className="w-4 h-4" /> Ask a Question
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/experts/chat/${expert.id}`)}
                      disabled={!user}
                      className="gap-1.5"
                    >
                      <MessageSquareText className="w-4 h-4" /> Message
                    </Button>
                    <Button variant="outline" onClick={toggle} disabled={!user} className="gap-1.5">
                      {isFollowing ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      {isFollowing ? "Saved" : "Save Expert"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBlock icon={<Star className="w-4 h-4" />} label="Rating" value={expert.rating_count > 0 ? `${expert.rating_avg.toFixed(1)} (${expert.rating_count})` : "—"} />
            <StatBlock icon={<Users className="w-4 h-4" />} label="Students helped" value={String(expert.students_helped)} />
            <StatBlock icon={<MessageCircle className="w-4 h-4" />} label="Response rate" value={`${Math.round(expert.response_rate)}%`} />
            <StatBlock icon={<Clock className="w-4 h-4" />} label="Avg response" value={`${expert.response_time_hours}h`} />
          </div>

          {/* Bio */}
          <Card><CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-2">{t("experts_about")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{expert.bio}</p>
          </CardContent></Card>

          {/* Research */}
          {expert.research_interests && (
            <Card><CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-2">Research interests</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{expert.research_interests}</p>
            </CardContent></Card>
          )}

          {/* Publications */}
          {expert.publications?.length > 0 && (
            <Card><CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-3">Publications</h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                {expert.publications.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </CardContent></Card>
          )}

          {/* Specializations */}
          <Card><CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">Specializations</h3>
            <div className="flex flex-wrap gap-2">
              {expert.specializations.map((s) => (
                <Badge key={s.id} variant="outline" className="gap-1">{s.icon} {s.name}</Badge>
              ))}
              {expert.specializations.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
            </div>
          </CardContent></Card>

          {/* Languages */}
          {expert.languages?.length > 0 && (
            <Card><CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-3">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {expert.languages.map((l) => <Badge key={l} variant="secondary">{l}</Badge>)}
              </div>
            </CardContent></Card>
          )}

          {/* Public Q&A */}
          <Card><CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <MessageSquareText className="w-4 h-4" /> Public Q&amp;A
            </h3>
            {publicQs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No public questions yet. Be the first to ask!</p>
            ) : (
              <div className="space-y-3">
                {publicQs.map((q) => (
                  <div key={q.id} className="border border-border rounded-lg p-3">
                    <p className="text-sm font-medium text-foreground">{q.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{q.body}</p>
                    {q.answers && q.answers.length > 0 && (
                      <div className="mt-2 pl-3 border-l-2 border-primary/40">
                        <p className="text-xs text-foreground line-clamp-3">{q.answers[0].body}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent></Card>

          {/* Contact */}
          <Card><CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">{t("experts_contact")}</h3>
            <div className="space-y-3">
              {expert.telegram && <a href={`https://t.me/${expert.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-primary"><Send className="w-4 h-4" /> Telegram: {expert.telegram}</a>}
              {expert.phone && <a href={`tel:${expert.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-sm text-primary"><Phone className="w-4 h-4" /> {expert.phone}</a>}
              {expert.email && <a href={`mailto:${expert.email}`} className="flex items-center gap-3 text-sm text-primary">✉️ {expert.email}</a>}
              {!expert.telegram && !expert.phone && !expert.email && <p className="text-sm text-muted-foreground">Use "Ask a Question" to contact this expert in-platform.</p>}
            </div>
          </CardContent></Card>
        </div>

        <AskExpertDialog
          open={askOpen}
          onOpenChange={setAskOpen}
          expertId={expert.id}
          expertName={expert.name}
        />
      </main>
    </div>
  );
};

const StatBlock = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-card border border-border rounded-xl p-4">
    <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">{icon} {label}</div>
    <p className="text-lg font-semibold text-foreground">{value}</p>
  </div>
);

export default ExpertProfile;
