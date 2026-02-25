import { Bot } from "grammy";
import { registerTelegramHandlers } from "./register-handlers";

let webhookBot: Bot | null = null;

export const getTelegramToken = (): string | null => {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return token ? token : null;
};

export const getWebhookBot = (): Bot | null => {
  const token = getTelegramToken();
  if (!token) {
    return null;
  }

  if (!webhookBot) {
    webhookBot = new Bot(token);
    registerTelegramHandlers(webhookBot);
  }

  return webhookBot;
};
