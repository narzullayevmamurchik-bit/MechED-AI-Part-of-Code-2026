import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { researchArticles, researchLinks, usefulWebsites, virtualLabs, innovationIdeas } from "@/data/research";
import { useLanguage } from "@/i18n/LanguageContext";
import { ExternalLink, FileText, Globe, Calendar, Tag, FlaskConical, Lightbulb, Search, BookOpen, Monitor, X, Play, Loader2, Sparkles } from "lucide-react";
import { PublicationCenter } from "@/components/research/PublicationCenter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type LabFilter = "All" | "Physics" | "CAD" | "Simulation" | "Computation";

const ResearchHub = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [labFilter, setLabFilter] = useState<LabFilter>("All");
  const [openLabId, setOpenLabId] = useState<string | null>(null);
  const [labLoading, setLabLoading] = useState<string | null>(null);

  const filteredArticles = researchArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.authors.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLabs = virtualLabs.filter(
    (lab) => labFilter === "All" || lab.filterCategory === labFilter
  );

  const difficultyColors = {
    beginner: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    intermediate: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    advanced: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  };

  const labFilterKeys: { key: LabFilter; translationKey: string }[] = [
    { key: "All", translationKey: "research_filter_all" },
    { key: "Physics", translationKey: "research_filter_physics" },
    { key: "CAD", translationKey: "research_filter_cad" },
    { key: "Simulation", translationKey: "research_filter_simulation" },
    { key: "Computation", translationKey: "research_filter_computation" },
  ];

  const handleOpenLab = (lab: typeof virtualLabs[0]) => {
    if (lab.embeddable && lab.embedUrl) {
      setLabLoading(lab.id);
      setOpenLabId(lab.id);
    } else {
      setLabLoading(lab.id);
      setTimeout(() => {
        window.open(lab.url, "_blank", "noopener,noreferrer");
        setLabLoading(null);
      }, 400);
    }
  };

  const openLab = virtualLabs.find((l) => l.id === openLabId);

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">{t("research_title")}</h1>
              <p className="text-sm text-muted-foreground">{t("research_subtitle")}</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("research_search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </header>

        <div className="p-8">
          <Tabs defaultValue="publications" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2 sm:grid-cols-5 h-auto gap-1 p-1">
              <TabsTrigger value="publications" className="gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5" />Publication Center
              </TabsTrigger>
              <TabsTrigger value="journals" className="gap-1.5 text-xs">
                <BookOpen className="w-3.5 h-3.5" />{t("research_journals")}
              </TabsTrigger>
              <TabsTrigger value="websites" className="gap-1.5 text-xs">
                <Globe className="w-3.5 h-3.5" />{t("research_websites")}
              </TabsTrigger>
              <TabsTrigger value="virtual-labs" className="gap-1.5 text-xs">
                <Monitor className="w-3.5 h-3.5" />{t("research_virtual_labs")}
              </TabsTrigger>
              <TabsTrigger value="innovation" className="gap-1.5 text-xs">
                <Lightbulb className="w-3.5 h-3.5" />{t("research_innovation")}
              </TabsTrigger>
            </TabsList>

            {/* Publication Center (replaces Articles) */}
            <TabsContent value="publications">
              <PublicationCenter />
            </TabsContent>

            {/* Journals & Databases */}
            <TabsContent value="journals">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {researchLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-card border border-border rounded-xl p-5 hover:border-accent/30 hover:shadow-lg transition-all group block"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {link.category}
                        </span>
                        <h3 className="font-semibold text-card-foreground text-sm mt-0.5 group-hover:text-accent transition-colors">
                          {link.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1.5">{link.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-accent">
                      {t("resources_visit")} <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>
                ))}
              </div>
            </TabsContent>

            {/* Useful Websites */}
            <TabsContent value="websites">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">{t("research_websites_desc")}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {usefulWebsites.map((site) => (
                  <a
                    key={site.id}
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-lg transition-all group block"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{site.icon}</span>
                      <Badge variant="secondary" className="text-[10px]">{site.category}</Badge>
                    </div>
                    <h3 className="font-semibold text-card-foreground text-sm group-hover:text-primary transition-colors">
                      {site.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{site.description}</p>
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-primary">
                      {t("resources_visit")} <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>
                ))}
              </div>
            </TabsContent>

            {/* Virtual Labs */}
            <TabsContent value="virtual-labs">
              <div className="mb-5">
                <p className="text-sm text-muted-foreground mb-4">{t("research_virtual_labs_desc")}</p>
                <div className="flex flex-wrap gap-2">
                  {labFilterKeys.map(({ key, translationKey }) => (
                    <Button
                      key={key}
                      variant={labFilter === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLabFilter(key)}
                      className="text-xs"
                    >
                      {t(translationKey as any)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Embedded Lab Viewer */}
              {openLab && openLab.embeddable && openLab.embedUrl && (
                <div className="mb-6 rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{openLab.icon}</span>
                      <span className="font-semibold text-sm text-foreground">{openLab.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(openLab.url, "_blank", "noopener,noreferrer")}
                        className="text-xs gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> {t("research_open_external")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => { setOpenLabId(null); setLabLoading(null); }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="relative w-full" style={{ height: "500px" }}>
                    {labLoading === openLab.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    )}
                    <iframe
                      src={openLab.embedUrl}
                      className="w-full h-full border-0"
                      title={openLab.name}
                      onLoad={() => setLabLoading(null)}
                      allow="fullscreen; autoplay"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredLabs.map((lab) => (
                  <div
                    key={lab.id}
                    className="bg-card border border-border rounded-xl overflow-hidden hover:border-accent/40 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer flex flex-col"
                    onClick={() => handleOpenLab(lab)}
                  >
                    <div className="p-5 flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center text-xl group-hover:bg-accent/20 transition-colors">
                          {lab.icon}
                        </div>
                        <div>
                          <Badge variant="outline" className="text-[10px]">{lab.type}</Badge>
                        </div>
                      </div>
                      <h3 className="font-semibold text-card-foreground text-sm group-hover:text-accent transition-colors">
                        {lab.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{lab.description}</p>
                    </div>
                    <div className="px-5 pb-4 pt-1 flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full text-xs gap-1.5"
                        onClick={(e) => { e.stopPropagation(); handleOpenLab(lab); }}
                        disabled={labLoading === lab.id}
                      >
                        {labLoading === lab.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        {lab.embeddable ? t("research_open_inside") : t("research_open_lab")}
                      </Button>
                      {!lab.embeddable && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(lab.url, "_blank", "noopener,noreferrer");
                          }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredLabs.length === 0 && (
                  <p className="col-span-full text-center text-muted-foreground py-12">{t("research_no_results")}</p>
                )}
              </div>
            </TabsContent>

            {/* Innovation Ideas */}
            <TabsContent value="innovation">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">{t("research_innovation_desc")}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {innovationIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Lightbulb className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-card-foreground leading-snug">{idea.title}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${difficultyColors[idea.difficulty]}`}>
                            {t(`research_${idea.difficulty}` as any)}
                          </span>
                        </div>
                        <p className="text-xs text-accent font-medium">{idea.field}</p>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{idea.description}</p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {idea.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ResearchHub;
