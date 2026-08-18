import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const usePresence = () => {
  const { user } = useAuth();
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Upsert presence
    const updatePresence = async () => {
      try {
        await supabase.from("user_presence").upsert(
          { user_id: user.id, last_seen: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      } catch (e) {
        console.warn("Presence update failed:", e);
      }
    };

    const fetchActive = async () => {
      try {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from("user_presence")
          .select("*", { count: "exact", head: true })
          .gte("last_seen", fiveMinAgo);
        setActiveCount(count || 0);
      } catch (e) {
        console.warn("Presence fetch failed:", e);
        setActiveCount(1);
      }
    };

    updatePresence();
    fetchActive();

    const interval = setInterval(() => {
      updatePresence();
      fetchActive();
    }, 60_000);

    return () => clearInterval(interval);
  }, [user]);

  return { activeCount };
};
