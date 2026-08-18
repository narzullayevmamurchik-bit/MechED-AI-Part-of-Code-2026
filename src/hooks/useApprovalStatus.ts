import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AccountStatus = "active" | "pending" | "suspended" | "banned";

export const useApprovalStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("user_moderation")
        .select("status, last_reason")
        .eq("user_id", user.id)
        .maybeSingle();
      // No row = legacy account, treat as active
      setStatus(((data?.status as AccountStatus) ?? "active"));
      setReason(data?.last_reason ?? null);
    } catch (e) {
      console.warn("Failed to load approval status:", e);
      setStatus("active");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
    if (!user) return;
    const channel = supabase
      .channel(`user_moderation:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_moderation", filter: `user_id=eq.${user.id}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, load]);

  return { status, reason, loading, refresh: load };
};
