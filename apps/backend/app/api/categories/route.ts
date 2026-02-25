import { query } from "@/src/lib/db";
import { ok, fail } from "@/src/lib/auth";

export async function GET() {
  try {
    const result = await query(
      "SELECT id, name, slug, created_at FROM categories ORDER BY name ASC"
    );
    return ok({ categories: result.rows });
  } catch (e) {
    console.error("[categories]", e);
    return fail("Internal server error", 500);
  }
}
