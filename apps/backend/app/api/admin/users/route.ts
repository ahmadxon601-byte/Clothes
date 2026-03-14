import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, paginate, AuthError } from "@/src/lib/auth";
import { logAction } from "@/src/lib/audit";
import bcrypt from "bcryptjs";

// ── GET /api/admin/users ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    requireRole(req, "admin");

    const s = req.nextUrl.searchParams;
    const search = s.get("search")?.trim() || null;
    const role = s.get("role") || null;
    const excludeRole = s.get("exclude_role") || null;
    const { page, limit, offset } = paginate(s.get("page"), s.get("limit"));

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`);
    }
    if (role) {
      params.push(role);
      conditions.push(`role = $${params.length}`);
    }
    if (excludeRole) {
      params.push(excludeRole);
      conditions.push(`role <> $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query(
      `SELECT COUNT(*) FROM users ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    // Try with ban columns; fall back if migration 005 hasn't been run yet
    let dataResult;
    try {
      dataResult = await query(
        `SELECT id, name, email, role, is_banned, ban_reason, created_at
         FROM users ${where}
         ORDER BY created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
    } catch (colErr: unknown) {
      const code = (colErr as { code?: string })?.code;
      if (code === "42703") {
        // Column doesn't exist yet — return defaults until migration runs
        dataResult = await query(
          `SELECT id, name, email, role, FALSE as is_banned, NULL as ban_reason, created_at
           FROM users ${where}
           ORDER BY created_at DESC
           LIMIT $${params.length - 1} OFFSET $${params.length}`,
          params
        );
      } else throw colErr;
    }

    return ok({
      users: dataResult.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/users GET]", e);
    return fail("Internal server error", 500);
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["user", "seller", "admin"]).default("user"),
});

// ── POST /api/admin/users ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const admin = requireRole(req, "admin");
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const { name, email, password, role } = parsed.data;
    const hash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, hash, role]
    );

    logAction({ admin, action: "create", entity: "user", entityId: result.rows[0].id, details: { name, email, role } });
    return ok({ user: result.rows[0] }, 201);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    const code = (e as { code?: string })?.code;
    if (code === "23505") return fail("Bu email allaqachon ro'yxatdan o'tgan", 409);
    console.error("[admin/users POST]", e);
    return fail("Internal server error", 500);
  }
}
