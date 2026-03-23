import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { getCategoryColumnSupport } from "@/src/lib/categoryColumnSupport";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";
import { logAction } from "@/src/lib/audit";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  name_uz: z.string().optional(),
  name_ru: z.string().optional(),
  name_en: z.string().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, hyphens"),
});

export async function POST(req: NextRequest) {
  try {
    const admin = requireRole(req, "admin");
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const { name, name_uz, name_ru, name_en, slug, parent_id } = parsed.data;
    const { hasParentId } = await getCategoryColumnSupport();

    if (parent_id && !hasParentId) {
      return fail("Subkategoriya qo'shish uchun 009_add_category_parent.sql migrationini ishga tushiring", 409);
    }

    const result = await query(
      hasParentId
        ? `INSERT INTO categories (name, name_uz, name_ru, name_en, slug, parent_id) VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, name, name_uz, name_ru, name_en, slug, parent_id, created_at`
        : `INSERT INTO categories (name, name_uz, name_ru, name_en, slug) VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, name_uz, name_ru, name_en, slug, created_at`,
      hasParentId
        ? [name, name_uz ?? name, name_ru ?? name, name_en ?? name, slug, parent_id ?? null]
        : [name, name_uz ?? name, name_ru ?? name, name_en ?? name, slug]
    );
    const category = hasParentId ? result.rows[0] : { ...result.rows[0], parent_id: null };
    logAction({ admin, action: "create", entity: "category", entityId: category.id, details: parsed.data });
    return ok({ category }, 201);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    const code = (e as { code?: string })?.code;
    if (code === "23505") return fail("Bu slug allaqachon mavjud", 409);
    console.error("[admin/categories POST]", e);
    return fail("Internal server error", 500);
  }
}
