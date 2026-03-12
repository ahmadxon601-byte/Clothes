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

    const maxSize = 4 * 1024 * 1024; // 4MB (safer for serverless limits)
    if (file.size > maxSize) return fail("File too large (max 4MB)", 400);

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) return fail("Only images allowed", 400);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mime = file.type || "image/jpeg";

    // In Vercel serverless, writing under /public is not reliable for persistent assets.
    // Return a data URL so images still work without external object storage.
    if (process.env.VERCEL === "1") {
      return ok({ url: `data:${mime};base64,${buffer.toString("base64")}` });
    }

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
