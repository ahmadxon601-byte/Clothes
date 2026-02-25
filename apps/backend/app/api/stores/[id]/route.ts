import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail } from "@/src/lib/auth";

type Params = { params: Promise<{ id: string }> };

// ── GET /api/stores/[id] ──────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const result = await query(
      `SELECT
         st.id, st.name, st.description, st.phone, st.address, st.created_at,
         u.id AS owner_id, u.name AS owner_name,
         (SELECT COUNT(*) FROM products p
          WHERE p.store_id = st.id AND p.is_active = TRUE) AS product_count
       FROM stores st
       JOIN users u ON u.id = st.owner_id
       WHERE st.id = $1 AND st.is_active = TRUE`,
      [id]
    );

    if (result.rows.length === 0) return fail("Store not found", 404);
    return ok({ store: result.rows[0] });
  } catch (e) {
    console.error("[store GET]", e);
    return fail("Internal server error", 500);
  }
}
