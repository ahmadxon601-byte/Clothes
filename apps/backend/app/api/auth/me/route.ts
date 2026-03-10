import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";
import { logAction } from "@/src/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const jwtUser = requireAuth(req);

    const result = await query(
      "SELECT id, name, email, role, phone, telegram_id, created_at FROM users WHERE id = $1",
      [jwtUser.userId]
    );

    if (result.rows.length === 0) {
      return fail("User not found", 404);
    }

    return ok(result.rows[0]);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[me GET]", e);
    return fail("Internal server error", 500);
  }
}

const updateSchema = z
  .object({
    name: z.string().min(2).max(255).optional(),
    email: z.string().email().max(255).optional(),
  })
  .refine((d) => d.name !== undefined || d.email !== undefined, {
    message: "Kamida bitta maydon talab qilinadi",
  });

export async function PATCH(req: NextRequest) {
  try {
    const jwtUser = requireAuth(req);
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const sets: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    if (parsed.data.name !== undefined) { sets.push(`name = $${i++}`); values.push(parsed.data.name); }
    if (parsed.data.email !== undefined) { sets.push(`email = $${i++}`); values.push(parsed.data.email); }
    sets.push(`updated_at = NOW()`);
    values.push(jwtUser.userId);

    const result = await query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = $${i} RETURNING id, name, email, role, created_at`,
      values
    );

    if (result.rows.length === 0) return fail("User not found", 404);
    logAction({ admin: jwtUser, action: "update_profile", entity: "user", entityId: jwtUser.userId, details: parsed.data });
    return ok(result.rows[0]);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    if ((e as any)?.code === "23505") return fail("Bu email allaqachon ro'yxatdan o'tgan", 409);
    console.error("[me PATCH]", e);
    return fail("Internal server error", 500);
  }
}
