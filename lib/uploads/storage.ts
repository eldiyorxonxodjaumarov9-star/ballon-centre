import { existsSync, mkdirSync } from "fs";
import path from "path";

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp"]);

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function getUploadRoot(): string {
  const envDir = process.env.UPLOAD_DIR?.trim();
  if (envDir) return path.resolve(envDir);
  return path.join(process.cwd(), "data", "uploads");
}

export function getProductsUploadDir(): string {
  const dir = path.join(getUploadRoot(), "products");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function sanitizeFilename(filename: string): string | null {
  const base = path.basename(filename);
  if (base !== filename || base.includes("..")) return null;
  if (!/^[a-zA-Z0-9._-]+$/.test(base)) return null;
  const ext = base.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXT.has(ext)) return null;
  return base;
}

export function extFromMime(mime: string): "jpg" | "png" | "webp" | null {
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}

export function contentTypeForFilename(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return MIME[ext] ?? null;
}

export function uniqueProductFilename(ext: string): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

export function productMediaUrl(filename: string): string {
  return `/media/products/${filename}`;
}

export function normalizeProductImageUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("/uploads/products/")) {
    return url.replace("/uploads/products/", "/media/products/");
  }
  return url;
}

export function normalizeProductImages(images: string[]): string[] {
  return images.map(normalizeProductImageUrl);
}

export function resolveProductImagePath(filename: string): { filePath: string; contentType: string } | null {
  const safe = sanitizeFilename(filename);
  if (!safe) return null;
  const contentType = contentTypeForFilename(safe);
  if (!contentType) return null;

  const primary = path.join(getProductsUploadDir(), safe);
  if (existsSync(primary)) return { filePath: primary, contentType };

  const legacy = path.join(process.cwd(), "public", "uploads", "products", safe);
  if (existsSync(legacy)) return { filePath: legacy, contentType };

  return null;
}
