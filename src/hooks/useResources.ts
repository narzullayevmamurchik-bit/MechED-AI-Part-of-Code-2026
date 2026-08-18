import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface DbResource {
  id: string;
  title: string;
  subtitle?: string | null;
  description: string;
  type: string;
  category: string;
  category_id: string | null;
  field_id?: string | null;
  specialization_id?: string | null;
  url: string;
  file_path: string | null;
  author: string | null;
  authors?: string[];
  publisher?: string | null;
  edition?: string | null;
  publication_year?: number | null;
  isbn?: string | null;
  doi?: string | null;
  cover_url?: string | null;
  resource_kind?: string;
  file_format?: string | null;
  file_size_bytes?: number | null;
  license?: string | null;
  external_source_url?: string | null;
  access_type?: string;
  is_archived?: boolean;
  is_recommended?: boolean;
  difficulty: string;
  language: string;
  tags: string[];
  thumbnail_url: string | null;
  access_level: "public" | "university" | "premium" | "research";
  status: "draft" | "pending" | "approved" | "rejected";
  submitted_by: string | null;
  is_featured: boolean;
  is_pinned: boolean;
  view_count: number;
  download_count: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface ResourceCategory {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  sort_order: number;
}

export const MAX_UPLOAD_MB = 50;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export const ALLOWED_EXTENSIONS = [
  "pdf", "djvu", "djv", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
  "txt", "csv", "json", "md",
  "png", "jpg", "jpeg", "webp", "gif", "svg",
  "mp4", "mov", "webm", "mp3", "wav",
  "zip", "rar", "7z", "tar", "gz",
  "step", "stp", "igs", "iges", "stl", "dwg", "dxf",
];

export const ACCEPT_ATTR = ALLOWED_EXTENSIONS.map((e) => "." + e).join(",");

export function getExt(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

export type ValidationResult = { ok: true; message?: undefined } | { ok: false; message: string };

export function validateFile(file: File): ValidationResult {
  const ext = getExt(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { ok: false, message: `Unsupported format ".${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}` };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return { ok: false, message: `File too large (${mb} MB). Maximum allowed is ${MAX_UPLOAD_MB} MB.` };
  }
  return { ok: true };
}

export function detectResourceType(file: File): string {
  const ext = getExt(file.name);
  if (ext === "pdf") return "pdf";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) return "image";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["ppt", "pptx"].includes(ext)) return "presentation";
  if (["xls", "xlsx", "csv"].includes(ext)) return "dataset";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  if (["step", "stp", "igs", "iges", "stl", "dwg", "dxf"].includes(ext)) return "cad";
  if (ext === "djvu" || ext === "djv") return "djvu";
  return "link";
}

export function useResources(opts?: { status?: "all" | "approved" | "pending" }) {
  const { user } = useAuth();
  const [resources, setResources] = useState<DbResource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResources = useCallback(async () => {
    try {
      let q = (supabase.from("resources" as any) as any).select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
      if (opts?.status && opts.status !== "all") q = q.eq("status", opts.status);
      const { data, error } = await q;
      if (error) throw error;
      setResources((data as any[] as DbResource[]) || []);
    } catch (e) {
      console.error("Failed to load resources:", e);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [opts?.status]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const createResource = async (data: Partial<DbResource>) => {
    try {
      const payload: any = { ...data };
      if (!payload.submitted_by && user) payload.submitted_by = user.id;
      const { error } = await supabase.from("resources" as any).insert(payload);
      if (error) throw error;
      toast.success(payload.status === "pending" ? "Submitted for review" : "Resource added");
      await fetchResources();
    } catch (e: any) {
      toast.error(e.message || "Failed to create resource");
    }
  };

  const updateResource = async (id: string, data: Partial<DbResource>) => {
    try {
      const { error } = await supabase.from("resources" as any).update(data as any).eq("id", id);
      if (error) throw error;
      toast.success("Resource updated");
      await fetchResources();
    } catch (e: any) {
      toast.error(e.message || "Failed to update resource");
    }
  };

  const deleteResource = async (id: string) => {
    try {
      const { error } = await supabase.from("resources" as any).delete().eq("id", id);
      if (error) throw error;
      toast.success("Resource deleted");
      await fetchResources();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete resource");
    }
  };

  const approveResource = async (id: string) => updateResource(id, { status: "approved", reviewed_at: new Date().toISOString() } as any);
  const rejectResource = async (id: string, reason?: string) => updateResource(id, { status: "rejected", rejection_reason: reason || "", reviewed_at: new Date().toISOString() } as any);

  const uploadFile = async (
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<string | null> => {
    const v = validateFile(file);
    if (!v.ok) { toast.error(v.message); return null; }
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
      const path = `resources/${Date.now()}-${safeName}`;
      const { data: signed, error: signErr } = await supabase
        .storage.from("course-materials").createSignedUploadUrl(path);
      if (signErr || !signed) throw signErr || new Error("Could not get upload URL");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signed.signedUrl, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      const { data } = supabase.storage.from("course-materials").getPublicUrl(path);
      onProgress?.(100);
      return data.publicUrl;
    } catch (e: any) {
      toast.error("Upload failed: " + (e.message || "Unknown error"));
      return null;
    }
  };

  const logView = async (resourceId: string) => {
    try {
      await supabase.from("resource_views" as any).insert({ resource_id: resourceId, user_id: user?.id ?? null });
      setResources((rs) => rs.map((r) => r.id === resourceId ? { ...r, view_count: r.view_count + 1 } : r));
    } catch {}
  };


  const logDownload = async (resourceId: string) => {
    if (!user) return;
    try {
      await supabase.from("resource_downloads" as any).insert({ resource_id: resourceId, user_id: user.id });
      await supabase.from("resources" as any).update({ download_count: (resources.find(r=>r.id===resourceId)?.download_count ?? 0) + 1 } as any).eq("id", resourceId);
      setResources((rs) => rs.map((r) => r.id === resourceId ? { ...r, download_count: r.download_count + 1 } : r));
    } catch {}
  };

  return {
    resources, loading,
    createResource, updateResource, deleteResource,
    approveResource, rejectResource,
    uploadFile, logView, logDownload, refetch: fetchResources,
  };
}

/* ------------ Personal library collections ------------ */
export interface ResourceCollection {
  id: string;
  user_id: string;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export function useResourceCollections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<ResourceCollection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setCollections([]); setLoading(false); return; }
    try {
      const { data, error } = await supabase.from("resource_collections" as any)
        .select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      setCollections((data as any[] as ResourceCollection[]) || []);
    } catch (e) { console.error(e); setCollections([]); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (name: string, description = "", is_public = false) => {
    if (!user) return;
    const { error } = await supabase.from("resource_collections" as any).insert({ name, description, is_public, user_id: user.id } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Collection created");
    await fetch();
  };

  const addItem = async (collection_id: string, resource_id: string) => {
    const { error } = await supabase.from("resource_collection_items" as any).insert({ collection_id, resource_id } as any);
    if (error && !error.message.includes("duplicate")) { toast.error(error.message); return; }
    toast.success("Added to collection");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("resource_collections" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await fetch();
  };

  return { collections, loading, create, addItem, remove, refetch: fetch };
}


export function useResourceCategories() {
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("resource_categories" as any)
        .select("*").order("sort_order").order("name");
      if (error) throw error;
      setCategories((data as any[] as ResourceCategory[]) || []);
    } catch (e) {
      console.error("Failed to load categories:", e);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const createCategory = async (data: Partial<ResourceCategory>) => {
    try {
      const slug = (data.slug || data.name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { error } = await supabase.from("resource_categories" as any).insert({ ...data, slug } as any);
      if (error) throw error;
      toast.success("Category created");
      await fetchCategories();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const updateCategory = async (id: string, data: Partial<ResourceCategory>) => {
    try {
      const { error } = await supabase.from("resource_categories" as any).update(data as any).eq("id", id);
      if (error) throw error;
      toast.success("Category updated");
      await fetchCategories();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from("resource_categories" as any).delete().eq("id", id);
      if (error) throw error;
      toast.success("Category deleted");
      await fetchCategories();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  return { categories, loading, createCategory, updateCategory, deleteCategory, refetch: fetchCategories };
}
