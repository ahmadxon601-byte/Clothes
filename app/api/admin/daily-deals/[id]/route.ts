import { NextRequest } from "next/server";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";
import { query } from "@/src/lib/db";
import { ensureDailyDealTables } from "@/src/lib/dailyDeals";
import { emitAdminEvent } from "@/src/lib/events";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    requireRole(req, "admin");
    await ensureDailyDealTables();
    const { id } = await params;

    const result = await query(
      `DELETE FROM daily_deal_campaigns
       WHERE id = $1
       RETURNING id, title`,
      [id]
    );

    if (!result.rows.length) return fail("Chegirma topilmadi", 404);

    await query(
      `DELETE FROM notifications
       WHERE source_type = 'daily_deal' AND source_id = $1`,
      [id]
    );

    emitAdminEvent({ type: "notifications", action: "deleted" });
    emitAdminEvent({ type: "daily_deals", action: "deleted" });
    return ok({ deleted: true, campaign: result.rows[0] });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/daily-deals/:id DELETE]", e);
    return fail("Internal server error", 500);
  }
}
