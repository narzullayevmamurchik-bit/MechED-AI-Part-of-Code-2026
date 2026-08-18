import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAdminActivity } from "@/hooks/useAdminActivity";

export interface Specialization {
  id: string;
  field_id: string;
  key: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_archived: boolean;
}

export interface EngineeringField {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_archived: boolean;
  specializations: Specialization[];
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");

export const useEngineeringFields = () => {
  const [fields, setFields] = useState<EngineeringField[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: fs }, { data: sp }] = await Promise.all([
        supabase.from("engineering_fields").select("*").order("sort_order"),
        supabase.from("specializations").select("*").order("sort_order"),
      ]);
      const specsByField = new Map<string, Specialization[]>();
      (sp || []).forEach((s: any) => {
        const arr = specsByField.get(s.field_id) || [];
        arr.push(s as Specialization);
        specsByField.set(s.field_id, arr);
      });
      setFields(
        (fs || []).map((f: any) => ({
          ...(f as EngineeringField),
          specializations: specsByField.get(f.id) || [],
        }))
      );
    } catch (err) {
      console.warn("fields load failed", err);
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const createField = async (name: string, description = "", icon = "") => {
    const key = slugify(name);
    const { error } = await supabase.from("engineering_fields").insert({
      key, name, description, icon, sort_order: fields.length * 10,
    });
    if (!error) {
      await fetchAll();
      void logAdminActivity("create", "engineering_field", null, name);
    }
    return { error };
  };

  const updateField = async (id: string, patch: Partial<EngineeringField>) => {
    const { error } = await supabase.from("engineering_fields").update(patch as any).eq("id", id);
    if (!error) {
      await fetchAll();
      void logAdminActivity("update", "engineering_field", id, patch.name);
    }
    return { error };
  };

  const deleteField = async (id: string) => {
    const prev = fields.find((f) => f.id === id);
    const { error } = await supabase.from("engineering_fields").delete().eq("id", id);
    if (!error) {
      await fetchAll();
      void logAdminActivity("delete", "engineering_field", id, prev?.name);
    }
    return { error };
  };

  const createSpecialization = async (fieldId: string, name: string, description = "") => {
    const field = fields.find((f) => f.id === fieldId);
    const key = slugify(name);
    const { error } = await supabase.from("specializations").insert({
      field_id: fieldId, key, name, description,
      sort_order: (field?.specializations.length ?? 0) * 10,
    });
    if (!error) {
      await fetchAll();
      void logAdminActivity("create", "specialization", null, name, { field: field?.name });
    }
    return { error };
  };

  const updateSpecialization = async (id: string, patch: Partial<Specialization>) => {
    const { error } = await supabase.from("specializations").update(patch as any).eq("id", id);
    if (!error) {
      await fetchAll();
      void logAdminActivity("update", "specialization", id, patch.name);
    }
    return { error };
  };

  const deleteSpecialization = async (id: string) => {
    const { error } = await supabase.from("specializations").delete().eq("id", id);
    if (!error) {
      await fetchAll();
      void logAdminActivity("delete", "specialization", id);
    }
    return { error };
  };

  return {
    fields, loading, fetchAll,
    createField, updateField, deleteField,
    createSpecialization, updateSpecialization, deleteSpecialization,
  };
};
