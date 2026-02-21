"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const envPath = path_1.default.resolve(__dirname, "../.env");
if (fs_1.default.existsSync(envPath)) {
    dotenv_1.default.config({ path: envPath });
}
else {
    console.error(`ERROR: .env file not found at ${envPath}`);
}
exports.config = {
    port: Number(process.env.PORT || 4000),
    host: process.env.HOST || "0.0.0.0",
    corsOrigins: (process.env.CORS_ORIGINS || "*").split(",").map((o) => o.trim()),
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
    telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || ""
};
if (!exports.config.telegramBotToken) {
    console.error("CRITICAL ERROR: TELEGRAM_BOT_TOKEN is missing in .env!");
    console.log("Check if apps/backend/.env file exists and has TELEGRAM_BOT_TOKEN defined.");
}
