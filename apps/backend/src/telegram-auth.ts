import { createHash, createHmac, randomBytes } from "crypto";
import { config } from "./config";

type ParsedInitData = {
  authDate: number;
  queryId?: string;
  user?: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    allows_write_to_pm?: boolean;
    photo_url?: string;
  };
};

const parseInitData = (initData: string): ParsedInitData => {
  if (!config.telegramBotToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    throw new Error("hash is missing");
  }
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = createHash("sha256").update(config.telegramBotToken).digest();
  const computed = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computed !== hash) {
    throw new Error("invalid hash");
  }

  const authDate = Number(params.get("auth_date") || 0);
  const queryId = params.get("query_id") || undefined;
  const userRaw = params.get("user");
  const user = userRaw ? (JSON.parse(userRaw) as ParsedInitData["user"]) : undefined;

  return { authDate, queryId, user };
};

const issueSessionToken = () => randomBytes(24).toString("base64url");

export const verifyTelegramInitData = (initData: string) => {
  const parsed = parseInitData(initData);
  const token = issueSessionToken();
  return { ...parsed, sessionToken: token };
};
