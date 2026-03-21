import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { getCategoryColumnSupport } from "@/src/lib/categoryColumnSupport";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";
import { logAction } from "@/src/lib/audit";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  name_uz: z.string().optional(),
  name_ru: z.string().optional(),
  name_en: z.string().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = requireRole(req, "admin");
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);
    const { hasParentId } = await getCategoryColumnSupport();

    const fields: string[] = [];
    const vals: unknown[] = [];

    const d = parsed.data;
    if (d.name)     { vals.push(d.name);     fields.push(`name = $${vals.length}`); }
    if (d.name_uz)  { vals.push(d.name_uz);  fields.push(`name_uz = $${vals.length}`); }
    if (d.name_ru)  { vals.push(d.name_ru);  fields.push(`name_ru = $${vals.length}`); }
    if (d.name_en)  { vals.push(d.name_en);  fields.push(`name_en = $${vals.length}`); }
    if (d.slug)     { vals.push(d.slug);     fields.push(`slug = $${vals.length}`); }
    if (d.parent_id !== undefined) {
      if (!hasParentId) {
        return fail("Subkategoriya tahrirlash uchun 009_add_category_parent.sql migrationini ishga tushiring", 409);
      }
      vals.push(d.parent_id);
      fields.push(`parent_id = $${vals.length}`);
    }
    if (!fields.length) return fail("No fields to update", 422);

    vals.push(id);
    const result = await query(
      `${`UPDATE categories SET ${fields.join(", ")} WHERE id = $${vals.length}`}
       RETURNING id, name, name_uz, name_ru, name_en, slug${hasParentId ? ", parent_id" : ""}, created_at`,
      vals
    );
    if (result.rows.length === 0) return fail("Category not found", 404);
    const category = hasParentId ? result.rows[0] : { ...result.rows[0], parent_id: null };
    logAction({ admin, action: "update", entity: "category", entityId: id, details: parsed.data });
    return ok({ category });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    const code = (e as { code?: string })?.code;
    if (code === "23505") return fail("Bu slug allaqachon mavjud", 409);
    console.error("[admin/categories PATCH]", e);
    return fail("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = requireRole(req, "admin");
    const { id } = await params;
    const result = await query(
      "DELETE FROM categories WHERE id = $1 RETURNING id, name",
      [id]
    );
    if (result.rows.length === 0) return fail("Category not found", 404);
    logAction({ admin, action: "delete", entity: "category", entityId: id, details: { name: result.rows[0].name } });
    return ok({ message: "Deleted" });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/categories DELETE]", e);
    return fail("Internal server error", 500);
  }
}
