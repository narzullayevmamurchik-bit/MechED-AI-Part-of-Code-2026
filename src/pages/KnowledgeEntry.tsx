import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useKbEntry } from "@/hooks/useKnowledgeBase";
import {
  ArrowLeft,
  Heart,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const KnowledgeEntry = () => {
  const { answerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { entry, comments, liked, saved, loading, toggleLike, toggleSave, addComment } =
    useKbEntry(answerId);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          Loading…
        </main>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex min-h-screen bg-background font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          Entry not found.
        </main>
      </div>
    );
  }

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    await addComment(comment);
    setComment("");
    setSending(false);
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/knowledge")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to library
          </Button>
        </header>

        <div className="p-6 md:p-8 max-w-3xl space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {entry.kb_tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {entry.kb_title ?? entry.question_title}
              </h1>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {entry.question_body}
              </p>

              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <button
                  onClick={() => navigate(`/experts/${entry.expert_id}`)}
                  className="flex items-center gap-3 hover:opacity-80"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl overflow-hidden">
                    {entry.expert_photo_url ? (
                      <img
                        src={entry.expert_photo_url}
                        alt={entry.expert_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      entry.expert_avatar
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{entry.expert_name}</p>
                    <p className="text-xs text-muted-foreground">{entry.expert_title}</p>
                  </div>
                </button>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(entry.kb_published_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Answer */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-foreground">Expert Answer</h2>
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {entry.body}
              </p>

              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <Button
                  size="sm"
                  variant={liked ? "default" : "outline"}
                  onClick={toggleLike}
                  disabled={!user}
                  className="gap-1.5"
                >
                  <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
                  {entry.kb_like_count}
                </Button>
                <Button
                  size="sm"
                  variant={saved ? "default" : "outline"}
                  onClick={toggleSave}
                  disabled={!user}
                  className="gap-1.5"
                >
                  {saved ? (
                    <BookmarkCheck className="w-3.5 h-3.5" />
                  ) : (
                    <Bookmark className="w-3.5 h-3.5" />
                  )}
                  {saved ? "Saved" : "Save"}
                </Button>
                <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> {entry.kb_comment_count} comments
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Discussion</h3>

              <div className="space-y-3">
                {comments.length === 0 && (
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                )}
                {comments.map((c: any) => (
                  <div key={c.id} className="border border-border rounded-lg p-3">
                    <p className="text-sm text-foreground whitespace-pre-line">{c.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {user && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Add a comment…"
                  />
                  <Button size="sm" onClick={handleComment} disabled={sending || !comment.trim()}>
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default KnowledgeEntry;
