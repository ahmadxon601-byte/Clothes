import HomePageClient from './HomePageClient';
import type { ApiProduct } from '../../src/lib/apiClient';

type DailyDealsResponse = {
  data?: {
    products?: ApiProduct[];
    expires_at?: string | null;
  };
  products?: ApiProduct[];
  expires_at?: string | null;
};

type ProductsResponse = {
  data?: {
    products?: ApiProduct[];
  };
  products?: ApiProduct[];
};

function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://127.0.0.1:3010';
}

async function getInitialProducts() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/products?limit=24`, { cache: 'no-store' });
    const json = (await res.json().catch(() => ({}))) as ProductsResponse;
    return json.data?.products ?? json.products ?? [];
  } catch {
    return [];
  }
}

async function getInitialDailyDeals() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/daily-deals/active`, { cache: 'no-store' });
    const json = (await res.json().catch(() => ({}))) as DailyDealsResponse;
    return {
      products: json.data?.products ?? json.products ?? [],
      expiresAt: json.data?.expires_at ?? json.expires_at ?? null,
    };
  } catch {
    return {
      products: [],
      expiresAt: null,
    };
  }
}

export default async function WebsiteHomePage() {
  const [initialProducts, initialDeals] = await Promise.all([
    getInitialProducts(),
    getInitialDailyDeals(),
  ]);

  return (
    <HomePageClient
      initialProducts={initialProducts}
      initialDailyDealProducts={initialDeals.products}
      initialDailyDealEndsAt={initialDeals.expiresAt}
    />
  );
}
