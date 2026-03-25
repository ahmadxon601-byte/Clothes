import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, requireRole, paginate, AuthError } from "@/src/lib/auth";
import pool, { query } from "@/src/lib/db";
import { createNotification, ensureDailyDealTables } from "@/src/lib/dailyDeals";
import { emitAdminEvent } from "@/src/lib/events";
import { notifyDailyDealInviteViaTelegram } from "@/src/server/telegram/daily-deal-notifier";

const createSchema = z.object({
  title: z.string().min(3).max(120),
  message: z.string().min(5).max(500),
  starts_at: z.string().min(5),
  ends_at: z.string().min(5),
  store_ids: z.array(z.string().uuid()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    requireRole(req, "admin");
    await ensureDailyDealTables();

    const s = req.nextUrl.searchParams;
    const status = s.get("status")?.trim() || null;
    const { page, limit, offset } = paginate(s.get("page"), s.get("limit"));
    const params: unknown[] = [];
    const where: string[] = [];

    if (status) {
      params.push(status);
      where.push(`c.status = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const countResult = await query(`SELECT COUNT(*) FROM daily_deal_campaigns c ${whereSql}`, params);
    const total = Number(countResult.rows[0]?.count ?? 0);

    params.push(limit, offset);
    const result = await query(
      `
      SELECT
        c.*,
        COALESCE(inv.total_invites, 0) AS total_invites,
        COALESCE(inv.accepted_invites, 0) AS accepted_invites,
        COALESCE(inv.pending_invites, 0) AS pending_invites,
        COALESCE(inv.selected_products, 0) AS selected_products
      FROM daily_deal_campaigns c
      LEFT JOIN (
        SELECT
          ddi.campaign_id,
          COUNT(*) AS total_invites,
          COUNT(*) FILTER (WHERE ddi.status = 'accepted') AS accepted_invites,
          COUNT(*) FILTER (WHERE ddi.status = 'pending') AS pending_invites,
          COALESCE(SUM(items.item_count), 0) AS selected_products
        FROM daily_deal_invites ddi
        LEFT JOIN (
          SELECT invite_id, COUNT(*) AS item_count
          FROM daily_deal_items
          GROUP BY invite_id
        ) items ON items.invite_id = ddi.id
        GROUP BY ddi.campaign_id
      ) inv ON inv.campaign_id = c.id
      ${whereSql}
      ORDER BY c.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params
    );

    return ok({
      campaigns: result.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/daily-deals GET]", e);
    return fail("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireRole(req, "admin");
    await ensureDailyDealTables();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Invalid payload", 422);

    const { title, message, starts_at, ends_at, store_ids } = parsed.data;
    if (new Date(starts_at).getTime() >= new Date(ends_at).getTime()) {
      return fail("End time must be after start time", 422);
    }

    const storesResult = store_ids?.length
      ? await query(
          `
          SELECT st.id, st.owner_id, st.name, u.telegram_id
          FROM stores st
          LEFT JOIN users u ON u.id = st.owner_id
          WHERE st.id = ANY($1::uuid[]) AND st.is_active = TRUE
          `,
          [store_ids]
        )
      : await query(
          `
          SELECT st.id, st.owner_id, st.name, u.telegram_id
          FROM stores st
          LEFT JOIN users u ON u.id = st.owner_id
          WHERE st.is_active = TRUE
          ORDER BY st.created_at DESC
          `
        );

    if (!storesResult.rows.length) return fail("No active stores found", 404);

    const campaignId = randomUUID();
    const client = await pool.connect();
    const telegramQueue: Array<{
      telegramId: number;
      title: string;
      message: string;
      storeName: string;
      startsAt: string;
      endsAt: string;
    }> = [];

    try {
      await client.query("BEGIN");
      await client.query(
        `
        INSERT INTO daily_deal_campaigns (id, title, message, status, starts_at, ends_at, created_by)
        VALUES ($1, $2, $3, 'active', $4, $5, $6)
        `,
        [campaignId, title, message, starts_at, ends_at, admin.userId]
      );

      for (const store of storesResult.rows) {
        const inviteId = randomUUID();
        await client.query(
          `
          INSERT INTO daily_deal_invites (id, campaign_id, store_id, user_id, status)
          VALUES ($1, $2, $3, $4, 'pending')
          ON CONFLICT (campaign_id, store_id) DO NOTHING
          `,
          [inviteId, campaignId, store.id, store.owner_id]
        );

        await createNotification({
          userId: store.owner_id,
          title,
          body: `${message}\n\nDo'kon: ${store.name}`,
          sourceType: "daily_deal",
          sourceId: campaignId,
        });

        if (store.telegram_id) {
          telegramQueue.push({
            telegramId: Number(store.telegram_id),
            title,
            message,
            storeName: store.name,
            startsAt: starts_at,
            endsAt: ends_at,
          });
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    for (const item of telegramQueue) {
      await notifyDailyDealInviteViaTelegram(item);
    }

    emitAdminEvent({ type: "daily_deals", action: "created" });
    emitAdminEvent({ type: "notifications", action: "created" });
    emitAdminEvent({ type: "products", action: "updated" });
    return ok({ created: true, campaign_id: campaignId, invited_stores: storesResult.rows.length }, 201);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/daily-deals POST]", e);
    return fail("Internal server error", 500);
  }
}
