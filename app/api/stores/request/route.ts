import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";
import { emitAdminEvent } from "@/src/lib/events";
import { getSellerRequestSupport } from "@/src/lib/sellerRequestSupport";
import { getStoreColumnSupport } from "@/src/lib/storeColumnSupport";
import { deleteStagedImages, saveStagedImages } from "@/src/lib/stagedImages";
import { notifyAdminsViaTelegram } from "@/src/server/telegram/admin-notifier";

const schema = z.object({
  store_name: z.string().min(2).max(255),
  store_description: z.string().optional(),
  owner_name: z.string().min(2).max(255),
  phone: z.string().max(50).optional(),
  address: z.string().optional(),
  image_url: z.string().trim().min(1).optional(),
  image_urls: z.array(z.string().trim().min(1)).min(1).max(10).optional(),
});

// ── POST /api/stores/request  (auth required) ─────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const jwtUser = requireAuth(req);
    const support = await getSellerRequestSupport();
    const storeSupport = await getStoreColumnSupport();

    // Admins cannot submit store requests
    if (jwtUser.role === "admin") {
      return fail("Adminlar do'kon ochish uchun ariza yuborolmaydi", 403);
    }

    // Check for an existing pending request
    const existing = await query(
      "SELECT id FROM seller_requests WHERE user_id = $1 AND status = 'pending'",
      [jwtUser.userId]
    );
    if (existing.rows.length > 0) {
      return fail("You already have a pending seller request", 409);
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const {
      store_name,
      store_description,
      owner_name,
      phone,
      address,
      image_url,
      image_urls,
    } =
      parsed.data;
    const normalizedImages = image_urls?.length
      ? image_urls
      : image_url
      ? [image_url]
      : [];

    if (normalizedImages.length < 1) {
      return fail("Kamida 1 ta do'kon rasmi yuborilishi shart", 422);
    }
    if (normalizedImages.length > 10) {
      return fail("Ko'pi bilan 10 ta do'kon rasmi yuborish mumkin", 422);
    }

    let requestId = "";

    if (support.hasRequestType) {
      if (storeSupport.hasSellerRequestImageUrl) {
        const insertResult = await query(
          `INSERT INTO seller_requests
             (user_id, store_name, store_description, owner_name, phone, address, image_url, request_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'store_create')
           RETURNING id`,
          [
            jwtUser.userId,
            store_name,
            store_description ?? null,
            owner_name,
            phone ?? null,
            address ?? null,
            null,
          ]
        );
        requestId = insertResult.rows[0]?.id ?? "";
      } else {
        const insertResult = await query(
          `INSERT INTO seller_requests
             (user_id, store_name, store_description, owner_name, phone, address, request_type)
           VALUES ($1, $2, $3, $4, $5, $6, 'store_create')
           RETURNING id`,
          [
            jwtUser.userId,
            store_name,
            store_description ?? null,
            owner_name,
            phone ?? null,
            address ?? null,
          ]
        );
        requestId = insertResult.rows[0]?.id ?? "";
      }
    } else {
      if (storeSupport.hasSellerRequestImageUrl) {
        const insertResult = await query(
          `INSERT INTO seller_requests
             (user_id, store_name, store_description, owner_name, phone, address, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            jwtUser.userId,
            store_name,
            store_description ?? null,
            owner_name,
            phone ?? null,
            address ?? null,
            null,
          ]
        );
        requestId = insertResult.rows[0]?.id ?? "";
      } else {
        const insertResult = await query(
          `INSERT INTO seller_requests
             (user_id, store_name, store_description, owner_name, phone, address)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            jwtUser.userId,
            store_name,
            store_description ?? null,
            owner_name,
            phone ?? null,
            address ?? null,
          ]
        );
        requestId = insertResult.rows[0]?.id ?? "";
      }
    }

    if (requestId) {
      await saveStagedImages("seller-request", requestId, normalizedImages);
    }

    emitAdminEvent({ type: "seller_requests", action: "created" });
    await notifyAdminsViaTelegram({
      text:
        `Yangi do'kon arizasi tushdi.\n\n` +
        `Do'kon: ${store_name}\n` +
        `Arizachi: ${owner_name}\n` +
        `${phone ? `Aloqa: ${phone}\n` : ""}` +
        `${address ? `Manzil: ${address}\n` : ""}` +
        `Holat: Kutilmoqda`,
      route: "/admin/applications",
    });
    return ok(
      { message: "Seller request submitted. Wait for admin approval." },
      201
    );
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    const errCode =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code?: unknown }).code ?? "")
        : "";
    const msg = e instanceof Error ? e.message : "";
    if (
      msg.includes("ECONNREFUSED") ||
      msg.includes("connect ECONN") ||
      msg.includes("authentication failed") ||
      msg.includes("password authentication failed") ||
      msg.includes("getaddrinfo ENOTFOUND") ||
      msg.includes('database "pos" does not exist') ||
      msg.includes("no pg_hba.conf entry") ||
      ["ECONNREFUSED", "28P01", "3D000", "ENOTFOUND"].includes(errCode)
    ) {
      return fail("Database connection error. Backend DB sozlamalarini tekshiring.", 503);
    }
    if (
      errCode === "42P01" ||
      msg.includes('relation "seller_requests" does not exist')
    ) {
      return fail("Database schema not ready. Run migrations/001_init.sql.", 500);
    }
    console.error("[stores/request POST]", e);
    return fail("Internal server error", 500);
  }
}

// ── DELETE /api/stores/request?id=<requestId>  (auth required, own request only) ──
export async function DELETE(req: NextRequest) {
  try {
    const jwtUser = requireAuth(req);
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return fail("id required", 400);

    const result = await query(
      `DELETE FROM seller_requests
       WHERE id = $1 AND user_id = $2 AND status != 'approved'
       RETURNING id`,
      [id, jwtUser.userId]
    );

    if (result.rows.length === 0)
      return fail("Ariza topilmadi yoki o'chirib bo'lmaydi", 404);

    await deleteStagedImages("seller-request", id);
    emitAdminEvent({ type: "seller_requests", action: "updated" });
    return ok({ message: "Ariza o'chirildi" });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[stores/request DELETE]", e);
    return fail("Internal server error", 500);
  }
}
