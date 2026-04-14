import ShopsPageClient from './ShopsPageClient';

type Store = {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  image_url: string | null;
  product_count: number;
  owner_name: string;
  created_at: string;
};

type StoresResponse = {
  data?: {
    stores?: Store[];
  };
  stores?: Store[];
};

type UiSettingResponse = {
  data?: {
    value?: string | null;
  };
  value?: string | null;
};

function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://127.0.0.1:3010';
}

async function getInitialStores() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/stores?limit=50`, { cache: 'no-store' });
    const json = (await res.json().catch(() => ({}))) as StoresResponse;
    return json.data?.stores ?? json.stores ?? [];
  } catch {
    return [];
  }
}

async function getInitialHeroImage() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/ui-settings?key=shops_hero_image`, { cache: 'no-store' });
    const json = (await res.json().catch(() => ({}))) as UiSettingResponse;
    return json.data?.value ?? json.value ?? '';
  } catch {
    return '';
  }
}

export default async function ShopsPage() {
  const [initialStores, initialHeroImage] = await Promise.all([
    getInitialStores(),
    getInitialHeroImage(),
  ]);

  return (
    <ShopsPageClient
      initialStores={initialStores}
      initialHeroImage={initialHeroImage}
    />
  );
}
