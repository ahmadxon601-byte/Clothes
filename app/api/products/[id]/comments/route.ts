import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, paginate, AuthError } from "@/src/lib/auth";

type Params = { params: Promise<{ id: string }> };

// ── GET /api/products/[id]/comments ──────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id: productId } = await params;
    const s = req.nextUrl.searchParams;
    const { page, limit, offset } = paginate(s.get("page"), s.get("limit"));

    const countResult = await query(
      "SELECT COUNT(*) FROM comments WHERE product_id = $1",
      [productId]
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await query(
      `SELECT c.id, c.text, c.created_at,
              u.id AS user_id, u.name AS user_name
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.product_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset]
    );

    return ok({
      comments: dataResult.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error("[comments GET]", e);
    return fail("Internal server error", 500);
  }
}

// ── POST /api/products/[id]/comments  (auth required) ────────────────────────
const schema = z.object({ text: z.string().min(1).max(2000) });

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const jwtUser = requireAuth(req);
    const { id: productId } = await params;

    // Check product exists
    const prod = await query("SELECT id FROM products WHERE id = $1 AND is_active = TRUE", [
      productId,
    ]);
    if (prod.rows.length === 0) return fail("Product not found", 404);

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const result = await query(
      `INSERT INTO comments (product_id, user_id, text)
       VALUES ($1, $2, $3)
       RETURNING id, text, created_at`,
      [productId, jwtUser.userId, parsed.data.text]
    );

    return ok({ comment: result.rows[0] }, 201);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[comments POST]", e);
    return fail("Internal server error", 500);
  }
}
