import { query } from "@/src/lib/db";
import { getCategoryColumnSupport } from "@/src/lib/categoryColumnSupport";
import { ok, fail } from "@/src/lib/auth";

export async function GET() {
  try {
    const { hasParentId, hasSticker } = await getCategoryColumnSupport();
    const result = await query(
      hasParentId
        ? `SELECT id, name, name_uz, name_ru, name_en, slug, ${hasSticker ? 'sticker,' : ''} parent_id, created_at FROM categories ORDER BY name ASC`
        : `SELECT id, name, name_uz, name_ru, name_en, slug, ${hasSticker ? 'sticker,' : ''} created_at FROM categories ORDER BY name ASC`
    );
    return ok({
      categories: result.rows.map((row) => ({
        ...row,
        parent_id: hasParentId ? row.parent_id : null,
        sticker: hasSticker ? row.sticker ?? null : null,
      })),
    });
  } catch (e) {
    console.error("[categories]", e);
    return fail("Internal server error", 500);
  }
}
