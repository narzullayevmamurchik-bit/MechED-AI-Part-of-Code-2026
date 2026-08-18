import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useTeacher = () => {
  const { user } = useAuth();
  const [isTeacher, setIsTeacher] = useState(false);
  const [taughtCourseIds, setTaughtCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!user) {
      setIsTeacher(false);
      setTaughtCourseIds([]);
      setLoading(false);
      return;
    }

    const check = async () => {
      try {
        const [{ data: roleData }, { data: courseLinks }] = await Promise.all([
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "teacher")
            .maybeSingle(),
          supabase
            .from("course_teachers")
            .select("course_id")
            .eq("teacher_id", user.id),
        ]);

        if (!active) return;
        setIsTeacher(!!roleData);
        setTaughtCourseIds((courseLinks || []).map((c) => c.course_id));
      } catch (error) {
        console.warn("Failed to check teacher role:", error);
        if (active) {
          setIsTeacher(false);
          setTaughtCourseIds([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void check();
    return () => {
      active = false;
    };
  }, [user]);

  return { isTeacher, taughtCourseIds, loading };
};
