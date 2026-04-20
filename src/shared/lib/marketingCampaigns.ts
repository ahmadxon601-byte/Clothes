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
  if (typeof item.type !== "string") return null;
  if (!VALID_TYPES.some((row) => row === item.type)) return null;
  const type = item.type as MarketingCampaignType;

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

export function getMarketingCampaignDiscountPercent(item: MarketingCampaign | null | undefined) {
  if (!item || item.type !== "discount_percent") return 0;
  const discountPercent = Number(item.config.discountPercent ?? 0);
  if (!Number.isFinite(discountPercent)) return 0;
  return Math.max(0, Math.min(99, Math.round(discountPercent)));
}

export function applyMarketingCampaignPrice(basePrice: number, item: MarketingCampaign | null | undefined) {
  const normalizedBasePrice = Number(basePrice);
  if (!Number.isFinite(normalizedBasePrice) || normalizedBasePrice <= 0) return basePrice;

  const discountPercent = getMarketingCampaignDiscountPercent(item);
  if (discountPercent <= 0) return Math.round(normalizedBasePrice);

  return Math.max(1, Math.round((normalizedBasePrice * (100 - discountPercent)) / 100));
}

export function resolveProductSalePrice(
  basePrice: number,
  salePrice: number | null | undefined,
  item: MarketingCampaign | null | undefined,
) {
  const normalizedBasePrice = Number(basePrice);
  const normalizedSalePrice = salePrice == null ? null : Number(salePrice);

  if (
    normalizedSalePrice != null &&
    Number.isFinite(normalizedSalePrice) &&
    normalizedSalePrice > 0 &&
    normalizedSalePrice < normalizedBasePrice
  ) {
    return Math.round(normalizedSalePrice);
  }

  const campaignPrice = applyMarketingCampaignPrice(normalizedBasePrice, item);
  return campaignPrice < normalizedBasePrice ? campaignPrice : normalizedBasePrice;
}
