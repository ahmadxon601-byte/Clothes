import { access, mkdir } from "fs/promises";
import { constants as fsConstants } from "fs";
import path from "path";

const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export function getUploadsDir() {
  return PUBLIC_UPLOADS_DIR;
}

export function getUploadPublicUrl(filename: string) {
  return `/uploads/${filename}`;
}

export function getUploadAbsolutePathFromUrl(url: string) {
  const cleanUrl = url.split("#")[0].split("?")[0];
  const relativePath = cleanUrl.replace(/^\/+/, "");
  return path.resolve(process.cwd(), "public", relativePath);
}

export async function ensureUploadsDirWritable() {
  const uploadsDir = getUploadsDir();
  await mkdir(uploadsDir, { recursive: true });
  await access(uploadsDir, fsConstants.W_OK);
  return uploadsDir;
}

export function isUploadStorageError(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  const code = String((error as NodeJS.ErrnoException).code ?? "");
  return ["EACCES", "EPERM", "EROFS", "ENOSPC"].includes(code);
}
