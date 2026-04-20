import { NextRequest } from "next/server";
import { ok, fail } from "@/src/lib/auth";
import { query } from "@/src/lib/db";
import { ensureDailyDealTables } from "@/src/lib/dailyDeals";
import { getUiSetting } from "@/src/lib/uiSettings";
import {
  MARKETING_CAMPAIGNS_SETTING_KEY,
  parseMarketingCampaigns,
  resolveProductSalePrice,
} from "@/src/shared/lib/marketingCampaigns";

export async function GET(_req: NextRequest) {
  try {
    await ensureDailyDealTables();
    const result = await query(
      `
      SELECT
        p.id, p.name, p.base_price, p.sku, p.views, p.created_at, p.marketing_campaign_id,
        c.id AS category_id, c.name AS category_name,
        st.id AS store_id, st.name AS store_name,
        (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS thumbnail,
        (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id) AS sale_price
      FROM daily_deal_campaigns dc
      JOIN daily_deal_invites di ON di.campaign_id = dc.id AND di.status = 'accepted'
      JOIN daily_deal_items ddi ON ddi.invite_id = di.id
      JOIN products p ON p.id = ddi.product_id
      JOIN stores st ON st.id = p.store_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE dc.status = 'active'
        AND NOW() BETWEEN dc.starts_at AND dc.ends_at
        AND p.is_active = TRUE
        AND st.is_active = TRUE
      GROUP BY p.id, c.id, c.name, st.id, st.name
      ORDER BY MAX(dc.created_at) DESC, p.created_at DESC
      LIMIT 12
      `
    );
    const expiresResult = await query(
      `
      SELECT MIN(dc.ends_at) AS expires_at
      FROM daily_deal_campaigns dc
      JOIN daily_deal_invites di ON di.campaign_id = dc.id AND di.status = 'accepted'
      JOIN daily_deal_items ddi ON ddi.invite_id = di.id
      JOIN products p ON p.id = ddi.product_id
      JOIN stores st ON st.id = p.store_id
      WHERE dc.status = 'active'
        AND NOW() BETWEEN dc.starts_at AND dc.ends_at
        AND p.is_active = TRUE
        AND st.is_active = TRUE
      `
    );
    const rawCampaigns = await getUiSetting(MARKETING_CAMPAIGNS_SETTING_KEY);
    const campaigns = parseMarketingCampaigns(rawCampaigns);
    const products = result.rows.map((row) => {
      const campaign =
        typeof row.marketing_campaign_id === "string"
          ? campaigns.find((item) => item.id === row.marketing_campaign_id) ?? null
          : null;

      return {
        ...row,
        sale_price: resolveProductSalePrice(row.base_price, row.sale_price, campaign),
      };
    });

    return ok({ products, expires_at: expiresResult.rows[0]?.expires_at ?? null });
  } catch (e) {
    console.error("[daily-deals/active GET]", e);
    return fail("Internal server error", 500);
  }
}
