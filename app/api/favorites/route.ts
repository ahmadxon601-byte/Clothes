import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";
import { getUiSetting } from "@/src/lib/uiSettings";
import {
  MARKETING_CAMPAIGNS_SETTING_KEY,
  parseMarketingCampaigns,
  resolveProductSalePrice,
} from "@/src/shared/lib/marketingCampaigns";

// GET /api/favorites — list favorites
export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);

    const { rows } = await query(
      `SELECT f.id, f.product_id, f.created_at,
              p.name AS title, p.base_price,
              p.marketing_campaign_id,
              (SELECT pi.url FROM product_images pi
               WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS image_url,
              (SELECT MIN(pv.price) FROM product_variants pv
               WHERE pv.product_id = p.id) AS sale_price,
              s.name AS brand
       FROM favorites f
       JOIN products p ON p.id = f.product_id
       JOIN stores   s ON s.id = p.store_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [user.userId]
    );

    const rawCampaigns = await getUiSetting(MARKETING_CAMPAIGNS_SETTING_KEY);
    const campaigns = parseMarketingCampaigns(rawCampaigns);

    return ok(
      rows.map((row) => {
        const campaign =
          typeof row.marketing_campaign_id === "string"
            ? campaigns.find((item) => item.id === row.marketing_campaign_id) ?? null
            : null;

        return {
          ...row,
          sale_price: resolveProductSalePrice(row.base_price, row.sale_price, campaign),
        };
      })
    );
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    return fail("Server error", 500);
  }
}

// POST /api/favorites — toggle (body: { product_id })
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { product_id } = await req.json();
    if (!product_id) return fail("product_id is required");

    const {
      rows: [existing],
    } = await query(
      `SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2`,
      [user.userId, product_id]
    );

    if (existing) {
      await query(`DELETE FROM favorites WHERE id = $1`, [existing.id]);
      return ok({ favorited: false });
    } else {
      await query(
        `INSERT INTO favorites (user_id, product_id) VALUES ($1, $2)`,
        [user.userId, product_id]
      );
      return ok({ favorited: true }, 201);
    }
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    return fail("Server error", 500);
  }
}
