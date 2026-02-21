"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTelegramInitData = void 0;
const crypto_1 = require("crypto");
const config_1 = require("./config");
const parseInitData = (initData) => {
    if (!config_1.config.telegramBotToken) {
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
    const secretKey = (0, crypto_1.createHash)("sha256").update(config_1.config.telegramBotToken).digest();
    const computed = (0, crypto_1.createHmac)("sha256", secretKey).update(dataCheckString).digest("hex");
    if (computed !== hash) {
        throw new Error("invalid hash");
    }
    const authDate = Number(params.get("auth_date") || 0);
    const queryId = params.get("query_id") || undefined;
    const userRaw = params.get("user");
    const user = userRaw ? JSON.parse(userRaw) : undefined;
    return { authDate, queryId, user };
};
const issueSessionToken = () => (0, crypto_1.randomBytes)(24).toString("base64url");
const verifyTelegramInitData = (initData) => {
    const parsed = parseInitData(initData);
    const token = issueSessionToken();
    return { ...parsed, sessionToken: token };
};
exports.verifyTelegramInitData = verifyTelegramInitData;
