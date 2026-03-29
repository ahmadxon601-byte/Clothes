import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";
import { getUiSetting, setUiSetting } from "@/src/lib/uiSettings";

const schema = z.object({
  key: z.string().min(1),
  value: z.string().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    requireRole(req, "admin");
    const key = req.nextUrl.searchParams.get("key");
    if (!key) return fail("key required", 400);
    const value = await getUiSetting(key);
    return ok({ key, value });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/ui-settings GET]", e);
    return fail("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    requireRole(req, "admin");
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);
    await setUiSetting(parsed.data.key, parsed.data.value);
    return ok({ key: parsed.data.key, value: parsed.data.value });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/ui-settings PATCH]", e);
    return fail("Internal server error", 500);
  }
}
