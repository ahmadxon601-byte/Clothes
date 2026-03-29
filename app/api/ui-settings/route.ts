import { NextRequest } from "next/server";
import { ok, fail } from "@/src/lib/auth";
import { getUiSetting } from "@/src/lib/uiSettings";

export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    if (!key) return fail("key required", 400);
    const value = await getUiSetting(key);
    return ok({ key, value });
  } catch (e) {
    console.error("[ui-settings GET]", e);
    return fail("Internal server error", 500);
  }
}
