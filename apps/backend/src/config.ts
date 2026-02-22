import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config(); // Load from system environment variables
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.log("ℹ️ Info: Local .env file not found, using system environment variables.");
}

const isLocal = process.env.NODE_ENV === "development" || !process.env.NETLIFY || !process.env.VERCEL;

export const config = {
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || "0.0.0.0",
  corsOrigins: (process.env.CORS_ORIGINS || "*").split(",").map((o) => o.trim()),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "",
  isLocal
};

if (!config.telegramBotToken) {
  console.error("CRITICAL ERROR: TELEGRAM_BOT_TOKEN is missing in .env!");
  console.log("Check if apps/backend/.env file exists and has TELEGRAM_BOT_TOKEN defined.");
}
