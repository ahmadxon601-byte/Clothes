export const MARKETING_CAMPAIGNS_SETTING_KEY = "marketing_campaigns";

export type MarketingCampaignType =
  | "trending"
  | "newest"
  | "discount_percent"
  | "buy_x_get_y"
  | "bundle_price"
  | "gift"
  | "free_shipping"
  | "promo_code"
  | "flash_sale";

export type MarketingCampaignStatus = "active" | "draft";

export type MarketingCampaign = {
  id: string;
  name: string;
  label: string;
  type: MarketingCampaignType;
  status: MarketingCampaignStatus;
  description?: string;
  config: {
    discountPercent?: number;
    buyQty?: number;
    getQty?: number;
    bundleCount?: number;
    bundlePrice?: string;
    giftName?: string;
    promoCode?: string;
    durationHours?: number;
    shippingNote?: string;
  };
};

const VALID_TYPES: MarketingCampaignType[] = [
  "trending",
  "newest",
  "discount_percent",
  "buy_x_get_y",
  "bundle_price",
  "gift",
  "free_shipping",
  "promo_code",
  "flash_sale",
];

function createId() {
  return `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCampaign(raw: unknown): MarketingCampaign | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const type = item.type;
  if (!VALID_TYPES.some((row) => row === type)) return null;

  return {
    id: typeof item.id === "string" && item.id ? item.id : createId(),
    name: typeof item.name === "string" ? item.name : "",
    label: typeof item.label === "string" ? item.label : "",
    type,
    status: item.status === "draft" ? "draft" : "active",
    description: typeof item.description === "string" ? item.description : "",
    config:
      typeof item.config === "object" && item.config
        ? {
            discountPercent: Number((item.config as Record<string, unknown>).discountPercent) || undefined,
            buyQty: Number((item.config as Record<string, unknown>).buyQty) || undefined,
            getQty: Number((item.config as Record<string, unknown>).getQty) || undefined,
            bundleCount: Number((item.config as Record<string, unknown>).bundleCount) || undefined,
            bundlePrice:
              typeof (item.config as Record<string, unknown>).bundlePrice === "string"
                ? ((item.config as Record<string, unknown>).bundlePrice as string)
                : undefined,
            giftName:
              typeof (item.config as Record<string, unknown>).giftName === "string"
                ? ((item.config as Record<string, unknown>).giftName as string)
                : undefined,
            promoCode:
              typeof (item.config as Record<string, unknown>).promoCode === "string"
                ? ((item.config as Record<string, unknown>).promoCode as string)
                : undefined,
            durationHours: Number((item.config as Record<string, unknown>).durationHours) || undefined,
            shippingNote:
              typeof (item.config as Record<string, unknown>).shippingNote === "string"
                ? ((item.config as Record<string, unknown>).shippingNote as string)
                : undefined,
          }
        : {},
  };
}

export function parseMarketingCampaigns(raw: string | null): MarketingCampaign[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCampaign).filter((item): item is MarketingCampaign => Boolean(item));
  } catch {
    return [];
  }
}

export function resolveMarketingCampaignLabel(item: MarketingCampaign) {
  if (item.label.trim()) return item.label.trim();
  if (item.type === "discount_percent" && item.config.discountPercent) return `${item.config.discountPercent}%`;
  if (item.type === "buy_x_get_y") return `${item.config.buyQty ?? 1}+${item.config.getQty ?? 1}`;
  if (item.type === "bundle_price") return `${item.config.bundleCount ?? 2} talik set`;
  if (item.type === "gift") return item.config.giftName || "Sovg‘a";
  if (item.type === "promo_code") return item.config.promoCode || "Promo";
  if (item.type === "flash_sale") return "Flash sale";
  if (item.type === "free_shipping") return "Bepul yetkazish";
  if (item.type === "trending") return "Trendda";
  return "Eng yangi";
}

export function getMarketingCampaignSummary(item: MarketingCampaign) {
  if (item.type === "discount_percent") return `${item.config.discountPercent ?? 0}% chegirma`;
  if (item.type === "buy_x_get_y") return `${item.config.buyQty ?? 1} ta ol, ${item.config.getQty ?? 1} ta bonus`;
  if (item.type === "bundle_price") return `${item.config.bundleCount ?? 2} ta mahsulot, set narxi ${item.config.bundlePrice || "belgilanmagan"}`;
  if (item.type === "gift") return `Sovg‘a: ${item.config.giftName || "nom berilmagan"}`;
  if (item.type === "promo_code") return `Kod: ${item.config.promoCode || "yo‘q"}`;
  if (item.type === "flash_sale") return `${item.config.durationHours ?? 24} soatlik aksiya`;
  if (item.type === "free_shipping") return item.config.shippingNote || "Bepul yetkazish";
  if (item.type === "trending") return "Ommabop mahsulotlarni ajratadi";
  return "Yangi qo‘shilgan mahsulotlarni ajratadi";
}

