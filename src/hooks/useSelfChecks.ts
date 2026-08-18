import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SelfCheck {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  status: "pending" | "grading" | "graded" | "error";
  ai_score: number | null;
  ai_feedback: any;
  created_at: string;
  updated_at: string;
  graded_at: string | null;
  ocr_job_id: string | null;
  ocr_text: string | null;
  ocr_confidence: number | null;
  ocr_languages: string[] | null;
}

export const ALLOWED_SELF_CHECK_EXT = ["pdf", "docx", "pptx", "png", "jpg", "jpeg", "webp", "heic", "heif", "txt", "md"];
export const OCR_TRIGGER_EXT = ["pdf", "png", "jpg", "jpeg", "webp", "heic", "heif"];
export const MAX_SELF_CHECK_MB = 50;

export const useSelfChecks = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<SelfCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("self_checks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data || []) as SelfCheck[]);
    } catch (e) {
      console.warn("Failed to load self-checks:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refetch();
    if (!user) return;
    const channel = supabase
      .channel(`self_checks:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "self_checks", filter: `user_id=eq.${user.id}` },
        () => void refetch(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refetch, user]);

  return { items, loading, refetch };
};
