import { NextRequest } from "next/server";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";
import { query } from "@/src/lib/db";
import { ensureDailyDealTables } from "@/src/lib/dailyDeals";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    await ensureDailyDealTables();

    const invitesResult = await query(
      `
      SELECT
        i.id,
        i.status,
        i.store_id,
        s.name AS store_name,
        c.id AS campaign_id,
        c.title,
        c.message,
        c.starts_at,
        c.ends_at,
        c.status AS campaign_status,
        COALESCE(
          (
            SELECT json_agg(json_build_object('product_id', di.product_id))
            FROM daily_deal_items di
            WHERE di.invite_id = i.id
          ),
          '[]'::json
        ) AS selected_items
      FROM daily_deal_invites i
      JOIN daily_deal_campaigns c ON c.id = i.campaign_id
      JOIN stores s ON s.id = i.store_id
      WHERE i.user_id = $1
      ORDER BY i.created_at DESC
      `,
      [user.userId]
    );

    const productsResult = await query(
      `
      SELECT
        p.id,
        p.name,
        p.base_price,
        p.store_id,
        s.name AS store_name,
        (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS thumbnail
      FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE s.owner_id = $1 AND p.is_active = TRUE
      ORDER BY p.created_at DESC
      `,
      [user.userId]
    );

    return ok({ invites: invitesResult.rows, products: productsResult.rows });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[daily-deals/my-invites GET]", e);
    return fail("Internal server error", 500);
  }
}
