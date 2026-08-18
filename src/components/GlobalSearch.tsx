import { useState, useMemo } from "react";
import { Search, X, BookOpen, Library, FlaskConical } from "lucide-react";
import { courses } from "@/data/courses";
import { resources } from "@/data/resources";
import { researchArticles } from "@/data/research";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

interface SearchResult {
  type: "course" | "resource" | "research";
  id: string;
  title: string;
  subtitle: string;
  url?: string;
}

export const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const results = useMemo<SearchResult[]>(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();

    const courseResults: SearchResult[] = courses
      .filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
      .map((c) => ({ type: "course", id: c.id, title: c.title, subtitle: c.description }));

    const resourceResults: SearchResult[] = resources
      .filter((r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.categories.some((c) => c.toLowerCase().includes(q)))
      .map((r) => ({ type: "resource", id: r.id, title: r.title, subtitle: `${r.categories[0]} · ${r.type}` }));

    const researchResults: SearchResult[] = researchArticles
      .filter((a) => a.title.toLowerCase().includes(q) || a.abstract.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)))
      .map((a) => ({ type: "research", id: a.id, title: a.title, subtitle: a.journal, url: a.url }));

    return [...courseResults, ...resourceResults, ...researchResults].slice(0, 8);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === "course") {
      navigate(`/course/${result.id}`);
    } else if (result.type === "resource") {
      navigate("/resources");
    } else if (result.type === "research") {
      navigate("/research");
    }
    setQuery("");
    setOpen(false);
  };

  const typeIcon = {
    course: BookOpen,
    resource: Library,
    research: FlaskConical,
  };

  const typeLabel = {
    course: t("search_course"),
    resource: t("search_resource"),
    research: t("search_research"),
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("search_placeholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(e.target.value.length >= 2);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="pl-9 pr-8 py-2 rounded-lg bg-secondary border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent w-72"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 w-96 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-border">
            <p className="text-xs text-muted-foreground px-2">{results.length} {results.length > 1 ? t("search_results") : t("search_result")}</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {results.map((result) => {
              const Icon = typeIcon[result.type];
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                >
                  <Icon className="w-4 h-4 text-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded shrink-0">
                    {typeLabel[result.type]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 w-96 bg-card border border-border rounded-xl shadow-xl z-50 p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("search_no_results")} "{query}"</p>
        </div>
      )}
    </div>
  );
};
