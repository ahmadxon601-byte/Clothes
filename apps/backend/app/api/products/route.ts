import { NextRequest } from "next/server";
import { z } from "zod";
import pool, { query } from "@/src/lib/db";
import { ok, fail, requireRole, paginate, AuthError } from "@/src/lib/auth";
import { emitAdminEvent } from "@/src/lib/events";

// ── GET /api/products ────────────────────────────────────────────────────────
// Query params: sort (newest|popular), category, search, store_id, page, limit
export async function GET(req: NextRequest) {
  try {
    const s = req.nextUrl.searchParams;
    const sort = s.get("sort") === "popular" ? "popular" : "newest";
    const categoryId = s.get("category");
    const storeId = s.get("store_id");
    const search = s.get("search")?.trim() || null;
    const { page, limit, offset } = paginate(s.get("page"), s.get("limit"));

    const conditions: string[] = ["p.is_active = TRUE", "st.is_active = TRUE"];
    const params: unknown[] = [];

    if (categoryId) {
      params.push(categoryId);
      conditions.push(`p.category_id = $${params.length}`);
    }
    if (storeId) {
      params.push(storeId);
      conditions.push(`p.store_id = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(p.name ILIKE $${idx} OR p.description ILIKE $${idx})`);
    }

    const where = conditions.join(" AND ");
    const orderBy =
      sort === "popular" ? "p.views DESC, p.created_at DESC" : "p.created_at DESC";

    // total count
    const countResult = await query(
      `SELECT COUNT(*) FROM products p
       JOIN stores st ON st.id = p.store_id
       WHERE ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // data
    params.push(limit, offset);
    const dataResult = await query(
      `SELECT
         p.id, p.name, p.base_price, p.sku, p.views, p.created_at,
         c.id AS category_id, c.name AS category_name,
         st.id AS store_id, st.name AS store_name,
         (SELECT pi.url FROM product_images pi
          WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS thumbnail
       FROM products p
       LEFT JOIN categories c  ON c.id  = p.category_id
       JOIN  stores st          ON st.id = p.store_id
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return ok({
      products: dataResult.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error("[products GET]", e);
    return fail("Internal server error", 500);
  }
}

// ── POST /api/products  (seller only) ────────────────────────────────────────
const variantSchema = z.object({
  size: z.string().max(20).optional(),
  color: z.string().max(50).optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
});

const createSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().optional(),
  base_price: z.number().positive(),
  category_id: z.string().uuid().optional(),
  store_id: z.string().uuid().optional(),
  images: z
    .array(z.object({ url: z.string().min(1), sort_order: z.number().int().min(0) }))
    .optional(),
  variants: z.array(variantSchema).optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      address: z.string().optional(),
    })
    .optional(),
});

function genProductSku(categorySlug?: string): string {
  const prefix = (categorySlug ?? "PRD").slice(0, 3).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ts = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}-${random}-${ts}`;
}

function genVariantSku(productSku: string, size?: string, color?: string): string {
  const s = (size ?? "UNI").slice(0, 3).toUpperCase();
  const c = (color ?? "STD").slice(0, 3).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${productSku}-${s}-${c}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const jwtUser = requireRole(req, "seller", "admin");

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.errors[0].message, 422);
    }

    const { name, description, base_price, category_id, store_id, images, variants, location } =
      parsed.data;

    // Find store owned by this seller
    let storeId: string;
    if (store_id) {
      const own = await query(
        "SELECT id FROM stores WHERE id = $1 AND owner_id = $2 AND is_active = TRUE",
        [store_id, jwtUser.userId]
      );
      if (own.rows.length === 0) return fail("Store not found or not yours", 403);
      storeId = store_id;
    } else {
      const storeResult = await query(
        "SELECT id FROM stores WHERE owner_id = $1 AND is_active = TRUE LIMIT 1",
        [jwtUser.userId]
      );
      if (storeResult.rows.length === 0) return fail("You do not have an active store", 403);
      storeId = storeResult.rows[0].id;
    }

    // Resolve category slug for SKU prefix
    let categorySlug: string | undefined;
    if (category_id) {
      const catResult = await query(
        "SELECT slug FROM categories WHERE id = $1",
        [category_id]
      );
      categorySlug = catResult.rows[0]?.slug;
    }

    const sku = genProductSku(categorySlug);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert product
      const productResult = await client.query(
        `INSERT INTO products (store_id, category_id, name, description, base_price, sku)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [storeId, category_id ?? null, name, description ?? null, base_price, sku]
      );
      const product = productResult.rows[0];

      // Insert images
      if (images?.length) {
        for (const img of images) {
          await client.query(
            "INSERT INTO product_images (product_id, url, sort_order) VALUES ($1, $2, $3)",
            [product.id, img.url, img.sort_order]
          );
        }
      }

      // Insert variants
      if (variants?.length) {
        for (const v of variants) {
          const vSku = genVariantSku(sku, v.size, v.color);
          await client.query(
            `INSERT INTO product_variants (product_id, size, color, price, stock, sku)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [product.id, v.size ?? null, v.color ?? null, v.price, v.stock, vSku]
          );
        }
      }

      // Insert location
      if (location) {
        await client.query(
          `INSERT INTO product_locations (product_id, latitude, longitude, address)
           VALUES ($1, $2, $3, $4)`,
          [product.id, location.latitude, location.longitude, location.address ?? null]
        );
      }

      await client.query("COMMIT");
      emitAdminEvent({ type: "products", action: "created" });
      return ok({ product }, 201);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[products POST]", e);
    return fail("Internal server error", 500);
  }
}
