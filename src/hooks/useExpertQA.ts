import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type QuestionStatus = "open" | "answered" | "closed";
export type QuestionPriority = "low" | "normal" | "high" | "urgent";

export interface ExpertQuestion {
  id: string;
  student_id: string;
  expert_id: string;
  title: string;
  body: string;
  category: string;
  priority: QuestionPriority;
  attachments: { name: string; url: string }[];
  status: QuestionStatus;
  is_public: boolean;
  like_count: number;
  created_at: string;
  updated_at: string;
  // joined:
  expert?: { id: string; name: string; avatar: string; title: string };
  student?: { display_name: string | null; avatar_url: string | null };
  answers?: ExpertAnswer[];
}

export interface ExpertAnswer {
  id: string;
  question_id: string;
  expert_id: string;
  author_id: string;
  body: string;
  attachments: { name: string; url: string }[];
  is_ai_draft: boolean;
  created_at: string;
}

export interface AskQuestionPayload {
  expert_id: string;
  title: string;
  body: string;
  category: string;
  priority: QuestionPriority;
  is_public: boolean;
  attachments?: { name: string; url: string }[];
}

/** Hook for current student: their own questions */
export const useMyQuestions = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<ExpertQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setQuestions([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("expert_questions" as any)
      .select(`*, expert:experts(id, name, avatar, title), answers:expert_answers(*)`)
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });
    setQuestions((data as any) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);
  return { questions, loading, reload: load };
};

/** Hook for an expert: inbox of incoming questions */
export const useExpertInbox = (expertId: string | undefined) => {
  const [questions, setQuestions] = useState<ExpertQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!expertId) { setQuestions([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("expert_questions" as any)
      .select(`*, answers:expert_answers(*)`)
      .eq("expert_id", expertId)
      .order("created_at", { ascending: false });
    // student profile fetched separately (no FK)
    const list = (data as any[]) ?? [];
    if (list.length) {
      const studentIds = Array.from(new Set(list.map((q) => q.student_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", studentIds);
      const byId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      list.forEach((q) => { q.student = byId.get(q.student_id) || null; });
    }
    setQuestions(list);
    setLoading(false);
  }, [expertId]);

  useEffect(() => { void load(); }, [load]);
  return { questions, loading, reload: load };
};

/** Public Q&A feed for an expert */
export const usePublicQuestions = (expertId: string | undefined) => {
  const [questions, setQuestions] = useState<ExpertQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!expertId) return;
    setLoading(true);
    const { data } = await supabase
      .from("expert_questions" as any)
      .select(`*, answers:expert_answers(*)`)
      .eq("expert_id", expertId)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(20);
    setQuestions((data as any) ?? []);
    setLoading(false);
  }, [expertId]);

  useEffect(() => { void load(); }, [load]);
  return { questions, loading, reload: load };
};

export const askExpert = async (payload: AskQuestionPayload, studentId: string) => {
  const { data, error } = await supabase
    .from("expert_questions" as any)
    .insert({ ...payload, student_id: studentId, attachments: payload.attachments ?? [] })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const answerQuestion = async (params: {
  question_id: string;
  expert_id: string;
  author_id: string;
  body: string;
  attachments?: { name: string; url: string }[];
}) => {
  const { data, error } = await supabase
    .from("expert_answers" as any)
    .insert({ ...params, attachments: params.attachments ?? [] })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const uploadQuestionAttachment = async (file: File, userId: string) => {
  const path = `${userId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("submissions").upload(path, file);
  if (error) throw error;
  const { data } = await supabase.storage.from("submissions").createSignedUrl(path, 60 * 60 * 24 * 30);
  return { name: file.name, url: data?.signedUrl ?? "" };
};
