import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";

// ── POST /api/upload ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    requireAuth(req);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return fail("No file provided", 400);

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) return fail("File too large (max 5MB)", 400);

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) return fail("Only images allowed", 400);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `${randomUUID()}.${ext}`;
    await writeFile(path.join(uploadDir, filename), buffer);

    // Return URL that goes through web frontend proxy
    return ok({ url: `/uploads/${filename}` });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[upload POST]", e);
    return fail("Internal server error", 500);
  }
}
