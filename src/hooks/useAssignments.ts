import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Assignment {
  id: string;
  course_id: string;
  chapter_id: string | null;
  title: string;
  description: string;
  assigned_at: string;
  deadline: string | null;
  max_score: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string | null;
  file_path: string | null;
  file_name: string | null;
  status: string;
  ai_score: number | null;
  ai_feedback: any;
  teacher_score: number | null;
  teacher_feedback: string | null;
  plagiarism_score: number | null;
  plagiarism_matches: any;
  submitted_at: string;
  graded_at: string | null;
}

/* Fetch assignments — optionally filtered by course */
export const useAssignments = (courseId?: string) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("assignments").select("*").order("created_at", { ascending: false });
      if (courseId) query = query.eq("course_id", courseId);
      const { data, error } = await query;
      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.warn("Failed to load assignments:", error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { assignments, loading, refetch };
};

/* Student submissions for current user */
export const useMySubmissions = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setSubmissions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("student_id", user.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.warn("Failed to load submissions:", error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { submissions, loading, refetch };
};

/* All submissions for an assignment (teacher view) */
export const useAssignmentSubmissions = (assignmentId: string | null) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!assignmentId) {
      setSubmissions([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("assignment_id", assignmentId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.warn("Failed to load submissions:", error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { submissions, loading, refetch };
};
