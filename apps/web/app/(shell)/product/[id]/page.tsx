'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Heart, Loader2, Package, Store } from 'lucide-react';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('marketplace_token') : null;
}

interface ProductImage {
  id: string;
  url: string;
  sort_order: number;
}

interface ProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  price: number;
  stock: number;
}

interface ProductDetail {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  sku: string;
  is_active: boolean;
  views: number;
  created_at: string;
  category_id: string | null;
  category_name: string | null;
  store_id: string;
  store_name: string;
  images: ProductImage[];
  variants: ProductVariant[];
}

interface SimilarProduct {
  id: string;
  name: string;
  base_price: number;
  thumbnail: string | null;
  store_name: string | null;
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [similar, setSimilar] = useState<SimilarProduct[]>([]);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((json) => {
        const p = json.data?.product ?? json.product ?? null;
        setProduct(p);
        if (p?.variants?.length) setSelectedVariant(p.variants[0]);
        setLoading(false);
        if (p?.category_id) {
          fetch(`/api/products?category=${p.category_id}&limit=8`)
            .then((r) => r.json())
            .then((sj) => {
              const rows: SimilarProduct[] = sj.data?.products ?? sj.products ?? [];
              setSimilar(rows.filter((r) => r.id !== p.id).slice(0, 6));
            })
            .catch(() => {});
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const token = getToken();
    if (!token || !id) return;
    fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        const rows: { product_id: string }[] = json?.data ?? json ?? [];
        setFavorited(rows.some((r) => r.product_id === id));
      })
      .catch(() => {});
  }, [id]);

  const toggleFav = async () => {
    const token = getToken();
    if (!token) return;
    setFavLoading(true);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: id }),
      });
      if (res.ok) {
        const json = await res.json();
        setFavorited(json.data?.favorited ?? json.favorited ?? !favorited);
      }
    } catch { /* noop */ } finally {
      setFavLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0f0f0f]">
        <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="aspect-[3/4] w-full animate-pulse rounded-[28px] bg-black/8 dark:bg-white/8" />
            <div className="space-y-4 pt-4">
              <div className="h-4 w-1/3 rounded-full bg-black/8 animate-pulse" />
              <div className="h-8 w-3/4 rounded-full bg-black/8 animate-pulse" />
              <div className="h-6 w-1/2 rounded-full bg-black/8 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <Package size={40} className="text-[#9ca3af]" />
        <p className="text-[16px] font-bold text-[#111111] dark:text-white">Mahsulot topilmadi</p>
        <button
          onClick={() => router.back()}
          className="rounded-full border border-black/10 px-5 py-2 text-sm dark:border-white/10 dark:text-white"
        >
          Orqaga
        </button>
      </div>
    );
  }

  const images = product.images?.length ? product.images.sort((a, b) => a.sort_order - b.sort_order) : [];
  const displayPrice = selectedVariant ? selectedVariant.price : product.base_price;

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-10">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-1.5 text-[13px] font-semibold text-[#6b7280] hover:text-[#111111] dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Orqaga
        </button>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
          {/* Gallery */}
          <div>
            <div className="overflow-hidden rounded-[28px] bg-white dark:bg-[#1a1a1a] border border-black/8 dark:border-white/8">
              {images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[activeImg]?.url}
                  alt={product.name}
                  className="aspect-[3/4] w-full object-cover"
                />
              ) : (
                <div className="aspect-[3/4] flex items-center justify-center bg-[#f3f4f6] dark:bg-[#111111]">
                  <Package size={64} className="text-[#d1d5db]" />
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImg(i)}
                    className={`shrink-0 h-16 w-16 overflow-hidden rounded-[12px] border-2 transition-all ${
                      i === activeImg
                        ? 'border-[#00c853]'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {product.category_name && (
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#00a645]">
                {product.category_name}
              </p>
            )}
            <h1 className="mt-1.5 text-[28px] font-black leading-tight text-[#111111] dark:text-white md:text-[34px]">
              {product.name}
            </h1>
            <p className="mt-3 text-[32px] font-black text-[#00c853]">
              {Number(displayPrice).toLocaleString()} so&apos;m
            </p>

            {product.description && (
              <p className="mt-4 text-[14px] leading-relaxed text-[#6b7280]">
                {product.description}
              </p>
            )}

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div className="mt-6">
                {/* Sizes */}
                {product.variants.some((v) => v.size) && (
                  <div className="mb-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">O'lcham</p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.filter((v) => v.size).map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`h-10 min-w-[40px] rounded-xl px-3 text-[13px] font-bold transition-all border ${
                            selectedVariant?.id === v.id
                              ? 'border-[#00c853] bg-[#00c853]/10 text-[#008d3a]'
                              : 'border-black/10 text-[#6b7280] hover:border-[#00c853]/50 dark:border-white/10 dark:text-[#9ca3af]'
                          }`}
                        >
                          {v.size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Colors */}
                {product.variants.some((v) => v.color) && (
                  <div className="mb-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">Rang</p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.filter((v) => v.color).map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`h-10 rounded-xl px-3 text-[13px] font-bold transition-all border ${
                            selectedVariant?.id === v.id
                              ? 'border-[#00c853] bg-[#00c853]/10 text-[#008d3a]'
                              : 'border-black/10 text-[#6b7280] hover:border-[#00c853]/50 dark:border-white/10 dark:text-[#9ca3af]'
                          }`}
                        >
                          {v.color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stock badge */}
            {selectedVariant && (
              <div className="mt-2 mb-4">
                {selectedVariant.stock > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00c853]/10 px-3 py-1 text-[12px] font-bold text-[#008d3a]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00c853]" />
                    {selectedVariant.stock} ta mavjud
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[12px] font-bold text-red-500">
                    Mavjud emas
                  </span>
                )}
              </div>
            )}

            <button
              onClick={toggleFav}
              disabled={favLoading}
              className={`mt-auto flex h-12 items-center justify-center gap-2.5 rounded-full border px-8 text-[14px] font-black transition-all hover:-translate-y-0.5 disabled:opacity-60 ${
                favorited
                  ? 'border-rose-400/30 bg-rose-50 text-rose-500 hover:shadow-[0_14px_28px_-10px_rgba(239,68,68,0.3)] dark:bg-rose-500/10'
                  : 'border-black/10 bg-white text-[#111111] hover:border-rose-400/40 hover:text-rose-500 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white'
              }`}
            >
              {favLoading
                ? <Loader2 size={17} className="animate-spin" />
                : <Heart size={17} className={favorited ? 'fill-current' : ''} />
              }
              {favorited ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}
            </button>

            {/* Store link */}
            <Link
              href={`/store/${product.store_id}`}
              className="mt-4 flex items-center gap-3 rounded-[18px] border border-black/8 bg-white p-4 transition-all hover:border-[#00c853]/40 dark:border-white/10 dark:bg-[#1a1a1a]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00c853]/10 text-[#00a645]">
                <Store size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#9ca3af]">Do'kon</p>
                <p className="text-[14px] font-bold text-[#111111] dark:text-white truncate">{product.store_name}</p>
              </div>
              <ChevronLeft size={16} className="rotate-180 text-[#9ca3af]" />
            </Link>

            {/* Meta */}
            <div className="mt-3 flex items-center gap-3 text-[12px] text-[#9ca3af]">
              <span>{product.views} ko'rishlar</span>
              <span>·</span>
              <span>SKU: {product.sku}</span>
            </div>
          </div>
        </div>

        {/* Similar products */}
        {similar.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-5 text-[20px] font-black text-[#111111] dark:text-white">
              O&apos;xshash mahsulotlar
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {similar.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="group overflow-hidden rounded-[20px] border border-black/8 bg-white dark:border-white/8 dark:bg-[#1a1a1a] transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="aspect-[3/4] w-full overflow-hidden bg-[#f3f4f6] dark:bg-[#111111]">
                    {p.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.thumbnail}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package size={28} className="text-[#d1d5db]" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-[12px] font-bold text-[#111111] dark:text-white">{p.name}</p>
                    <p className="mt-0.5 text-[13px] font-black text-[#00c853]">
                      {Number(p.base_price).toLocaleString()} so&apos;m
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
