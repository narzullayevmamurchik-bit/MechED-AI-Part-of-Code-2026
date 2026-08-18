/**
 * Helpers for resolving, previewing and downloading resource files.
 * Pure presentation/link utilities — no schema or data mutations.
 */

const INLINE_PREVIEW_EXT = ["pdf", "png", "jpg", "jpeg", "webp", "gif", "svg", "txt", "md", "csv"];

export function isStorageUrl(url: string): boolean {
  return /\/storage\/v1\/object\/(public|sign)\//.test(url);
}

export function getUrlExt(url: string): string {
  try {
    const path = new URL(url, window.location.origin).pathname;
    const m = path.toLowerCase().match(/\.([a-z0-9]+)$/);
    return m ? m[1] : "";
  } catch {
    const m = url.toLowerCase().match(/\.([a-z0-9]+)(?:\?|#|$)/);
    return m ? m[1] : "";
  }
}

/** A direct file link is a storage object or any URL that ends with a file extension. */
export function isDirectFileUrl(url: string): boolean {
  if (!url) return false;
  if (isStorageUrl(url)) return true;
  return getUrlExt(url).length > 0;
}

/** Inline preview only makes sense for direct files of a browser-renderable type. */
export function canPreviewInline(url: string, type?: string): boolean {
  if (!url || !isDirectFileUrl(url)) return false;
  const ext = getUrlExt(url);
  if (ext) return INLINE_PREVIEW_EXT.includes(ext);
  return type === "pdf" || type === "image";
}

/** Force a real download instead of in-browser rendering (Supabase supports ?download=). */
export function buildDownloadUrl(url: string, filename?: string): string {
  if (!url) return url;
  if (!isStorageUrl(url)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}download=${encodeURIComponent(filename || "")}`;
}

export function suggestFilename(title: string, url: string): string {
  const ext = getUrlExt(url);
  const base = (title || "resource").replace(/[^\p{L}\p{N}._ -]+/gu, "").trim() || "resource";
  return ext ? `${base}.${ext}` : base;
}
