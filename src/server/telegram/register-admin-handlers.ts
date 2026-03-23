import { Bot, InlineKeyboard } from "grammy";
import { subscribeAdminTelegramChat } from "./admin-chat-subscriptions";
import {
  addTelegramAdmin,
  getTelegramAdminAccess,
  listTelegramAdmins,
  normalizeTelegramUsername,
  removeTelegramAdmin,
} from "./admin-access";
import { getMarketplaceUrl } from "./get-marketplace-url";

const adminPanelButton = () =>
  new InlineKeyboard().webApp("Admin panelni ochish", `${getMarketplaceUrl()}/admin/dashboard`);

const formatUsername = (username: string) => `@${username}`;

const unauthorizedText =
  "Sizda admin botdan foydalanish huquqi yo'q. SuperAdmin bilan bog'laning.";

const adminHelpText =
  "Komandalar:\n" +
  "/panel - admin panelni ochish\n" +
  "/admins - adminlar ro'yxati\n" +
  "/addadmin @username - admin qo'shish (faqat SuperAdmin)\n" +
  "/removeadmin @username - adminni olib tashlash (faqat SuperAdmin)";

const extractUsernameArg = (value: unknown): string | null =>
  normalizeTelegramUsername(typeof value === "string" ? value.split(/\s+/)[0] : null);

async function requireAdminAccess(
  ctx: Parameters<Bot["command"]>[1] extends never ? never : any,
  options?: { silent?: boolean }
) {
  const access = await getTelegramAdminAccess(ctx.from?.username);
  if (!access?.is_active) {
    if (!options?.silent) {
      await ctx.reply(unauthorizedText);
    }
    return null;
  }

  return access;
}

export const registerAdminTelegramHandlers = (bot: Bot): void => {
  bot.use(async (ctx, next) => {
    const access = await getTelegramAdminAccess(ctx.from?.username);
    if (!access?.is_active) {
      return;
    }

    await next();
  });

  bot.command("start", async (ctx) => {
    const access = await requireAdminAccess(ctx, { silent: true });
    if (!access) return;

    if (ctx.chat?.id) {
      try {
        await subscribeAdminTelegramChat({
          chatId: ctx.chat.id,
          telegramUserId: ctx.from?.id,
          firstName: ctx.from?.first_name,
          username: ctx.from?.username,
        });
      } catch (error) {
        console.error("[admin-bot] failed to subscribe admin chat:", error);
      }
    }

    await ctx.reply(
      `Assalomu alaykum ${ctx.from?.first_name || "admin"}.\n\n` +
        `Bu alohida admin bot. Yangi arizalar va mahsulot ko'rib chiqish so'rovlari shu yerga keladi.\n\n` +
        `Pastdagi tugma orqali admin panelni ochishingiz mumkin.\n\n` +
        `Bu chat admin xabarlari uchun ro'yxatdan o'tkazildi.\n\n` +
        `Sizning darajangiz: ${access.role === "superadmin" ? "SuperAdmin" : "Admin"}.\n\n` +
        adminHelpText,
      { reply_markup: adminPanelButton() }
    );
  });

  bot.command("panel", async (ctx) => {
    const access = await requireAdminAccess(ctx, { silent: true });
    if (!access) return;

    let text = "Admin panelni ochish uchun tugmani bosing.";

    if (ctx.chat?.id) {
      try {
        await subscribeAdminTelegramChat({
          chatId: ctx.chat.id,
          telegramUserId: ctx.from?.id,
          firstName: ctx.from?.first_name,
          username: ctx.from?.username,
        });
        text += "\n\nBu chat admin xabarlari uchun ro'yxatdan o'tkazildi.";
      } catch (error) {
        console.error("[admin-bot] failed to subscribe admin chat:", error);
      }
    }

    await ctx.reply(text, {
      reply_markup: adminPanelButton(),
    });
  });

  bot.command("admins", async (ctx) => {
    const access = await requireAdminAccess(ctx);
    if (!access) return;

    const admins = await listTelegramAdmins();
    const lines = admins.map((admin, index) => {
      const roleLabel = admin.role === "superadmin" ? "SuperAdmin" : "Admin";
      const statusLabel = admin.is_active ? "aktiv" : "o'chirilgan";
      return `${index + 1}. ${formatUsername(admin.username)} - ${roleLabel} (${statusLabel})`;
    });

    await ctx.reply(`Adminlar ro'yxati:\n\n${lines.join("\n")}`);
  });

  bot.command("addadmin", async (ctx) => {
    const access = await requireAdminAccess(ctx);
    if (!access) return;
    if (access.role !== "superadmin") {
      await ctx.reply("Bu komanda faqat SuperAdmin uchun.");
      return;
    }

    const username = extractUsernameArg(ctx.match);
    if (!username) {
      await ctx.reply("Foydalanish: /addadmin @username");
      return;
    }

    try {
      const admin = await addTelegramAdmin(username, "admin");
      await ctx.reply(`${formatUsername(admin.username)} admin sifatida qo'shildi.`);
    } catch (error) {
      await ctx.reply(error instanceof Error ? error.message : "Adminni qo'shishda xatolik yuz berdi.");
    }
  });

  bot.command("removeadmin", async (ctx) => {
    const access = await requireAdminAccess(ctx);
    if (!access) return;
    if (access.role !== "superadmin") {
      await ctx.reply("Bu komanda faqat SuperAdmin uchun.");
      return;
    }

    const username = extractUsernameArg(ctx.match);
    if (!username) {
      await ctx.reply("Foydalanish: /removeadmin @username");
      return;
    }

    try {
      const admin = await removeTelegramAdmin(username);
      if (!admin) {
        await ctx.reply("Bunday admin topilmadi.");
        return;
      }

      await ctx.reply(`${formatUsername(admin.username)} adminlar ro'yxatidan olib tashlandi.`);
    } catch (error) {
      await ctx.reply(error instanceof Error ? error.message : "Adminni o'chirishda xatolik yuz berdi.");
    }
  });

  bot.on("message:text", async (ctx) => {
    await ctx.reply("Foydalanish: /panel");
  });
};
