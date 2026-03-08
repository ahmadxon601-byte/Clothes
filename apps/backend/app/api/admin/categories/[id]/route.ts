import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";
import { logAction } from "@/src/lib/audit";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
});

// ── PATCH /api/admin/categories/[id] ─────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = requireRole(req, "admin");
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const fields: string[] = [];
    const vals: unknown[] = [];

    if (parsed.data.name) { vals.push(parsed.data.name); fields.push(`name = $${vals.length}`); }
    if (parsed.data.slug) { vals.push(parsed.data.slug); fields.push(`slug = $${vals.length}`); }
    if (!fields.length) return fail("No fields to update", 422);

    vals.push(id);
    const result = await query(
      `UPDATE categories SET ${fields.join(", ")} WHERE id = $${vals.length}
       RETURNING id, name, slug, created_at`,
      vals
    );
    if (result.rows.length === 0) return fail("Category not found", 404);
    logAction({ admin, action: "update", entity: "category", entityId: id, details: parsed.data });
    return ok({ category: result.rows[0] });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    const code = (e as { code?: string })?.code;
    if (code === "23505") return fail("Bu slug allaqachon mavjud", 409);
    console.error("[admin/categories PATCH]", e);
    return fail("Internal server error", 500);
  }
}

// ── DELETE /api/admin/categories/[id] ────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = requireRole(req, "admin");
    const { id } = await params;
    const result = await query(
      "DELETE FROM categories WHERE id = $1 RETURNING id, name",
      [id]
    );
    if (result.rows.length === 0) return fail("Category not found", 404);
    logAction({ admin, action: "delete", entity: "category", entityId: id, details: { name: result.rows[0].name } });
    return ok({ message: "Deleted" });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/categories DELETE]", e);
    return fail("Internal server error", 500);
  }
}
