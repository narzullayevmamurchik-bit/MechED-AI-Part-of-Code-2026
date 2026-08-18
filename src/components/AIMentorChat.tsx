import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Send,
  Sparkles,
  Loader2,
  BookOpen,
  Users,
  FileText,
  Trash2,
  Brain,
  Plus,
  MessageSquare,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { MentorResponseRenderer } from "@/components/ai-mentor/MentorResponseRenderer";
import {
  ChatMessage,
  streamMentorChat,
  createAbortable,
} from "@/services/aiMentorService";
import {
  useAIConversations,
  loadMessages,
  saveMessage,
  type Conversation,
} from "@/hooks/useAIConversations";

const QUICK_PROMPTS = [
  { label: "Learn Metallurgy", icon: BookOpen, message: "I want to start learning metallurgy. Where should I begin?" },
  { label: "Find Resources", icon: FileText, message: "What are the best resources for materials science?" },
  { label: "Find Expert", icon: Users, message: "Who are the top experts in machining and manufacturing?" },
  { label: "What is EAF?", icon: Sparkles, message: "What is an Electric Arc Furnace (EAF) and how does it work?" },
];

const CONTEXT_WINDOW = 20;

function deriveTitle(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length <= 48 ? clean : clean.slice(0, 45) + "…";
}

export function AIMentorChat() {
  const { user, session } = useAuth();
  const { language } = useLanguage();
  const {
    conversations,
    createConversation,
    renameConversation,
    deleteConversation,
    touchConversation,
  } = useAIConversations();

  const [open, setOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<ReturnType<typeof createAbortable> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; abortRef.current?.cancel(); }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let active = true;
    void (async () => {
      const rows = await loadMessages(activeId);
      if (!active) return;
      setMessages(rows.map((r) => ({ role: r.role, content: r.content })));
    })();
    return () => {
      active = false;
    };
  }, [activeId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  // External event to open mentor with a prompt
  const sendFnRef = useRef<(t: string) => void>(() => {});
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.prompt) {
        setOpen(true);
        setTimeout(() => sendFnRef.current(detail.prompt), 200);
      }
    };
    window.addEventListener("open-ai-mentor", handler);
    return () => window.removeEventListener("open-ai-mentor", handler);
  }, []);

  const updateLastAssistant = useCallback((content: string) => {
    if (!mountedRef.current) return;
    setIsThinking(false);
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.role === "assistant") {
        copy[copy.length - 1] = { role: "assistant", content };
      } else {
        copy.push({ role: "assistant", content });
      }
      return copy;
    });
  }, []);

  const handleNewChat = useCallback(() => {
    abortRef.current?.cancel();
    setActiveId(null);
    setMessages([]);
    setIsLoading(false);
    setIsThinking(false);
    inputRef.current?.focus();
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading || !user) return;

      abortRef.current?.cancel();

      // Ensure we have a conversation
      let convId = activeId;
      let isNew = false;
      if (!convId) {
        const conv = await createConversation(deriveTitle(trimmed));
        if (!conv) return;
        convId = conv.id;
        isNew = true;
        setActiveId(conv.id);
      }

      const userMsg: ChatMessage = { role: "user", content: trimmed };
      const baseHistory = [...messages, userMsg];
      setMessages([...baseHistory, { role: "assistant", content: "" }]);
      setInput("");
      setIsLoading(true);
      setIsThinking(true);

      // Persist user message (fire and forget — RLS protected)
      void saveMessage(convId, "user", trimmed);
      if (!isNew) touchConversation(convId);

      const abortable = createAbortable();
      abortRef.current = abortable;

      const contextWindow = baseHistory.slice(-CONTEXT_WINDOW);

      streamMentorChat(
        contextWindow,
        session?.access_token,
        {
          onToken: (fullText) => updateLastAssistant(fullText),
          onDone: (finalText) => {
            abortable.clearTimeout();
            if (mountedRef.current) {
              setIsLoading(false);
              setIsThinking(false);
            }
            void saveMessage(convId!, "assistant", finalText);
            touchConversation(convId!);
          },
          onError: (errorMsg) => {
            updateLastAssistant(errorMsg);
            abortable.clearTimeout();
            if (mountedRef.current) {
              setIsLoading(false);
              setIsThinking(false);
            }
            void saveMessage(convId!, "assistant", errorMsg);
          },
        },
        abortable.signal,
        language
      );
    },
    [
      isLoading,
      user,
      activeId,
      messages,
      session?.access_token,
      language,
      createConversation,
      touchConversation,
      updateLastAssistant,
    ]
  );

  sendFnRef.current = (t: string) => void send(t);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    if (conv.id === activeId) return;
    abortRef.current?.cancel();
    setIsLoading(false);
    setIsThinking(false);
    setActiveId(conv.id);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ok = await deleteConversation(id);
    if (ok && id === activeId) {
      setActiveId(null);
      setMessages([]);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 font-medium shadow-lg transition-all duration-300 hover:scale-105",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          open && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <Sparkles className="w-5 h-5" /> AI Mentor
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex rounded-2xl border border-border bg-background shadow-2xl transition-all duration-300 origin-bottom-right overflow-hidden",
          open
            ? "w-[640px] h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] scale-100 opacity-100"
            : "w-0 h-0 scale-75 opacity-0 pointer-events-none"
        )}
      >
        {/* Sidebar */}
        <aside
          className={cn(
            "flex flex-col border-r border-border bg-muted/30 transition-all duration-200 overflow-hidden",
            sidebarOpen ? "w-56" : "w-0"
          )}
        >
          <div className="p-3 border-b border-border">
            <Button
              size="sm"
              className="w-full justify-start gap-2"
              onClick={handleNewChat}
            >
              <Plus className="w-4 h-4" /> New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                No conversations yet
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={cn(
                    "group w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors",
                    conv.id === activeId
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 truncate">{conv.title}</span>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setSidebarOpen((s) => !s)}
                title="Toggle conversations"
              >
                <PanelLeft className="w-4 h-4" />
              </Button>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  AI Mentor
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {activeId
                    ? conversations.find((c) => c.id === activeId)?.title ?? "Chat"
                    : "Engineering learning assistant"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {activeId ? "Continue your conversation" : "Start a new conversation"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask me anything about engineering, courses, or resources.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.label}
                      onClick={() => void send(qp.message)}
                      disabled={isLoading}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card text-xs font-medium text-foreground hover:bg-accent hover:border-primary/30 transition-all text-left disabled:opacity-50"
                    >
                      <qp.icon className="w-3.5 h-3.5 text-primary shrink-0" /> {qp.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  {msg.role === "assistant"
                    ? <MentorResponseRenderer content={msg.content || ""} />
                    : msg.content}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 animate-pulse text-primary" />
                  <span className="text-xs text-muted-foreground">Thinking…</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about engineering..."
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-h-24 disabled:opacity-50"
              />
              <Button
                size="icon"
                className="h-10 w-10 rounded-xl shrink-0"
                onClick={() => void send(input)}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
