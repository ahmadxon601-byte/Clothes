import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, paginate } from "@/src/lib/auth";
import { getUiSetting } from "@/src/lib/uiSettings";
import {
  MARKETING_CAMPAIGNS_SETTING_KEY,
  parseMarketingCampaigns,
  resolveProductSalePrice,
} from "@/src/shared/lib/marketingCampaigns";

type Params = { params: Promise<{ id: string }> };

// ── GET /api/stores/[id]/products ─────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id: storeId } = await params;
    const s = req.nextUrl.searchParams;
    const sort = s.get("sort") === "popular" ? "popular" : "newest";
    const { page, limit, offset } = paginate(s.get("page"), s.get("limit"));

    const orderBy =
      sort === "popular" ? "p.views DESC, p.created_at DESC" : "p.created_at DESC";

    const countResult = await query(
      "SELECT COUNT(*) FROM products p WHERE p.store_id = $1 AND p.is_active = TRUE",
      [storeId]
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await query(
      `SELECT
         p.id, p.name, p.base_price, p.sku, p.views, p.created_at, p.marketing_campaign_id,
         c.id AS category_id, c.name AS category_name,
         (SELECT MIN(pv.price) FROM product_variants pv
          WHERE pv.product_id = p.id) AS sale_price,
         (SELECT pi.url FROM product_images pi
          WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS thumbnail
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.store_id = $1 AND p.is_active = TRUE
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [storeId, limit, offset]
    );

    const rawCampaigns = await getUiSetting(MARKETING_CAMPAIGNS_SETTING_KEY);
    const campaigns = parseMarketingCampaigns(rawCampaigns);
    const products = dataResult.rows.map((row) => {
      const campaign =
        typeof row.marketing_campaign_id === "string"
          ? campaigns.find((item) => item.id === row.marketing_campaign_id) ?? null
          : null;

      return {
        ...row,
        sale_price: resolveProductSalePrice(row.base_price, row.sale_price, campaign),
      };
    });

    return ok({
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error("[store products GET]", e);
    return fail("Internal server error", 500);
  }
}
