import ClothingPageClient from './ClothingPageClient';

type Product = {
  id: string;
  name: string;
  base_price: number;
  sale_price: number | null;
  thumbnail: string | null;
  category_name: string | null;
  store_name: string;
  store_id: string;
};

type CategoryItem = {
  id: string;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  name_en: string | null;
  sticker?: string | null;
  parent_id?: string | null;
};

type ProductsResponse = {
  data?: {
    products?: Product[];
  };
  products?: Product[];
};

type CategoriesResponse = {
  data?: {
    categories?: CategoryItem[];
  };
  categories?: CategoryItem[];
};

function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://127.0.0.1:3010';
}

async function getInitialProducts() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/products?limit=40`, { next: { revalidate: 60 } });
    const json = (await res.json().catch(() => ({}))) as ProductsResponse;
    return json.data?.products ?? json.products ?? [];
  } catch {
    return [];
  }
}

async function getInitialCategories() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/categories`, { next: { revalidate: 300 } });
    const json = (await res.json().catch(() => ({}))) as CategoriesResponse;
    return json.data?.categories ?? json.categories ?? [];
  } catch {
    return [];
  }
}

export default async function ClothingPage() {
  const [initialProducts, initialCategories] = await Promise.all([
    getInitialProducts(),
    getInitialCategories(),
  ]);

  return (
    <ClothingPageClient
      initialProducts={initialProducts}
      initialCategories={initialCategories}
    />
  );
}
