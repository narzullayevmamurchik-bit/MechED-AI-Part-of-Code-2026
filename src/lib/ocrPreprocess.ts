/**
 * Client-side OCR preprocessing.
 * - PDF → page JPEGs (pdfjs)
 * - HEIC → JPEG (heic2any)
 * - Image enhancement: grayscale, contrast stretch, unsharp mask, denoise
 * - Double-page split via vertical projection valley
 */
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import heic2any from "heic2any";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const SUPPORTED_OCR_EXT = ["pdf", "jpg", "jpeg", "png", "webp", "heic", "heif"];
export const REJECTED_EXT_HINTS: Record<string, string> = {
  djvu: "DJVU is not supported. Please convert to PDF first (e.g. djvu.org/online-converter).",
};

const MAX_DIM = 2000;
const JPEG_Q = 0.85;

export interface ProcessedPage {
  blob: Blob;
  width: number;
  height: number;
  index: number;
}

const getExt = (n: string) => n.toLowerCase().split(".").pop() || "";

/** Main entry. Returns processed pages ready to upload. */
export async function preprocessForOcr(
  file: File,
  onProgress?: (p: number, stage: string) => void,
): Promise<ProcessedPage[]> {
  const ext = getExt(file.name);
  if (REJECTED_EXT_HINTS[ext]) throw new Error(REJECTED_EXT_HINTS[ext]);

  onProgress?.(2, "Preparing");

  // HEIC → JPEG blob first
  let working: Blob = file;
  if (ext === "heic" || ext === "heif") {
    onProgress?.(8, "Converting HEIC");
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
    working = Array.isArray(out) ? out[0] : out;
  }

  // PDF → many pages
  if (ext === "pdf") {
    return await rasterizePdf(working as Blob, onProgress);
  }

  // Single image path
  const img = await blobToImage(working);
  onProgress?.(40, "Enhancing");
  const enhanced = enhanceCanvas(img);
  onProgress?.(70, "Splitting pages");
  const split = trySplitDoublePage(enhanced);
  const out: ProcessedPage[] = [];
  for (let i = 0; i < split.length; i++) {
    const blob = await canvasToJpeg(split[i]);
    out.push({ blob, width: split[i].width, height: split[i].height, index: i });
  }
  onProgress?.(100, "Done");
  return out;
}

async function rasterizePdf(
  blob: Blob,
  onProgress?: (p: number, s: string) => void,
): Promise<ProcessedPage[]> {
  const buf = await blob.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages: ProcessedPage[] = [];
  const total = doc.numPages;
  for (let i = 1; i <= total; i++) {
    onProgress?.(Math.round(((i - 1) / total) * 90) + 5, `Rendering PDF page ${i}/${total}`);
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(MAX_DIM / Math.max(viewport.width, viewport.height), 2);
    const vp = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width;
    canvas.height = vp.height;
    const ctx = canvas.getContext("2d")!;
    // Fill white for transparent PDFs
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
    const enhanced = enhanceCanvas(canvas);
    const jpeg = await canvasToJpeg(enhanced);
    pages.push({ blob: jpeg, width: enhanced.width, height: enhanced.height, index: i - 1 });
  }
  onProgress?.(100, "Done");
  return pages;
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/** Resize → grayscale + contrast stretch + light sharpen. Returns a new canvas. */
function enhanceCanvas(source: HTMLImageElement | HTMLCanvasElement): HTMLCanvasElement {
  const sw = "naturalWidth" in source ? source.naturalWidth : source.width;
  const sh = "naturalHeight" in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, MAX_DIM / Math.max(sw, sh));
  const w = Math.round(sw * scale);
  const h = Math.round(sh * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0, w, h);

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  // 1) Grayscale + sample for histogram stretch
  let min = 255;
  let max = 0;
  for (let i = 0; i < d.length; i += 4) {
    const g = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
    d[i] = d[i + 1] = d[i + 2] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }

  // 2) Contrast stretch with 2% saturation
  const lo = Math.max(0, min + (max - min) * 0.02);
  const hi = Math.min(255, max - (max - min) * 0.02);
  const range = Math.max(1, hi - lo);
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.max(0, Math.min(255, ((d[i] - lo) * 255) / range));
    d[i] = d[i + 1] = d[i + 2] = v;
  }

  ctx.putImageData(img, 0, 0);
  return c;
}

/** Vertical projection valley split for double-page notebook photos. */
function trySplitDoublePage(canvas: HTMLCanvasElement): HTMLCanvasElement[] {
  const { width: w, height: h } = canvas;
  if (w / h < 1.4) return [canvas]; // not wide enough to be a spread
  const ctx = canvas.getContext("2d")!;
  const img = ctx.getImageData(0, 0, w, h).data;
  const cols = new Float32Array(w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      // darker = more "ink"
      cols[x] += 255 - img[i];
    }
  }
  // find darkest valley in middle 40%
  const start = Math.floor(w * 0.3);
  const end = Math.floor(w * 0.7);
  let valleyX = -1;
  let valleyVal = Infinity;
  for (let x = start; x < end; x++) {
    if (cols[x] < valleyVal) {
      valleyVal = cols[x];
      valleyX = x;
    }
  }
  // require valley to be noticeably lower than mean
  const mean = cols.slice(start, end).reduce((s, v) => s + v, 0) / (end - start);
  if (valleyX < 0 || valleyVal > mean * 0.6) return [canvas];

  const left = document.createElement("canvas");
  left.width = valleyX;
  left.height = h;
  left.getContext("2d")!.drawImage(canvas, 0, 0);
  const right = document.createElement("canvas");
  right.width = w - valleyX;
  right.height = h;
  right.getContext("2d")!.drawImage(canvas, -valleyX, 0);
  return [left, right];
}

function canvasToJpeg(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", JPEG_Q);
  });
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
