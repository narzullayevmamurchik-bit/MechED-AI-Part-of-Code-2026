import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Send, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  user_id: string;
  display_name: string | null;
  message: string;
  created_at: string;
}

export const CommunityChat = () => {
  const { user, displayName } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(100);

        if (error) throw error;
        if (active) setMessages((data as ChatMessage[]) || []);
      } catch (error) {
        console.warn("Failed to load chat messages:", error);
        if (active) setMessages([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchMessages();

    const channel = supabase
      .channel(`chat-realtime-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        if (!active) return;

        const nextMessage = payload.new as ChatMessage;
        setMessages((prev) => {
          if (prev.some((message) => message.id === nextMessage.id)) return prev;
          return [...prev, nextMessage].slice(-100);
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (payload) => {
        if (!active) return;
        setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any).id));
      })
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("Community chat realtime error:", err ?? status);
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;

    setSending(true);

    try {
      const { error } = await supabase.from("chat_messages").insert({
        user_id: user.id,
        display_name: displayName || user.email || "User",
        message: text.trim(),
      });

      if (error) throw error;
      setText("");
    } catch (error) {
      console.warn("Failed to send chat message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("chat_messages").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.warn("Failed to delete chat message:", error);
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-[500px] bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <h3 className="text-sm font-semibold text-foreground">💬 Community Chat</h3>
        <p className="text-xs text-muted-foreground">Discuss with fellow students</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.user_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-xl ${isOwn ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                {!isOwn && (
                  <p className="text-[10px] font-semibold opacity-70 mb-0.5">{msg.display_name}</p>
                )}
                <p className="text-sm">{msg.message}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] opacity-50">{formatTime(msg.created_at)}</span>
                  {isOwn && (
                    <button onClick={() => handleDelete(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <Trash2 className="w-3 h-3 opacity-50 hover:opacity-100" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-border flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          disabled={sending}
        />
        <Button size="icon" onClick={handleSend} disabled={sending || !text.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
