import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, paginate, AuthError } from "@/src/lib/auth";
import { logAction } from "@/src/lib/audit";
import { emitAdminEvent } from "@/src/lib/events";

const bannerSchema = z.object({
  title: z.string().min(1).max(255),
  is_active: z.boolean().optional().default(true),
  show_on_home: z.boolean().optional().default(true),
  image_url: z.string().trim().nullish(),
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
         b.id, b.title, b.is_active, b.show_on_home, b.image_url, b.created_at, b.updated_at
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

    const { title, is_active, show_on_home, image_url } = parsed.data;

    const { rows } = await query(
      `INSERT INTO banners (title, is_active, show_on_home, image_url, product_ids)
       VALUES ($1, $2, $3, $4, $5::uuid[])
       RETURNING id, title, is_active, show_on_home, image_url, created_at, updated_at`,
      [title, is_active, show_on_home, image_url || null, []]
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
