const DEFAULT_LOCAL_MARKETPLACE_URL = "http://localhost:3000";

export const getMarketplaceUrl = (): string => {
  const directUrl = process.env.URL?.trim();
  if (directUrl) {
    return directUrl;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEFAULT_LOCAL_MARKETPLACE_URL;
  }

  throw new Error("Marketplace URL is not configured. Set URL or VERCEL_URL.");
};
