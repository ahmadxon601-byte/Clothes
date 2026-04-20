import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";
import { logAction } from "@/src/lib/audit";
import { emitAdminEvent } from "@/src/lib/events";
import { cleanupOrphanedUploads } from "@/src/lib/uploadCleanup";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  is_active: z.boolean().optional(),
  show_on_home: z.boolean().optional(),
  image_url: z.string().trim().nullish(),
});

// ── PUT /api/admin/banners/[id] ───────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = requireRole(req, "admin");
    const { id } = await params;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const fields: string[] = [];
    const vals: unknown[] = [];

    if (parsed.data.title !== undefined) {
      vals.push(parsed.data.title);
      fields.push(`title = $${vals.length}`);
    }
    if (parsed.data.is_active !== undefined) {
      vals.push(parsed.data.is_active);
      fields.push(`is_active = $${vals.length}`);
    }
    if (parsed.data.show_on_home !== undefined) {
      vals.push(parsed.data.show_on_home);
      fields.push(`show_on_home = $${vals.length}`);
    }
    if (parsed.data.image_url !== undefined) {
      vals.push(parsed.data.image_url || null);
      fields.push(`image_url = $${vals.length}`);
    }
    if (fields.length === 0) return fail("No fields to update", 422);

    fields.push(`updated_at = NOW()`);
    vals.push(id);

    const { rows } = await query(
      `UPDATE banners SET ${fields.join(", ")}
       WHERE id = $${vals.length}
       RETURNING id, title, is_active, show_on_home, image_url, created_at, updated_at`,
      vals
    );

    if (rows.length === 0) return fail("Banner not found", 404);
    logAction({ admin, action: "update", entity: "banner", entityId: id, details: parsed.data });
    emitAdminEvent({ type: "banners", action: "updated" });
    await cleanupOrphanedUploads();

    return ok({ banner: rows[0] });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/banners PUT]", e);
    return fail("Internal server error", 500);
  }
}

// ── DELETE /api/admin/banners/[id] ────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = requireRole(req, "admin");
    const { id } = await params;

    const { rows } = await query(
      "DELETE FROM banners WHERE id = $1 RETURNING id, title",
      [id]
    );
    if (rows.length === 0) return fail("Banner not found", 404);

    logAction({ admin, action: "delete", entity: "banner", entityId: id, details: { title: rows[0].title } });
    emitAdminEvent({ type: "banners", action: "deleted" });
    await cleanupOrphanedUploads(true);
    return ok({ message: "Banner deleted" });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/banners DELETE]", e);
    return fail("Internal server error", 500);
  }
}
