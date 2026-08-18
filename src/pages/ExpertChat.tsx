import { useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { useExpertById } from "@/hooks/useExpertsDb";
import { useAuth } from "@/hooks/useAuth";
import { useMyExpertProfile } from "@/hooks/useExpertsDb";
import {
  useOrCreateChat,
  useChatRealtime,
  markChatRead,
  useIsOnline,
} from "@/hooks/useExpertChat";
import { ChatInput } from "@/components/experts/ChatInput";
import { ChatMessageBubble } from "@/components/experts/ChatMessageBubble";

const ExpertChatPage = () => {
  const { expertId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { expert, loading: expLoading } = useExpertById(expertId);
  const { expert: myExpert } = useMyExpertProfile();

  // Determine role: if current user IS the linked expert for this profile → expert. Otherwise student.
  const viewerIsStudent = !(myExpert && expert && myExpert.id === expert.id);

  const { chat, loading: chatLoading } = useOrCreateChat(expertId);
  const { messages, typingOther, loading } = useChatRealtime(chat);
  const expertOnline = useIsOnline(expert?.user_id || undefined);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark as read on mount + whenever new messages arrive while viewing
  useEffect(() => {
    if (!chat) return;
    void markChatRead(chat, viewerIsStudent);
  }, [chat?.id, messages.length, viewerIsStudent]);

  const grouped = useMemo(() => {
    const out: { date: string; items: typeof messages }[] = [];
    let lastDate = "";
    for (const m of messages) {
      const d = new Date(m.created_at).toDateString();
      if (d !== lastDate) {
        out.push({ date: d, items: [m] });
        lastDate = d;
      } else {
        out[out.length - 1].items.push(m);
      }
    }
    return out;
  }, [messages]);

  if (expLoading || chatLoading) {
    return (
      <div className="flex min-h-screen bg-background font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          Loading chat…
        </main>
      </div>
    );
  }

  if (!expert || !user || !chat) {
    return (
      <div className="flex min-h-screen bg-background font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          Chat unavailable.
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen">
        <header className="border-b border-border px-6 py-3 flex items-center gap-3 bg-background/80 backdrop-blur-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(viewerIsStudent ? `/experts/${expert.id}` : "/experts/inbox")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl overflow-hidden relative shrink-0">
            {expert.photo_url ? (
              <img src={expert.photo_url} alt={expert.name} className="w-full h-full object-cover" />
            ) : (
              expert.avatar
            )}
            {expertOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-foreground truncate">{expert.name}</h1>
              {expert.is_verified && <Shield className="w-3.5 h-3.5 text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {typingOther ? "typing…" : expertOnline ? "Online" : expert.title}
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 bg-background">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground py-8">Loading messages…</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No messages yet. Say hello 👋
            </p>
          ) : (
            grouped.map(({ date, items }) => (
              <div key={date} className="space-y-2">
                <div className="text-center">
                  <span className="text-[10px] text-muted-foreground bg-secondary/60 px-2 py-1 rounded-full">
                    {new Date(date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {items.map((m) => (
                  <ChatMessageBubble key={m.id} message={m} isOwn={m.sender_id === user.id} />
                ))}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <ChatInput
          chat={chat}
          userId={user.id}
          role={viewerIsStudent ? "student" : "expert"}
        />
      </main>
    </div>
  );
};

export default ExpertChatPage;
