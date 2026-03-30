import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";

type UiLanguage = "uz" | "ru" | "en";

function normalizeLanguage(value: string | null): UiLanguage {
  return value === "ru" || value === "en" ? value : "uz";
}

function localizeNotification(
  notification: {
    id: string;
    title: string;
    body: string;
    is_read: boolean;
    created_at: string;
    source_type: string | null;
  },
  language: UiLanguage
) {
  if (notification.source_type !== "daily_deal") return notification;

  const storeNameMatch = notification.body.match(/Do'kon:\s*(.+)$/m);
  const storeName = storeNameMatch?.[1]?.trim();

  const localized = {
    uz: {
      title: "Qulaymarket chegirmasi",
      body: `Qulaymarket bugun chegirma o'tkazmoqda. Tovaringizni qo'shishni istaysizmi?${storeName ? ` Do'kon: ${storeName}` : ""}`,
    },
    ru: {
      title: "Скидка Qulaymarket",
      body: `Сегодня в Qulaymarket проходит акция. Хотите добавить свой товар?${storeName ? ` Магазин: ${storeName}` : ""}`,
    },
    en: {
      title: "Qulaymarket Discount",
      body: `Qulaymarket is running a promotion today. Do you want to add your product?${storeName ? ` Store: ${storeName}` : ""}`,
    },
  } as const;

  return {
    ...notification,
    title: localized[language].title,
    body: localized[language].body,
  };
}

// GET /api/notifications
export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const language = normalizeLanguage(req.headers.get("x-language"));
    const { rows } = await query(
      `SELECT id, title, body, is_read, created_at, source_type
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.userId]
    );
    return ok(rows.map((row) => localizeNotification(row, language)));
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    return fail("Server error", 500);
  }
}
