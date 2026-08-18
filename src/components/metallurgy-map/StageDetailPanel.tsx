import { useNavigate } from "react-router-dom";
import { X, ArrowRight, Sparkles, BookOpen, FileText, Users, Beaker, ArrowRightLeft, Factory, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courses } from "@/data/courses";
import { resources } from "@/data/resources";
import { experts } from "@/data/experts";
import type { ProcessStage } from "@/data/metallurgyProcess";

interface Props {
  stage: ProcessStage;
  onClose: () => void;
}

export function StageDetailPanel({ stage, onClose }: Props) {
  const navigate = useNavigate();

  const relCourses = courses.filter((c) => stage.relatedCourses.includes(c.id));
  const relResources = resources.filter((r) => stage.relatedResources.includes(r.id));
  const relExperts = experts.filter((e) => stage.relatedExperts.includes(e.id));

  const handleAskAI = () => {
    // Dispatch custom event to open AI Mentor with prefilled prompt
    window.dispatchEvent(
      new CustomEvent("open-ai-mentor", {
        detail: { prompt: `Explain the ${stage.title} stage in steel production. What are the key processes, input materials, and output products?` },
      })
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-primary/5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{stage.icon}</span>
          <div>
            <h2 className="text-lg font-bold text-foreground">{stage.title}</h2>
            <p className="text-xs text-muted-foreground">Click sections below to explore</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleAskAI}>
            <Sparkles className="w-3.5 h-3.5" />
            Ask AI about this
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Description */}
        <p className="text-sm text-foreground/90 leading-relaxed">{stage.description}</p>

        {/* Learn from Industry */}
        <LearnFromIndustry stageTitle={stage.title} />

        {/* Process / Inputs / Outputs grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoList icon={<Beaker className="w-4 h-4 text-primary" />} title="Key Processes" items={stage.processes} />
          <InfoList icon={<ArrowRight className="w-4 h-4 text-primary" />} title="Inputs" items={stage.inputs} />
          <InfoList icon={<ArrowRightLeft className="w-4 h-4 text-primary" />} title="Outputs" items={stage.outputs} />
        </div>

        {/* Related content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Courses */}
          {relCourses.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5" /> Courses
              </div>
              {relCourses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/course/${c.id}`)}
                  className="flex items-center gap-2 w-full p-2.5 rounded-xl border border-border bg-background hover:bg-accent hover:border-primary/30 transition-all text-left group"
                >
                  <span className="text-lg">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{c.title}</p>
                    <p className="text-[10px] text-muted-foreground">{c.lessons} lessons</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Resources */}
          {relResources.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" /> Resources
              </div>
              {relResources.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full p-2.5 rounded-xl border border-border bg-background hover:bg-accent hover:border-primary/30 transition-all text-left group"
                >
                  <span className="text-lg">{r.type === "pdf" ? "📄" : r.type === "video" ? "🎬" : "🔗"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{r.type}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                </a>
              ))}
            </div>
          )}

          {/* Experts */}
          {relExperts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" /> Experts
              </div>
              {relExperts.map((e) => (
                <button
                  key={e.id}
                  onClick={() => navigate(`/experts/${e.id}`)}
                  className="flex items-center gap-2 w-full p-2.5 rounded-xl border border-border bg-background hover:bg-accent hover:border-primary/30 transition-all text-left group"
                >
                  <span className="text-lg">{e.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{e.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{e.title} · {e.position}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoList({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        {icon} {title}
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
            <span className="text-primary mt-0.5">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LearnFromIndustry({ stageTitle }: { stageTitle: string }) {
  const TENOVA_URL = "https://tenova.com/technologies/iron-steel";
  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl"
      />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md shadow-primary/20">
            <Factory className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" /> Learn from Industry
              </span>
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              Real Industry Example — {stageTitle}
            </h4>
            <p className="text-xs text-muted-foreground">
              See how Tenova's iron &amp; steel technologies apply this stage in real plants worldwide.
            </p>
            <p className="text-[10px] italic text-muted-foreground/80">
              Based on real industrial technology (Tenova)
            </p>
          </div>
        </div>
        <a
          href={TENOVA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30"
        >
          <Factory className="h-3.5 w-3.5" />
          Explore Technology
          <ExternalLink className="h-3 w-3 opacity-70 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  );
}
