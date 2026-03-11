import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, paginate, AuthError } from "@/src/lib/auth";
import { logAction } from "@/src/lib/audit";
import { emitAdminEvent } from "@/src/lib/events";

const bannerSchema = z.object({
  title: z.string().min(1).max(255),
  is_active: z.boolean().optional().default(true),
  product_ids: z.array(z.string().uuid()).max(10, "Maximum 10 products per banner"),
});

// ── GET /api/admin/banners ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const admin = requireRole(req, "admin");
    const s = req.nextUrl.searchParams;
    const { page, limit, offset } = paginate(s.get("page"), s.get("limit"));

    const countResult = await query("SELECT COUNT(*) FROM banners");
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await query(
      `SELECT
         b.id, b.title, b.is_active, b.product_ids, b.created_at, b.updated_at,
         COALESCE(
           (SELECT json_agg(json_build_object('id', p.id, 'name', p.name, 'price', p.base_price))
            FROM products p WHERE p.id = ANY(b.product_ids)),
           '[]'
         ) AS products
       FROM banners b
       ORDER BY b.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return ok({
      banners: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/banners GET]", e);
    return fail("Internal server error", 500);
  }
}

// ── POST /api/admin/banners ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const admin = requireRole(req, "admin");

    const body = await req.json();
    const parsed = bannerSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const { title, is_active, product_ids } = parsed.data;

    const { rows } = await query(
      `INSERT INTO banners (title, is_active, product_ids)
       VALUES ($1, $2, $3::uuid[])
       RETURNING id, title, is_active, product_ids, created_at, updated_at`,
      [title, is_active, product_ids]
    );

    const banner = rows[0];
    logAction({ admin, action: "create", entity: "banner", entityId: banner.id, details: { title } });
    emitAdminEvent({ type: "banners", action: "created" });

    return ok({ banner }, 201);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/banners POST]", e);
    return fail("Internal server error", 500);
  }
}
