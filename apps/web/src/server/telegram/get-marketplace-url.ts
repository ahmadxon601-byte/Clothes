const DEFAULT_MARKETPLACE_URL = "https://clothesmarketplace.netlify.app";

export const getMarketplaceUrl = (): string => {
  const legacyWebappUrl = process.env.WEBAPP_URL?.trim();
  if (legacyWebappUrl) {
    return legacyWebappUrl;
  }

  const directUrl = process.env.URL?.trim();
  if (directUrl) {
    return directUrl;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return DEFAULT_MARKETPLACE_URL;
};
