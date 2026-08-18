import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) throw error;
        if (active) setIsAdmin(!!data);
      } catch (error) {
        console.warn("Failed to check admin role:", error);
        if (active) setIsAdmin(false);
      } finally {
        if (active) setLoading(false);
      }
    };

    void checkAdmin();

    return () => {
      active = false;
    };
  }, [user]);

  return { isAdmin, loading };
};
