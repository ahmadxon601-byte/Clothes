import { NextRequest } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";
import { enforceRateLimit } from "@/src/lib/rateLimit";
import {
  ensureUploadsDirWritable,
  getUploadAbsolutePathFromUrl,
  getUploadPublicUrl,
  getUploadsDir,
  isUploadStorageError,
} from "@/src/lib/uploadStorage";

const MAX_UPLOAD_SIZE = 4 * 1024 * 1024;
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function detectImageExtension(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  if (buffer.length >= 6) {
    const signature = buffer.subarray(0, 6).toString("ascii");
    if (signature === "GIF87a" || signature === "GIF89a") {
      return "gif";
    }
  }

  return null;
}

// ── POST /api/upload ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforceRateLimit({ key: `upload:${user.userId}`, limit: 30, windowMs: 60_000 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return fail("No file provided", 400);

    if (file.size > MAX_UPLOAD_SIZE) return fail("File too large (max 4MB)", 400);

    const expectedExt = MIME_TO_EXT[file.type];
    if (!expectedExt) return fail("Only images allowed", 400);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const detectedExt = detectImageExtension(buffer);
    if (!detectedExt || detectedExt !== expectedExt) {
      return fail("Invalid image file", 400);
    }

    const uploadDir = await ensureUploadsDirWritable();

    const filename = `${user.userId}_${randomUUID()}.${detectedExt}`;
    await writeFile(path.join(uploadDir, filename), buffer);

    return ok({ url: getUploadPublicUrl(filename) });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    if (e instanceof Error && e.message.startsWith("RATE_LIMIT:")) {
      return fail("Too many uploads. Please try again later.", 429);
    }
    if (isUploadStorageError(e)) {
      return fail("Upload storage is not writable. Mount a persistent writable volume at public/uploads.", 503);
    }
    console.error("[upload POST]", e);
    return fail("Internal server error", 500);
  }
}

// ── DELETE /api/upload ────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const user = requireAuth(req);

    const body = (await req.json().catch(() => null)) as { url?: unknown } | null;
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    if (!url) return fail("url required", 400);

    const cleanUrl = url.split("#")[0].split("?")[0];
    if (!cleanUrl.startsWith("/uploads/")) return fail("Only /uploads files can be deleted", 400);

    const uploadsRoot = getUploadsDir();
    const absolutePath = getUploadAbsolutePathFromUrl(cleanUrl);
    const inUploadsDir =
      absolutePath === uploadsRoot || absolutePath.startsWith(`${uploadsRoot}${path.sep}`);
    if (!inUploadsDir) return fail("Invalid upload path", 400);

    const baseName = path.basename(absolutePath);
    const ownerPrefix = baseName.split("_")[0]?.trim();
    if (user.role !== "admin" && ownerPrefix !== user.userId) {
      return fail("You can only delete your own uploads", 403);
    }

    try {
      await unlink(absolutePath);
    } catch {
      // Ignore missing files and keep delete idempotent.
    }

    return ok({ deleted: true });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[upload DELETE]", e);
    return fail("Internal server error", 500);
  }
}
