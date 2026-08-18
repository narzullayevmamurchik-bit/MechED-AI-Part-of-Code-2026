import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStudentChats } from "@/hooks/useExpertChat";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Loader2 } from "lucide-react";

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const MyChats = () => {
  const { chats, loading } = useStudentChats();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> My Chats
          </h1>
          <p className="text-sm text-muted-foreground">
            Direct conversations with experts
          </p>
        </header>

        <div className="p-6 md:p-8 max-w-3xl space-y-2">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : chats.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No chats yet. Visit an expert's profile and tap "Message" to start a
                conversation.
              </CardContent>
            </Card>
          ) : (
            chats.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/experts/chat/${c.expert_id}`)}
                className="w-full text-left"
              >
                <Card className="hover:bg-secondary/30 transition-colors">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl overflow-hidden shrink-0">
                      {c.expert?.photo_url ? (
                        <img src={c.expert.photo_url} alt={c.expert?.name} className="w-full h-full object-cover" />
                      ) : (
                        c.expert?.avatar ?? "👤"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground truncate">
                          {c.expert?.name ?? "Expert"}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatWhen(c.last_message_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.last_message_preview || "No messages yet"}
                      </p>
                    </div>
                    {c.student_unread > 0 && (
                      <Badge variant="default" className="shrink-0">
                        {c.student_unread}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </button>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default MyChats;
