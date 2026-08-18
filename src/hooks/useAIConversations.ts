import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DBMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function useAIConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setConversations((data as Conversation[]) || []);
    } catch (e) {
      console.warn("Failed to load conversations:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createConversation = useCallback(
    async (title = "New Chat"): Promise<Conversation | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title })
        .select()
        .single();
      if (error) {
        console.warn("Failed to create conversation:", error);
        return null;
      }
      const conv = data as Conversation;
      setConversations((prev) => [conv, ...prev]);
      return conv;
    },
    [user]
  );

  const renameConversation = useCallback(async (id: string, title: string) => {
    const { error } = await supabase
      .from("conversations")
      .update({ title })
      .eq("id", id);
    if (error) {
      console.warn("Failed to rename conversation:", error);
      return;
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) {
      console.warn("Failed to delete conversation:", error);
      return false;
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    return true;
  }, []);

  const touchConversation = useCallback((id: string) => {
    const now = new Date().toISOString();
    setConversations((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, updated_at: now } : c));
      next.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
      return next;
    });
    void supabase.from("conversations").update({ updated_at: now }).eq("id", id);
  }, []);

  return {
    conversations,
    loading,
    refresh,
    createConversation,
    renameConversation,
    deleteConversation,
    touchConversation,
  };
}

export async function loadMessages(conversationId: string): Promise<DBMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("Failed to load messages:", error);
    return [];
  }
  return (data as DBMessage[]) || [];
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<DBMessage | null> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single();
  if (error) {
    console.warn("Failed to save message:", error);
    return null;
  }
  return data as DBMessage;
}
