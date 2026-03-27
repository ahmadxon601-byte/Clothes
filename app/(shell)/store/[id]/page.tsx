'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, MapPin, Package, Phone, Store as StoreIcon } from 'lucide-react';

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
  const { id } = use(params);
  const router = useRouter();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
        <p className="text-[16px] font-bold text-[#111111] dark:text-white">Do&apos;kon topilmadi</p>
        <button onClick={() => router.back()} className="rounded-full border border-black/10 px-5 py-2 text-sm dark:border-white/10 dark:text-white">Orqaga</button>
      </div>
    );
  }

  const { text: addressText, lat, lng } = parseCoords(store.address);

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0f0f0f]">
      {/* Hero */}
      <div className="relative h-56 w-full overflow-hidden bg-[#111111]">
        <img
          src={store.image_url || DEFAULT_STORE_IMAGE}
          alt={store.name}
          className="h-full w-full object-cover opacity-60"
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

      <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8">
        {/* Store meta */}
        <div className="mb-6 rounded-[24px] border border-black/8 bg-white p-5 dark:border-white/10 dark:bg-[#1a1a1a]">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00c853]/10 text-[#00a645]">
              <StoreIcon size={22} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-[#111111] dark:text-white">{store.name}</p>
              <p className="text-[13px] text-[#6b7280]">{store.owner_name}</p>
            </div>
            <span className="rounded-full bg-[#00c853]/10 px-3 py-1 text-[12px] font-bold text-[#008d3a]">
              {store.product_count} ta mahsulot
            </span>
          </div>
          {store.phone && (
            <a href={`tel:${store.phone}`} className="mt-4 flex items-center gap-2 text-[14px] font-semibold text-[#111111] dark:text-white">
              <Phone size={14} className="text-[#00a645]" /> {store.phone}
            </a>
          )}
          {store.description && (
            <p className="mt-3 text-[13px] text-[#6b7280]">{store.description.replace(/\s*Coordinates:.*$/i, '').trim()}</p>
          )}
          {lat && lng && (
            <a
              href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#00c853]/30 bg-[#f0faf4] px-4 py-2 text-[13px] font-bold text-[#008d3a] dark:bg-[#0e2e1a]"
            >
              <MapPin size={14} /> Xaritada ko&apos;rish
            </a>
          )}
        </div>

        {/* Products */}
        <h2 className="mb-4 text-[18px] font-black text-[#111111] dark:text-white">Mahsulotlar</h2>
        {products.length === 0 ? (
          <div className="rounded-[24px] border border-black/8 bg-white py-16 text-center dark:border-white/10 dark:bg-[#1a1a1a]">
            <Package size={36} className="mx-auto mb-3 text-[#d1d5db]" />
            <p className="text-[14px] text-[#9ca3af]">Do&apos;konda hozircha mahsulot yo&apos;q</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className="block rounded-[20px] border border-black/5 bg-white p-2.5 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] dark:border-white/5 dark:bg-[#1a1a1a]">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[14px] bg-[#f3f4f6] dark:bg-[#111111]">
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package size={24} className="text-[#d1d5db]" />
                    </div>
                  )}
                </div>
                <div className="mt-2 px-0.5">
                  {p.category_name && <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af]">{p.category_name}</p>}
                  <p className="mt-0.5 line-clamp-2 text-[12px] font-bold text-[#111111] dark:text-white">{p.name}</p>
                  <p className="mt-1 text-[13px] font-black text-[#00c853]">{Number(p.base_price).toLocaleString()} so&apos;m</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
