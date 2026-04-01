import { query } from "@/src/lib/db";
import { ok, fail } from "@/src/lib/auth";

// GET /api/banners — returns active banners that should appear on home
export async function GET() {
  try {
    const { rows } = await query(`
      SELECT
        b.id, b.title, b.image_url, b.created_at, b.updated_at
      FROM banners b
      WHERE b.is_active = true
        AND b.show_on_home = true
      ORDER BY b.created_at DESC
    `);

    return ok({ banners: rows });
  } catch (e) {
    console.error("[banners GET]", e);
    return fail("Internal server error", 500);
  }
}
