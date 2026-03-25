import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";
import { query } from "@/src/lib/db";
import { ensureDailyDealTables } from "@/src/lib/dailyDeals";
import { emitAdminEvent } from "@/src/lib/events";

const schema = z.object({
  status: z.enum(["accepted", "rejected"]),
  product_ids: z.array(z.string().uuid()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    await ensureDailyDealTables();
    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Invalid payload", 422);

    const inviteResult = await query(
      `
      SELECT i.id, i.store_id, i.user_id, i.status, c.status AS campaign_status
      FROM daily_deal_invites i
      JOIN daily_deal_campaigns c ON c.id = i.campaign_id
      WHERE i.id = $1 AND i.user_id = $2
      LIMIT 1
      `,
      [id, user.userId]
    );
    const invite = inviteResult.rows[0];
    if (!invite) return fail("Invite not found", 404);
    if (invite.campaign_status !== "active") return fail("Campaign is not active", 422);

    if (parsed.data.status === "accepted") {
      const productIds = parsed.data.product_ids ?? [];
      if (!productIds.length) return fail("At least one product is required", 422);

      const ownedProducts = await query(
        `
        SELECT id
        FROM products
        WHERE id = ANY($1::uuid[]) AND store_id = $2
        `,
        [productIds, invite.store_id]
      );

      if (ownedProducts.rows.length !== productIds.length) {
        return fail("Some products do not belong to your store", 403);
      }

      await query(`DELETE FROM daily_deal_items WHERE invite_id = $1`, [id]);
      for (const productId of productIds) {
        await query(
          `INSERT INTO daily_deal_items (id, invite_id, product_id) VALUES ($1, $2, $3)`,
          [randomUUID(), id, productId]
        );
      }
    } else {
      await query(`DELETE FROM daily_deal_items WHERE invite_id = $1`, [id]);
    }

    await query(
      `UPDATE daily_deal_invites SET status = $1, responded_at = NOW() WHERE id = $2`,
      [parsed.data.status, id]
    );

    emitAdminEvent({ type: "products", action: "updated" });
    return ok({ updated: true });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[daily-deals/invites/:id PATCH]", e);
    return fail("Internal server error", 500);
  }
}
