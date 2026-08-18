import { useState, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useExpertsDb, useSpecializations, DbExpert } from "@/hooks/useExpertsDb";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Search, Phone, Send, ChevronRight, Shield, Award, Star, MessageCircleQuestion, BookmarkCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const availabilityColor = (a: DbExpert["availability"]) => ({
  available: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  busy: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  offline: "bg-muted text-muted-foreground border-border",
}[a]);

const Experts = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { experts, loading } = useExpertsDb();
  const { specializations } = useSpecializations();
  const [search, setSearch] = useState("");
  const [activeSlug, setActiveSlug] = useState<string>("all");
  const [savedView, setSavedView] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    supabase.from("expert_followers" as any).select("expert_id").eq("student_id", user.id)
      .then(({ data }) => setSavedIds(new Set(((data as any[]) ?? []).map((r) => r.expert_id))));
  }, [user]);

  const filtered = useMemo(() => {
    return experts.filter((e) => {
      const matchesSearch = !search
        || e.name.toLowerCase().includes(search.toLowerCase())
        || e.position.toLowerCase().includes(search.toLowerCase())
        || e.specializations.some((s) => s.name.toLowerCase().includes(search.toLowerCase()));
      const matchesCat = activeSlug === "all" || e.specializations.some((s) => s.slug === activeSlug);
      const matchesSaved = !savedView || savedIds.has(e.id);
      return matchesSearch && matchesCat && matchesSaved;
    });
  }, [experts, search, activeSlug, savedView, savedIds]);

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
          <h1 className="text-xl font-bold text-foreground">{t("experts_title")}</h1>
          <p className="text-sm text-muted-foreground">{t("experts_subtitle")}</p>
        </header>

        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-md flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("experts_search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={savedView ? "default" : "outline"}
              size="sm"
              onClick={() => setSavedView((v) => !v)}
              className="gap-1.5"
            >
              <BookmarkCheck className="w-4 h-4" />
              Saved ({savedIds.size})
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate("/my-questions")} className="gap-1.5">
              <MessageCircleQuestion className="w-4 h-4" />
              My Questions
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={activeSlug === "all" ? "default" : "outline"} onClick={() => setActiveSlug("all")}>
              {t("experts_filter_all")}
            </Button>
            {specializations.map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant={activeSlug === s.slug ? "default" : "outline"}
                onClick={() => setActiveSlug(s.slug)}
              >
                {s.icon} {s.name}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16 text-muted-foreground">Loading experts…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">{t("experts_no_results")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} t={t} onClick={() => navigate(`/experts/${expert.id}`)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

function ExpertCard({ expert, t, onClick }: { expert: DbExpert; t: (k: any) => string; onClick: () => void }) {
  return (
    <div
      className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4 mb-3">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl shrink-0 overflow-hidden">
          {expert.photo_url ? <img src={expert.photo_url} alt={expert.name} className="w-full h-full object-cover" /> : expert.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-card-foreground text-sm leading-tight">{expert.name}</h3>
            {expert.is_lead && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 gap-0.5">
                <Award className="w-2.5 h-2.5" />{t("experts_lead")}
              </Badge>
            )}
          </div>
          <p className="text-xs text-primary font-medium mt-0.5">{expert.title}</p>
          <p className="text-xs text-muted-foreground truncate">{expert.position}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {expert.specializations.slice(0, 3).map((s) => (
          <Badge key={s.id} variant="secondary" className="text-[10px] px-1.5 py-0">
            {s.icon} {s.name}
          </Badge>
        ))}
        {expert.specializations.length > 3 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{expert.specializations.length - 3}</Badge>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3 text-[10px]">
        <span className={`px-1.5 py-0.5 rounded-full border ${availabilityColor(expert.availability)}`}>
          ● {expert.availability}
        </span>
        {expert.is_verified && (
          <span className="flex items-center gap-0.5 text-primary"><Shield className="w-3 h-3" /> verified</span>
        )}
        {expert.rating_count > 0 && (
          <span className="flex items-center gap-0.5 text-amber-500">
            <Star className="w-3 h-3 fill-amber-500" /> {expert.rating_avg.toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          {expert.telegram && (
            <a href={`https://t.me/${expert.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
               className="text-primary hover:text-primary/80" onClick={(e) => e.stopPropagation()}>
              <Send className="w-3 h-3" />
            </a>
          )}
          {expert.phone && (
            <a href={`tel:${expert.phone.replace(/\s/g, "")}`} className="text-primary hover:text-primary/80" onClick={(e) => e.stopPropagation()}>
              <Phone className="w-3 h-3" />
            </a>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
          {t("experts_view_profile")} <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}

export default Experts;
