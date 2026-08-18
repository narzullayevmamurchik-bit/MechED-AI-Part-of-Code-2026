import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Library, Heart, Bookmark, MessageSquare, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SORTS = [
  { value: "recent", label: "Newest" },
  { value: "liked", label: "Most liked" },
  { value: "saved", label: "Most saved" },
] as const;

const KnowledgeBase = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "liked" | "saved">("recent");
  const [tag, setTag] = useState<string | null>(null);

  const { entries, loading } = useKnowledgeBase({
    q,
    tags: tag ? [tag] : [],
    sort,
  });

  const allTags = Array.from(new Set(entries.flatMap((e) => e.kb_tags ?? []))).slice(0, 20);

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Library className="w-5 h-5 text-primary" /> Engineering Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground">
            Public expert answers, searchable and savable
          </p>
        </header>

        <div className="p-6 md:p-8 max-w-6xl space-y-5">
          {/* Search + sort */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search questions, answers, or tags…"
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5">
              {SORTS.map((s) => (
                <Button
                  key={s.value}
                  size="sm"
                  variant={sort === s.value ? "default" : "outline"}
                  onClick={() => setSort(s.value)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant={tag === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setTag(null)}
              >
                All
              </Badge>
              {allTags.map((t) => (
                <Badge
                  key={t}
                  variant={tag === t ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setTag(tag === t ? null : t)}
                >
                  {t}
                </Badge>
              ))}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading entries…
            </div>
          ) : entries.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-sm text-muted-foreground">
                No published knowledge yet. Public expert answers appear here
                automatically.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entries.map((e) => (
                <button
                  key={e.id}
                  onClick={() => navigate(`/knowledge/${e.id}`)}
                  className="text-left"
                >
                  <Card className="h-full hover:border-primary/40 transition-colors">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground line-clamp-2">
                          {e.kb_title ?? e.question_title}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{e.body}</p>

                      <div className="flex flex-wrap gap-1">
                        {e.kb_tags.slice(0, 4).map((t) => (
                          <Badge key={t} variant="outline" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 pt-2 border-t border-border">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm overflow-hidden">
                          {e.expert_photo_url ? (
                            <img
                              src={e.expert_photo_url}
                              alt={e.expert_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            e.expert_avatar
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {e.expert_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {e.expert_title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Heart className="w-3 h-3" /> {e.kb_like_count}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Bookmark className="w-3 h-3" /> {e.kb_save_count}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="w-3 h-3" /> {e.kb_comment_count}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default KnowledgeBase;
