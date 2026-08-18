import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminActivityEntry {
  id: string;
  actor_id: string;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const logAdminActivity = async (
  action: string,
  entity_type: string,
  entity_id?: string | null,
  entity_label?: string | null,
  metadata: Record<string, unknown> = {},
) => {
  try {
    await supabase.rpc("log_admin_activity", {
      _action: action,
      _entity_type: entity_type,
      _entity_id: entity_id ?? null,
      _entity_label: entity_label ?? null,
      _metadata: metadata as never,
    });
    window.dispatchEvent(new CustomEvent("admin_activity_changed"));
  } catch (e) {
    console.warn("Failed to log admin activity:", e);
  }
};

export const useAdminActivity = (limit = 50) => {
  const [entries, setEntries] = useState<AdminActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLog = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;

      const actorIds = Array.from(new Set((data ?? []).map((r) => r.actor_id)));
      const profileMap = new Map<string, string>();
      if (actorIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", actorIds);
        (profiles ?? []).forEach((p) => profileMap.set(p.user_id, p.display_name ?? "Admin"));
      }

      setEntries(
        (data ?? []).map((r) => ({
          id: r.id,
          actor_id: r.actor_id,
          actor_name: profileMap.get(r.actor_id) ?? "Admin",
          action: r.action,
          entity_type: r.entity_type,
          entity_id: r.entity_id,
          entity_label: r.entity_label,
          metadata: (r.metadata ?? {}) as Record<string, unknown>,
          created_at: r.created_at,
        })),
      );
    } catch (e) {
      console.warn("Failed to load admin activity log:", e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void fetchLog();
    const handler = () => void fetchLog();
    window.addEventListener("admin_activity_changed", handler);

    const channel = supabase
      .channel("admin_activity_log_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_activity_log" },
        () => void fetchLog(),
      )
      .subscribe();

    return () => {
      window.removeEventListener("admin_activity_changed", handler);
      void supabase.removeChannel(channel);
    };
  }, [fetchLog]);

  return { entries, loading, refresh: fetchLog };
};
