import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DbExpert {
  id: string;
  user_id: string | null;
  legacy_id: string | null;
  name: string;
  title: string;
  position: string;
  institution: string;
  bio: string;
  avatar: string;
  photo_url: string | null;
  research_interests: string;
  publications: string[];
  experience_years: number | null;
  languages: string[];
  availability: "available" | "busy" | "offline";
  email: string | null;
  telegram: string | null;
  phone: string | null;
  is_verified: boolean;
  is_lead: boolean;
  rating_avg: number;
  rating_count: number;
  students_helped: number;
  response_rate: number;
  response_time_hours: number;
  sort_order: number;
  specializations: { id: string; slug: string; name: string; icon: string }[];
}

export interface DbSpecialization {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  sort_order: number;
}

export const useSpecializations = () => {
  const [specializations, setSpecializations] = useState<DbSpecialization[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("expert_specializations" as any)
      .select("*")
      .order("sort_order");
    setSpecializations((data as any) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  return { specializations, loading, reload: load };
};

export const useExpertsDb = () => {
  const [experts, setExperts] = useState<DbExpert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("experts" as any)
      .select(`*, expert_specialization_links(specialization_id, expert_specializations(id, slug, name, icon))`)
      .order("sort_order");

    if (error) {
      console.warn("Failed to load experts", error);
      setExperts([]);
    } else {
      const mapped: DbExpert[] = (data as any[]).map((e) => ({
        ...e,
        specializations: (e.expert_specialization_links || [])
          .map((l: any) => l.expert_specializations)
          .filter(Boolean),
      }));
      setExperts(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  return { experts, loading, reload: load };
};

export const useExpertById = (id: string | undefined) => {
  const [expert, setExpert] = useState<DbExpert | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) { setExpert(null); setLoading(false); return; }
    setLoading(true);
    // Allow lookup by uuid OR legacy_id (e.g. "e1")
    const isUuid = /^[0-9a-f]{8}-/i.test(id);
    const query = supabase
      .from("experts" as any)
      .select(`*, expert_specialization_links(specialization_id, expert_specializations(id, slug, name, icon))`);

    const { data, error } = isUuid
      ? await query.eq("id", id).maybeSingle()
      : await query.eq("legacy_id", id).maybeSingle();

    if (error || !data) {
      setExpert(null);
    } else {
      const e: any = data;
      setExpert({
        ...e,
        specializations: (e.expert_specialization_links || [])
          .map((l: any) => l.expert_specializations)
          .filter(Boolean),
      });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  return { expert, loading, reload: load };
};

export const useFollowExpert = (expertId: string | undefined) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || !expertId) { setIsFollowing(false); return; }
    const { data } = await supabase
      .from("expert_followers" as any)
      .select("id")
      .eq("student_id", user.id)
      .eq("expert_id", expertId)
      .maybeSingle();
    setIsFollowing(!!data);
  }, [user, expertId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const toggle = async () => {
    if (!user || !expertId) return;
    if (isFollowing) {
      await supabase.from("expert_followers" as any).delete().eq("student_id", user.id).eq("expert_id", expertId);
    } else {
      await supabase.from("expert_followers" as any).insert({ student_id: user.id, expert_id: expertId });
    }
    await refresh();
  };

  return { isFollowing, toggle };
};

/**
 * Returns the expert row associated with the current user (if any).
 * Used to show "Expert Inbox" link in the sidebar.
 */
export const useMyExpertProfile = () => {
  const { user } = useAuth();
  const [expert, setExpert] = useState<DbExpert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) { setExpert(null); setLoading(false); return; }
    (async () => {
      // One-time account-to-expert linking by matching registration email.
      // Server-side (security definer) — uses the authenticated user id after matching.
      try {
        await supabase.rpc("link_my_expert_profile" as any);
      } catch (e) {
        console.warn("Expert link check failed:", e);
      }

      const { data } = await supabase
        .from("experts" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (active) {
        setExpert((data as any) ?? null);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  return { expert, loading };
};
