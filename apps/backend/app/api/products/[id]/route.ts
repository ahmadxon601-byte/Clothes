import { NextRequest } from "next/server";
import { z } from "zod";
import pool, { query } from "@/src/lib/db";
import { ok, fail, getUser, requireRole, AuthError } from "@/src/lib/auth";

type Params = { params: Promise<{ id: string }> };

const PRODUCT_DETAIL_SQL = `
  SELECT
    p.*,
    c.id   AS category_id,   c.name AS category_name, c.slug AS category_slug,
    st.id  AS store_id,      st.name AS store_name,
    COALESCE(
      JSON_AGG(DISTINCT jsonb_build_object(
        'id', pi.id, 'url', pi.url, 'sort_order', pi.sort_order
      )) FILTER (WHERE pi.id IS NOT NULL),
      '[]'
    ) AS images,
    COALESCE(
      JSON_AGG(DISTINCT jsonb_build_object(
        'id', pv.id, 'size', pv.size, 'color', pv.color,
        'price', pv.price, 'stock', pv.stock, 'sku', pv.sku
      )) FILTER (WHERE pv.id IS NOT NULL),
      '[]'
    ) AS variants,
    CASE WHEN pl.id IS NOT NULL THEN
      jsonb_build_object(
        'latitude',  pl.latitude,
        'longitude', pl.longitude,
        'address',   pl.address
      )
    ELSE NULL END AS location
  FROM products p
  LEFT JOIN categories c       ON c.id  = p.category_id
  LEFT JOIN stores st           ON st.id = p.store_id
  LEFT JOIN product_images pi   ON pi.product_id = p.id
  LEFT JOIN product_variants pv ON pv.product_id = p.id
  LEFT JOIN product_locations pl ON pl.product_id = p.id
  WHERE p.id = $1
  GROUP BY p.id, c.id, c.name, c.slug, st.id, st.name,
           pl.id, pl.latitude, pl.longitude, pl.address
`;

// ── GET /api/products/[id] ────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // increment views (fire-and-forget)
    query("UPDATE products SET views = views + 1 WHERE id = $1", [id]).catch(
      () => {}
    );

    const result = await query(PRODUCT_DETAIL_SQL, [id]);
    if (result.rows.length === 0) return fail("Product not found", 404);

    return ok({ product: result.rows[0] });
  } catch (e) {
    console.error("[product GET]", e);
    return fail("Internal server error", 500);
  }
}

// ── PUT /api/products/[id]  (seller — own products, or admin) ─────────────────
const updateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().optional(),
  base_price: z.number().positive().optional(),
  category_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
  images: z
    .array(z.object({ url: z.string().min(1), sort_order: z.number().int().min(0) }))
    .optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const jwtUser = requireRole(req, "seller", "admin");
    const { id } = await params;

    // Ownership check for sellers
    if (jwtUser.role === "seller") {
      const own = await query(
        `SELECT p.id FROM products p
         JOIN stores st ON st.id = p.store_id
         WHERE p.id = $1 AND st.owner_id = $2`,
        [id, jwtUser.userId]
      );
      if (own.rows.length === 0) return fail("Forbidden", 403);
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const { images, ...rest } = parsed.data;

    const fields: string[] = [];
    const vals: unknown[] = [];

    for (const [key, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      vals.push(val);
      fields.push(`${key} = $${vals.length}`);
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let product: Record<string, unknown>;
      if (fields.length > 0) {
        fields.push(`updated_at = NOW()`);
        vals.push(id);
        const result = await client.query(
          `UPDATE products SET ${fields.join(", ")} WHERE id = $${vals.length} RETURNING *`,
          vals
        );
        if (result.rows.length === 0) { await client.query("ROLLBACK"); return fail("Product not found", 404); }
        product = result.rows[0];
      } else {
        const result = await client.query("SELECT * FROM products WHERE id = $1", [id]);
        if (result.rows.length === 0) { await client.query("ROLLBACK"); return fail("Product not found", 404); }
        product = result.rows[0];
      }

      if (images !== undefined) {
        await client.query("DELETE FROM product_images WHERE product_id = $1", [id]);
        for (const img of images) {
          await client.query(
            "INSERT INTO product_images (product_id, url, sort_order) VALUES ($1, $2, $3)",
            [id, img.url, img.sort_order]
          );
        }
      }

      await client.query("COMMIT");
      return ok({ product });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[product PUT]", e);
    return fail("Internal server error", 500);
  }
}

// ── DELETE /api/products/[id]  (seller — own, or admin) ──────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const jwtUser = requireRole(req, "seller", "admin");
    const { id } = await params;

    if (jwtUser.role === "seller") {
      const own = await query(
        `SELECT p.id FROM products p
         JOIN stores st ON st.id = p.store_id
         WHERE p.id = $1 AND st.owner_id = $2`,
        [id, jwtUser.userId]
      );
      if (own.rows.length === 0) return fail("Forbidden", 403);
    }

    const result = await query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) return fail("Product not found", 404);

    return ok({ message: "Product deleted" });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[product DELETE]", e);
    return fail("Internal server error", 500);
  }
}
