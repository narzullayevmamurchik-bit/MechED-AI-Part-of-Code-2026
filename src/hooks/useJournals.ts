import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Journal {
  id: string;
  name: string;
  issn: string | null;
  e_issn: string | null;
  publisher: string | null;
  country: string | null;
  region: "uzbekistan" | "international";
  website: string | null;
  submission_url: string | null;
  is_scopus: boolean;
  is_wos: boolean;
  is_esci: boolean;
  is_oak: boolean;
  is_doaj: boolean;
  is_open_access: boolean;
  quartile: "Q1" | "Q2" | "Q3" | "Q4" | null;
  apc_amount: number | null;
  apc_currency: string | null;
  review_time_weeks: number | null;
  acceptance_rate: number | null;
  publication_frequency: string | null;
  contact_email: string | null;
  editorial_office: string | null;
  editor_info: string | null;
  scope: string | null;
  aims: string | null;
  subject_areas: string[];
  keywords: string[];
  template_url: string | null;
  formatting_guide: string | null;
  citation_style: string | null;
  max_pages: number | null;
  abstract_min_words: number | null;
  abstract_max_words: number | null;
  languages: string[];
  plagiarism_threshold: number | null;
  figure_requirements: string | null;
  risk_status: "safe" | "caution" | "high_risk";
  risk_note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useJournals = () =>
  useQuery({
    queryKey: ["journals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journals" as any)
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as unknown as Journal[];
    },
  });

export const useJournalMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["journals"] });

  const upsert = useMutation({
    mutationFn: async (j: Partial<Journal> & { id?: string }) => {
      if (j.id) {
        const { error } = await supabase.from("journals" as any).update(j).eq("id", j.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("journals" as any).insert(j as any);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journals" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const bulkImport = useMutation({
    mutationFn: async (rows: Partial<Journal>[]) => {
      if (!rows.length) return;
      const { error } = await supabase.from("journals" as any).insert(rows as any);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { upsert, remove, bulkImport };
};

export interface MatchResult {
  matches: Array<{ id: string; fit: number; reason: string; est_review_weeks: number | null; est_cost: string; journal: Journal }>;
  alternatives: Array<{ id: string; fit: number; reason: string; journal: Journal }>;
}

export const matchJournals = async (input: { title: string; abstract: string; keywords: string[] }): Promise<MatchResult> => {
  const { data, error } = await supabase.functions.invoke("match-journals", { body: input });
  if (error) throw error;
  return data as MatchResult;
};
