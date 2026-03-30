'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronLeft, MapPin, Navigation, Package, Phone, Store as StoreIcon } from 'lucide-react';
import { useTranslation } from '../../../../src/shared/lib/i18n';
import { useWebI18n } from '../../../../src/shared/lib/webI18n';
import { useTranslatedLabelMap } from '../../../../src/shared/hooks/useTranslatedLabelMap';
import { sanitizeProductLabel } from '../../../../src/shared/lib/webProductText';
import { formatPrice } from '../../../../src/shared/lib/formatPrice';
import { formatPhoneNumber, phoneHref } from '../../../../src/shared/lib/phoneFormat';

const MapDisplay = dynamic(
  () => import('../../../../src/shared/ui/MapDisplay').then((m) => m.MapDisplay),
  { ssr: false, loading: () => <div className="h-[220px] w-full animate-pulse bg-[#f3f4f6] dark:bg-[#111111]" /> }
);

interface StoreData {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  image_url: string | null;
  owner_name: string;
  product_count: number;
}

interface Product {
  id: string;
  name: string;
  base_price: number;
  thumbnail: string | null;
  category_name: string | null;
}

function parseCoords(address: string | null) {
  if (!address) return { text: '', lat: null as null | number, lng: null as null | number };
  const m = address.match(/Coordinates:\s*([-\d.]+),\s*([-\d.]+)/i);
  if (!m) return { text: address.trim(), lat: null, lng: null };
  const idx = address.toLowerCase().indexOf('coordinates:');
  return { text: idx > 0 ? address.slice(0, idx).trim() : '', lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
}

const DEFAULT_STORE_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop";

export default function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { t, language } = useTranslation();
  const { w } = useWebI18n();
  const { id } = use(params);
  const router = useRouter();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const translatedNames = useTranslatedLabelMap(products.map((product) => ({ id: product.id, label: product.name })), language);

  useEffect(() => {
    Promise.all([
      fetch(`/api/stores/${id}`).then((r) => r.json()),
      fetch(`/api/stores/${id}/products?limit=50`).then((r) => r.json()),
    ]).then(([storeJson, productsJson]) => {
      setStore(storeJson.data?.store ?? storeJson.store ?? null);
      setProducts(productsJson.data?.products ?? productsJson.products ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0f0f0f]">
        <div className="h-56 w-full animate-pulse bg-black/8" />
        <div className="p-5 space-y-3">
          <div className="h-6 w-2/3 rounded-full bg-black/8 animate-pulse" />
          <div className="h-4 w-1/2 rounded-full bg-black/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
        <StoreIcon size={40} className="text-[#9ca3af]" />
        <p className="text-[16px] font-bold text-[#111111] dark:text-white">{t.stores_not_found}</p>
        <button onClick={() => router.back()} className="rounded-full border border-black/10 px-5 py-2 text-sm dark:border-white/10 dark:text-white">{t.back}</button>
      </div>
    );
  }

  const { text: addressText, lat: addressLat, lng: addressLng } = parseCoords(store.address);
  const { text: descriptionText, lat: descriptionLat, lng: descriptionLng } = parseCoords(store.description);
  const lat = addressLat ?? descriptionLat;
  const lng = addressLng ?? descriptionLng;

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0f0f0f]">
      {/* Hero */}
      <div className="relative h-56 w-full overflow-hidden bg-[#111111]">
        <img
          src={store.image_url || DEFAULT_STORE_IMAGE}
          alt={store.name}
          className="h-full w-full object-contain"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/50"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="absolute bottom-4 left-5 right-5">
          <h1 className="text-[24px] font-black text-white drop-shadow-md">{store.name}</h1>
          {addressText && (
            <div className="mt-1 flex items-center gap-1 text-[13px] text-white/80">
              <MapPin size={12} className="shrink-0" />
              <span className="line-clamp-1">{addressText}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-8">
        {/* Store meta */}
        <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-[24px] border border-black/8 bg-white p-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] dark:border-white/10 dark:bg-[#1a1a1a] md:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[#00c853]/10 text-[#00a645]">
                <StoreIcon size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-[28px] font-black leading-none text-[#111111] dark:text-white">{store.name}</h2>
                  <span className="inline-flex h-8 items-center rounded-full bg-[#00c853]/10 px-3 text-[12px] font-bold text-[#008d3a] ring-1 ring-[#00c853]/15">
                    {t.items_count.replace('{count}', String(store.product_count))}
                  </span>
                </div>
                <p className="mt-2 text-[15px] text-[#6b7280] dark:text-[#9ca3af]">{store.owner_name}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {addressText ? (
                <div className="rounded-[20px] border border-black/6 bg-[#f8f9fb] px-4 py-4 dark:border-white/8 dark:bg-[#202020]">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00c853]/10 text-[#00a645]">
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">{w.shopPage.location}</p>
                      <p className="mt-1.5 text-[15px] leading-7 text-[#374151] dark:text-[#d1d5db]">{addressText}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                {store.phone ? (
                  <a
                    href={`tel:${phoneHref(store.phone)}`}
                    className="inline-flex h-12 items-center gap-3 rounded-[18px] border border-black/8 bg-transparent px-4 text-[15px] font-bold text-[#111111] transition-all hover:border-[#00c853]/40 hover:text-[#008d3a] dark:border-white/10 dark:text-white"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00c853]/10 text-[#00a645]">
                      <Phone size={15} />
                    </span>
                    {formatPhoneNumber(store.phone)}
                  </a>
                ) : null}

                {lat && lng ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center gap-2 rounded-[18px] bg-[#00c853] px-5 text-[15px] font-bold text-[#052e14] transition-all hover:bg-[#0bd45a]"
                  >
                    <Navigation size={15} />
                    {t.view}
                  </a>
                ) : null}
              </div>

              {descriptionText ? (
                <p className="max-w-[62ch] text-[14px] leading-7 text-[#4b5563] dark:text-[#cbd5e1]">{descriptionText}</p>
              ) : null}
            </div>
          </div>

          {lat && lng ? (
            <div className="overflow-hidden rounded-[24px] border border-black/8 bg-white p-2 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] dark:border-white/10 dark:bg-[#1a1a1a]">
              <div className="overflow-hidden rounded-[20px]">
                <MapDisplay lat={lat} lng={lng} height={320} label={addressText || store.name} />
              </div>
            </div>
          ) : null}
        </div>

        {/* Products */}
        <h2 className="mb-4 text-[18px] font-black text-[#111111] dark:text-white">{t.products_page_title}</h2>
        {products.length === 0 ? (
          <div className="rounded-[24px] border border-black/8 bg-white py-16 text-center dark:border-white/10 dark:bg-[#1a1a1a]">
            <Package size={36} className="mx-auto mb-3 text-[#d1d5db]" />
            <p className="text-[14px] text-[#9ca3af]">{w.shopPage.noProducts}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {products.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className="block rounded-[20px] border border-black/5 bg-white p-2.5 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] dark:border-white/5 dark:bg-[#1a1a1a]">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[14px] bg-[#f3f4f6] dark:bg-[#111111]">
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail} alt={sanitizeProductLabel(translatedNames[p.id] ?? p.name, language)} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package size={24} className="text-[#d1d5db]" />
                    </div>
                  )}
                </div>
                <div className="mt-2 px-0.5">
                  {p.category_name && <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af]">{p.category_name}</p>}
                  <p className="mt-0.5 line-clamp-2 text-[12px] font-bold text-[#111111] dark:text-white">{sanitizeProductLabel(translatedNames[p.id] ?? p.name, language)}</p>
                  <p className="mt-1 text-[13px] font-black text-[#00c853]">{formatPrice(Number(p.base_price), 'UZS', language)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
