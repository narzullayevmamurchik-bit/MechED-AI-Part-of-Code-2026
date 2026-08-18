import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface KbEntry {
  id: string;
  question_id: string;
  expert_id: string;
  body: string;
  kb_title: string | null;
  kb_tags: string[];
  kb_published_at: string;
  kb_like_count: number;
  kb_save_count: number;
  kb_comment_count: number;
  kb_view_count: number;
  expert_name: string;
  expert_avatar: string;
  expert_title: string;
  expert_photo_url: string | null;
  question_title: string;
  question_body: string;
  question_category: string;
}

export const useKnowledgeBase = (params: {
  q?: string;
  tags?: string[];
  sort?: "recent" | "liked" | "saved";
}) => {
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { q = "", tags = [], sort = "recent" } = params;

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data } = await supabase.rpc("search_kb" as any, {
        _q: q,
        _tags: tags,
        _sort: sort,
        _limit: 60,
        _offset: 0,
      });
      if (active) {
        setEntries((data as any) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [q, JSON.stringify(tags), sort]);

  return { entries, loading };
};

export const useKbEntry = (answerId: string | undefined) => {
  const { user } = useAuth();
  const [entry, setEntry] = useState<KbEntry | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!answerId) return;
    setLoading(true);
    // Direct fetch by id (RPC doesn't filter by id; use direct query)
    const { data: row } = await supabase
      .from("expert_answers" as any)
      .select(`*, expert:experts(id, name, avatar, title, photo_url),
               question:expert_questions(title, body, category)`)
      .eq("id", answerId)
      .maybeSingle();
    if (row) {
      setEntry({
        id: row.id,
        question_id: row.question_id,
        expert_id: row.expert_id,
        body: row.body,
        kb_title: row.kb_title,
        kb_tags: row.kb_tags ?? [],
        kb_published_at: row.kb_published_at,
        kb_like_count: row.kb_like_count,
        kb_save_count: row.kb_save_count,
        kb_comment_count: row.kb_comment_count,
        kb_view_count: row.kb_view_count,
        expert_name: row.expert?.name ?? "",
        expert_avatar: row.expert?.avatar ?? "👤",
        expert_title: row.expert?.title ?? "",
        expert_photo_url: row.expert?.photo_url ?? null,
        question_title: row.question?.title ?? "",
        question_body: row.question?.body ?? "",
        question_category: row.question?.category ?? "",
      });
    }
    const { data: cs } = await supabase
      .from("kb_comments" as any)
      .select("*")
      .eq("answer_id", answerId)
      .order("created_at", { ascending: true });
    setComments((cs as any) ?? []);

    if (user) {
      const [{ data: l }, { data: s }] = await Promise.all([
        supabase.from("kb_likes" as any).select("user_id").eq("answer_id", answerId).eq("user_id", user.id).maybeSingle(),
        supabase.from("kb_saves" as any).select("user_id").eq("answer_id", answerId).eq("user_id", user.id).maybeSingle(),
      ]);
      setLiked(!!l);
      setSaved(!!s);
    }
    setLoading(false);
  }, [answerId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleLike = async () => {
    if (!user || !answerId) return;
    if (liked) {
      await supabase.from("kb_likes" as any).delete().eq("answer_id", answerId).eq("user_id", user.id);
      setLiked(false);
      setEntry((e) => (e ? { ...e, kb_like_count: Math.max(0, e.kb_like_count - 1) } : e));
    } else {
      await supabase.from("kb_likes" as any).insert({ answer_id: answerId, user_id: user.id });
      setLiked(true);
      setEntry((e) => (e ? { ...e, kb_like_count: e.kb_like_count + 1 } : e));
    }
  };

  const toggleSave = async () => {
    if (!user || !answerId) return;
    if (saved) {
      await supabase.from("kb_saves" as any).delete().eq("answer_id", answerId).eq("user_id", user.id);
      setSaved(false);
      setEntry((e) => (e ? { ...e, kb_save_count: Math.max(0, e.kb_save_count - 1) } : e));
    } else {
      await supabase.from("kb_saves" as any).insert({ answer_id: answerId, user_id: user.id });
      setSaved(true);
      setEntry((e) => (e ? { ...e, kb_save_count: e.kb_save_count + 1 } : e));
    }
  };

  const addComment = async (body: string) => {
    if (!user || !answerId || !body.trim()) return;
    const { data } = await supabase
      .from("kb_comments" as any)
      .insert({ answer_id: answerId, user_id: user.id, body: body.trim() })
      .select()
      .single();
    if (data) setComments((prev) => [...prev, data]);
  };

  return { entry, comments, liked, saved, loading, toggleLike, toggleSave, addComment, reload: load };
};

/** Saved KB entries for current user */
export const useMySavedKb = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data: saves } = await supabase
        .from("kb_saves" as any)
        .select("answer_id")
        .eq("user_id", user.id);
      const ids = (saves ?? []).map((s: any) => s.answer_id);
      if (!ids.length) {
        if (active) {
          setEntries([]);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("expert_answers" as any)
        .select(`*, expert:experts(id, name, avatar, title, photo_url),
                 question:expert_questions(title, body, category)`)
        .in("id", ids)
        .eq("kb_published", true);
      const mapped = (data ?? []).map((row: any) => ({
        id: row.id,
        question_id: row.question_id,
        expert_id: row.expert_id,
        body: row.body,
        kb_title: row.kb_title,
        kb_tags: row.kb_tags ?? [],
        kb_published_at: row.kb_published_at,
        kb_like_count: row.kb_like_count,
        kb_save_count: row.kb_save_count,
        kb_comment_count: row.kb_comment_count,
        kb_view_count: row.kb_view_count,
        expert_name: row.expert?.name ?? "",
        expert_avatar: row.expert?.avatar ?? "👤",
        expert_title: row.expert?.title ?? "",
        expert_photo_url: row.expert?.photo_url ?? null,
        question_title: row.question?.title ?? "",
        question_body: row.question?.body ?? "",
        question_category: row.question?.category ?? "",
      })) as KbEntry[];
      if (active) {
        setEntries(mapped);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  return { entries, loading };
};
