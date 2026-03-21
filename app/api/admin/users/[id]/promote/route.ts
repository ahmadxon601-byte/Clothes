import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";
import { logAction } from "@/src/lib/audit";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  login: z.string().min(2).max(255),
  password: z.string().min(6),
});

// POST /api/admin/users/[id]/promote
// Mavjud userni adminga o'tkazadi va login/parol o'rnatadi
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const admin = requireRole(req, "admin");
    const { id } = await params;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const { login, password } = parsed.data;

    // Login (name) boshqa adminlarda band emasligini tekshirish
    const existing = await query(
      "SELECT id FROM users WHERE name = $1 AND id != $2",
      [login, id]
    );
    if (existing.rows.length > 0) return fail("Bu login allaqachon band", 409);

    const hash = await bcrypt.hash(password, 10);

    const result = await query(
      `UPDATE users
       SET role = 'admin', name = $1, password_hash = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, role, created_at`,
      [login, hash, id]
    );

    if (result.rows.length === 0) return fail("User not found", 404);
    logAction({ admin, action: "promote", entity: "user", entityId: id, details: { login, role: "admin" } });
    return ok({ user: result.rows[0] });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[users/promote]", e);
    return fail("Internal server error", 500);
  }
}
