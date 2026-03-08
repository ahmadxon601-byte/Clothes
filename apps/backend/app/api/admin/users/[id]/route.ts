import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";
import { emitAdminEvent } from "@/src/lib/events";
import { logAction } from "@/src/lib/audit";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  role: z.enum(["user", "seller", "admin"]).optional(),
  name: z.string().min(2).max(255).optional(),
  is_banned: z.boolean().optional(),
  reason: z.string().optional(),
});

// ── PATCH /api/admin/users/[id] ───────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = requireRole(req, "admin");
    const { id } = await params;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const fields: string[] = [];
    const vals: unknown[] = [];

    if (parsed.data.role !== undefined) {
      vals.push(parsed.data.role);
      fields.push(`role = $${vals.length}`);
    }
    if (parsed.data.name !== undefined) {
      vals.push(parsed.data.name);
      fields.push(`name = $${vals.length}`);
    }
    if (parsed.data.is_banned !== undefined) {
      vals.push(parsed.data.is_banned);
      fields.push(`is_banned = $${vals.length}`);
      if (parsed.data.reason !== undefined) {
        vals.push(parsed.data.is_banned ? (parsed.data.reason || null) : null);
        fields.push(`ban_reason = $${vals.length}`);
      }
    }
    if (fields.length === 0) return fail("No fields to update", 422);

    fields.push(`updated_at = NOW()`);
    vals.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(", ")}
       WHERE id = $${vals.length}
       RETURNING id, name, email, role, is_banned, ban_reason, created_at`,
      vals
    );

    if (result.rows.length === 0) return fail("User not found", 404);
    const action = parsed.data.is_banned !== undefined
      ? (parsed.data.is_banned ? "ban" : "unban")
      : "update";
    logAction({ admin, action, entity: "user", entityId: id, details: parsed.data });
    emitAdminEvent({ type: "users", action: "updated" });
    return ok({ user: result.rows[0] });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/users PATCH]", e);
    return fail("Internal server error", 500);
  }
}

// ── DELETE /api/admin/users/[id] ──────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = requireRole(req, "admin");
    const { id } = await params;

    const result = await query(
      "DELETE FROM users WHERE id = $1 RETURNING id, name, email",
      [id]
    );
    if (result.rows.length === 0) return fail("User not found", 404);
    emitAdminEvent({ type: "users", action: "deleted" });
    logAction({ admin, action: "delete", entity: "user", entityId: id, details: { name: result.rows[0].name, email: result.rows[0].email } });
    return ok({ message: "User deleted" });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/users DELETE]", e);
    return fail("Internal server error", 500);
  }
}
