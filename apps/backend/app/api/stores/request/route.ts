import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";

const schema = z.object({
  store_name: z.string().min(2).max(255),
  store_description: z.string().optional(),
  owner_name: z.string().min(2).max(255),
  phone: z.string().max(50).optional(),
  address: z.string().optional(),
});

// ── POST /api/stores/request  (auth required) ─────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const jwtUser = requireAuth(req);

    // Sellers / admins already have stores — block duplicate requests
    if (jwtUser.role === "seller" || jwtUser.role === "admin") {
      return fail("You already have seller access", 409);
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

    const { store_name, store_description, owner_name, phone, address } =
      parsed.data;

    await query(
      `INSERT INTO seller_requests
         (user_id, store_name, store_description, owner_name, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        jwtUser.userId,
        store_name,
        store_description ?? null,
        owner_name,
        phone ?? null,
        address ?? null,
      ]
    );

    return ok(
      { message: "Seller request submitted. Wait for admin approval." },
      201
    );
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[stores/request POST]", e);
    return fail("Internal server error", 500);
  }
}
