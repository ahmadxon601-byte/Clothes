import ProductsPageClient from './ProductsPageClient';
import type { ApiProduct } from '../../../src/lib/apiClient';

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
    const res = await fetch(`${getBaseUrl()}/api/products?limit=100`, { cache: 'no-store' });
    const json = (await res.json().catch(() => ({}))) as ProductsResponse;
    return json.data?.products ?? json.products ?? [];
  } catch {
    return [];
  }
}

export default async function ProductsPage() {
  const initialProducts = await getInitialProducts();
  return <ProductsPageClient initialProducts={initialProducts} />;
}
