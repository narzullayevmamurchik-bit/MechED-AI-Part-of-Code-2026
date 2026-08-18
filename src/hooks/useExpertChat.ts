import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ChatKind = "text" | "image" | "file" | "voice";

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_role: "student" | "expert";
  kind: ChatKind;
  body: string;
  attachment: {
    name?: string;
    url?: string;
    mime?: string;
    size?: number;
    duration_sec?: number;
  } | null;
  read_at: string | null;
  created_at: string;
}

export interface ExpertChat {
  id: string;
  student_id: string;
  expert_id: string;
  last_message_at: string;
  last_message_preview: string | null;
  student_unread: number;
  expert_unread: number;
  created_at: string;
}

/** Find or create the chat between current user (student) and the expert */
export const useOrCreateChat = (expertId: string | undefined) => {
  const { user } = useAuth();
  const [chat, setChat] = useState<ExpertChat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!user || !expertId) {
        setChat(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const existing = await supabase
          .from("expert_chats" as any)
          .select("*")
          .eq("student_id", user.id)
          .eq("expert_id", expertId)
          .maybeSingle();
        if (existing.data) {
          if (active) setChat(existing.data as any);
        } else {
          const created = await supabase
            .from("expert_chats" as any)
            .insert({ student_id: user.id, expert_id: expertId })
            .select()
            .single();
          if (active && created.data) setChat(created.data as any);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [user, expertId]);

  return { chat, loading };
};

/** Realtime messages + typing indicator for a single chat */
export const useChatRealtime = (chat: ExpertChat | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingOther, setTypingOther] = useState(false);
  const [loading, setLoading] = useState(true);
  const typingTimer = useRef<number | null>(null);

  // Load history + subscribe
  useEffect(() => {
    if (!chat || !user) return;
    let active = true;
    setLoading(true);

    const load = async () => {
      const { data } = await supabase
        .from("expert_chat_messages" as any)
        .select("*")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: true })
        .limit(500);
      if (active) {
        setMessages((data as any) ?? []);
        setLoading(false);
      }
    };
    void load();

    const channel = supabase
      .channel(`chat-${chat.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "expert_chat_messages", filter: `chat_id=eq.${chat.id}` },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "expert_chat_messages", filter: `chat_id=eq.${chat.id}` },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expert_chat_typing", filter: `chat_id=eq.${chat.id}` },
        (payload) => {
          const row = (payload.new || payload.old) as any;
          if (!row || row.user_id === user.id) return;
          const fresh = row.updated_at && Date.now() - new Date(row.updated_at).getTime() < 5000;
          setTypingOther(!!fresh);
          if (typingTimer.current) window.clearTimeout(typingTimer.current);
          typingTimer.current = window.setTimeout(() => setTypingOther(false), 4000);
        }
      )
      .subscribe();

    return () => {
      active = false;
      if (typingTimer.current) window.clearTimeout(typingTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [chat?.id, user?.id]);

  return { messages, typingOther, loading };
};

/** Mark unread messages from the other party as read */
export const markChatRead = async (chat: ExpertChat, viewerIsStudent: boolean) => {
  const otherRole = viewerIsStudent ? "expert" : "student";
  await supabase
    .from("expert_chat_messages" as any)
    .update({ read_at: new Date().toISOString() })
    .eq("chat_id", chat.id)
    .eq("sender_role", otherRole)
    .is("read_at", null);
  await supabase
    .from("expert_chats" as any)
    .update(viewerIsStudent ? { student_unread: 0 } : { expert_unread: 0 })
    .eq("id", chat.id);
};

/** Push typing pulse (call on each keystroke; throttled by caller) */
export const pushTyping = async (chatId: string, userId: string) => {
  await supabase
    .from("expert_chat_typing" as any)
    .upsert({ chat_id: chatId, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: "chat_id,user_id" });
};

/** Send a chat message */
export const sendChatMessage = async (params: {
  chat_id: string;
  sender_id: string;
  sender_role: "student" | "expert";
  body?: string;
  kind?: ChatKind;
  attachment?: ChatMessage["attachment"];
}) => {
  const { error } = await supabase.from("expert_chat_messages" as any).insert({
    chat_id: params.chat_id,
    sender_id: params.sender_id,
    sender_role: params.sender_role,
    kind: params.kind ?? "text",
    body: params.body ?? "",
    attachment: params.attachment ?? null,
  });
  if (error) throw error;
};

/** Upload a file to expert-media bucket and return signed URL + metadata */
export const uploadChatMedia = async (
  file: Blob,
  filename: string,
  userId: string,
  chatId: string
) => {
  const path = `${userId}/${chatId}/${Date.now()}-${filename}`;
  const { error } = await supabase.storage.from("expert-media").upload(path, file, {
    contentType: (file as File).type || "application/octet-stream",
  });
  if (error) throw error;
  const signed = await supabase.storage.from("expert-media").createSignedUrl(path, 60 * 60 * 24 * 30);
  return {
    name: filename,
    url: signed.data?.signedUrl ?? "",
    mime: (file as File).type || "application/octet-stream",
    size: (file as File).size ?? 0,
  };
};

/** List chats for a user (student-side) */
export const useStudentChats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<(ExpertChat & { expert?: any })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("expert_chats" as any)
      .select(`*, expert:experts(id, name, avatar, title, photo_url)`)
      .eq("student_id", user.id)
      .order("last_message_at", { ascending: false });
    setChats((data as any) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return { chats, loading, reload: load };
};

/** List chats for an expert (inbox) */
export const useExpertChats = (expertId: string | undefined) => {
  const [chats, setChats] = useState<(ExpertChat & { student?: any })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!expertId) {
      setChats([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("expert_chats" as any)
      .select("*")
      .eq("expert_id", expertId)
      .order("last_message_at", { ascending: false });
    const list = (data as any[]) ?? [];
    if (list.length) {
      const ids = Array.from(new Set(list.map((c) => c.student_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", ids);
      const byId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      list.forEach((c) => (c.student = byId.get(c.student_id)));
    }
    setChats(list);
    setLoading(false);
  }, [expertId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { chats, loading, reload: load };
};

/** Quick presence check for a user id (last_seen < 5 min) */
export const useIsOnline = (userId: string | undefined) => {
  const [online, setOnline] = useState(false);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    const check = async () => {
      const { data } = await supabase
        .from("user_presence")
        .select("last_seen")
        .eq("user_id", userId)
        .maybeSingle();
      if (!active) return;
      if (!data) return setOnline(false);
      const seen = new Date(data.last_seen).getTime();
      setOnline(Date.now() - seen < 5 * 60 * 1000);
    };
    void check();
    const i = window.setInterval(check, 60_000);
    return () => {
      active = false;
      window.clearInterval(i);
    };
  }, [userId]);
  return online;
};
