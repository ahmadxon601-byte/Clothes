import { Bot } from "grammy";
import { registerAdminTelegramHandlers } from "./register-admin-handlers";

let adminWebhookBot: Bot | null = null;

export const getAdminTelegramToken = (): string | null => {
  const token = process.env.ADMIN_TELEGRAM_BOT_TOKEN?.trim();
  return token ? token : null;
};

export const getAdminWebhookBot = (): Bot | null => {
  const token = getAdminTelegramToken();
  if (!token) {
    return null;
  }

  if (!adminWebhookBot) {
    adminWebhookBot = new Bot(token);
    registerAdminTelegramHandlers(adminWebhookBot);
  }

  return adminWebhookBot;
};
