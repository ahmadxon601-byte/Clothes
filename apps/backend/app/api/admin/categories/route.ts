import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";
import { logAction } from "@/src/lib/audit";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, hyphens"),
});

// ── POST /api/admin/categories ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const admin = requireRole(req, "admin");
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const result = await query(
      `INSERT INTO categories (name, slug) VALUES ($1, $2)
       RETURNING id, name, slug, created_at`,
      [parsed.data.name, parsed.data.slug]
    );
    logAction({ admin, action: "create", entity: "category", entityId: result.rows[0].id, details: parsed.data });
    return ok({ category: result.rows[0] }, 201);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    const code = (e as { code?: string })?.code;
    if (code === "23505") return fail("Bu slug allaqachon mavjud", 409);
    console.error("[admin/categories POST]", e);
    return fail("Internal server error", 500);
  }
}
