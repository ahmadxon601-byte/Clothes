'use client';

import { useEffect, useMemo, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronLeft, MapPin, Package, Store } from 'lucide-react';
import { RichTextContent } from '../../../../src/shared/ui/RichTextContent';
import { getVariantMeta, getDepartmentBySlug } from '../../../../src/shared/lib/productCategoryMeta';

const MapDisplay = dynamic(
  () => import('../../../../src/shared/ui/MapDisplay').then((m) => m.MapDisplay),
  { ssr: false, loading: () => <div className="h-[170px] w-full animate-pulse bg-[#f3f4f6] dark:bg-[#111111]" /> }
);

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
  category_slug?: string | null;
  store_id: string;
  store_name: string;
  store_address?: string | null;
  store_description?: string | null;
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

function parseAddressCoords(raw: string | null | undefined): { text: string; lat: number | null; lng: number | null } {
  if (!raw) return { text: '', lat: null, lng: null };
  const m = raw.match(/Coordinates:\s*([-\d.]+),\s*([-\d.]+)/i);
  const text = raw.replace(/\s*Coordinates:.*$/i, '').trim();
  if (!m) return { text, lat: null, lng: null };
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { text, lat: null, lng: null };
  return { text, lat, lng };
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [similar, setSimilar] = useState<SimilarProduct[]>([]);
  const variants = useMemo(() => product?.variants ?? [], [product?.variants]);
  const images = useMemo(
    () => (product?.images?.length ? [...product.images].sort((a, b) => a.sort_order - b.sort_order) : []),
    [product?.images]
  );
  const sizeOptions = useMemo(
    () => Array.from(new Set(variants.map((v) => v.size).filter((v): v is string => Boolean(v)))),
    [variants]
  );
  const colorOptions = useMemo(
    () => Array.from(new Set(variants.map((v) => v.color).filter((v): v is string => Boolean(v)))),
    [variants]
  );
  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    return (
      variants.find((v) => (selectedSize ? v.size === selectedSize : true) && (selectedColor ? v.color === selectedColor : true)) ||
      variants.find((v) => (selectedSize ? v.size === selectedSize : true)) ||
      variants.find((v) => (selectedColor ? v.color === selectedColor : true)) ||
      variants[0]
    );
  }, [variants, selectedSize, selectedColor]);
  const displayPrice = selectedVariant ? selectedVariant.price : product?.base_price ?? 0;
  const {
    text: storeAddressText,
    lat: storeLatFromAddress,
    lng: storeLngFromAddress,
  } = parseAddressCoords(product?.store_address);
  const { lat: storeLatFromDescription, lng: storeLngFromDescription } = parseAddressCoords(product?.store_description);
  const storeLat = storeLatFromAddress ?? storeLatFromDescription;
  const storeLng = storeLngFromAddress ?? storeLngFromDescription;
  const variantLabel = getVariantMeta(getDepartmentBySlug(product?.category_slug ?? null)).label;

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((json) => {
        const p = json.data?.product ?? json.product ?? null;
        setProduct(p);
        if (p?.store_id) {
          fetch(`/api/stores/${p.store_id}`)
            .then((r) => r.json())
            .then((sj) => {
              const addr = sj?.data?.store?.address ?? sj?.store?.address ?? null;
              const desc = sj?.data?.store?.description ?? sj?.store?.description ?? null;
              setProduct((prev) => (prev ? { ...prev, store_address: addr, store_description: desc } : prev));
            })
            .catch(() => {});
        }
        if (p?.variants?.length) {
          setSelectedSize(p.variants[0].size ?? null);
          setSelectedColor(p.variants[0].color ?? null);
        }
        setLoading(false);
        if (p?.category_id) {
          fetch(`/api/products?category=${p.category_id}&limit=8`)
            .then((r) => r.json())
            .then((sj) => {
              const rows: SimilarProduct[] = sj.data?.products ?? sj.products ?? [];
              setSimilar(rows.filter((x) => x.id !== p.id).slice(0, 6));
            })
            .catch(() => {});
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
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

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-10">
        <button
          onClick={() => router.back()}
          aria-label="Orqaga"
          className="mb-7 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#111111] text-white shadow-[0_16px_32px_-18px_rgba(0,0,0,0.7)] transition-all hover:-translate-y-0.5 hover:bg-[#1b1b1b] dark:border-white/15 dark:bg-[#161616]"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
          <div>
            <div className="overflow-hidden rounded-[28px] border border-black/8 bg-white dark:border-white/8 dark:bg-[#1a1a1a]">
              {images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[activeImg]?.url} alt={product.name} className="aspect-[3/4] w-full object-cover" />
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center bg-[#f3f4f6] dark:bg-[#111111]">
                  <Package size={64} className="text-[#d1d5db]" />
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImg(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-[12px] border-2 transition-all ${
                      i === activeImg ? 'border-[#00c853]' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col rounded-[28px] border border-black/8 bg-white/85 p-5 shadow-[0_22px_48px_-34px_rgba(0,0,0,0.45)] backdrop-blur-sm dark:border-white/10 dark:bg-[#171717]/85 md:p-6">
            <h1 className="mt-1.5 text-[28px] font-black leading-tight text-[#111111] dark:text-white md:text-[34px]">{product.name}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#00c853]/20 bg-[#00c853]/5 px-4 py-3">
              <p className="text-[32px] font-black text-[#00c853]">{Number(displayPrice).toLocaleString()} so&apos;m</p>
              {displayPrice < product.base_price && (
                <>
                  <p className="text-[18px] font-semibold text-[#9ca3af] line-through">{Number(product.base_price).toLocaleString()} so&apos;m</p>
                  <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-0.5 text-[12px] font-black text-white">
                    -{Math.round((1 - displayPrice / product.base_price) * 100)}%
                  </span>
                </>
              )}
            </div>

            {product.description && (
              <RichTextContent
                html={product.description}
                className="mt-4 text-[14px] leading-relaxed text-[#6b7280] [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_ul]:ml-5 [&_ul]:list-disc"
              />
            )}

            {(sizeOptions.length > 0 || colorOptions.length > 0) && (
              <div className="mt-6 space-y-4 rounded-2xl border border-black/8 bg-[#fafafa] p-4 dark:border-white/10 dark:bg-[#111111]">
                {sizeOptions.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{variantLabel}</p>
                    <div className="flex flex-wrap gap-2">
                      {sizeOptions.map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setSelectedSize(size);
                            const fit = variants.find((v) => v.size === size && (selectedColor ? v.color === selectedColor : true)) || variants.find((v) => v.size === size);
                            if (fit?.color) setSelectedColor(fit.color);
                          }}
                          className={`h-10 min-w-[40px] rounded-xl border px-3 text-[13px] font-bold transition-all ${
                            selectedSize === size
                              ? 'border-[#00c853] bg-[#00c853]/10 text-[#008d3a]'
                              : 'border-black/10 text-[#6b7280] hover:border-[#00c853]/50 dark:border-white/10 dark:text-[#9ca3af]'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {colorOptions.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">Rang</p>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            setSelectedColor(color);
                            const fit = variants.find((v) => v.color === color && (selectedSize ? v.size === selectedSize : true)) || variants.find((v) => v.color === color);
                            if (fit?.size) setSelectedSize(fit.size);
                          }}
                          className={`h-10 rounded-xl border px-3 text-[13px] font-bold transition-all ${
                            selectedColor === color
                              ? 'border-[#00c853] bg-[#00c853]/10 text-[#008d3a]'
                              : 'border-black/10 text-[#6b7280] hover:border-[#00c853]/50 dark:border-white/10 dark:text-[#9ca3af]'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedVariant && (
              <div className="mb-4 mt-3">
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

            <Link
              href={`/store/${product.store_id}`}
              className="mt-auto flex items-center gap-3 rounded-[18px] border border-black/8 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#00c853]/40 hover:shadow-[0_18px_36px_-24px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-[#1a1a1a]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00c853]/10 text-[#00a645]">
                <Store size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-[#9ca3af]">Do&apos;kon</p>
                <p className="truncate text-[14px] font-bold text-[#111111] dark:text-white">{product.store_name}</p>
                {storeAddressText && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                    <MapPin size={12} className="shrink-0" />
                    {storeAddressText}
                  </p>
                )}
              </div>
              <ChevronLeft size={16} className="rotate-180 text-[#9ca3af]" />
            </Link>

            {storeLat !== null && storeLng !== null && (
              <div className="mt-3 overflow-hidden rounded-[18px] border border-black/8 dark:border-white/10">
                <MapDisplay lat={storeLat} lng={storeLng} height={170} />
              </div>
            )}

            <div className="mt-3 flex items-center gap-3 text-[12px] text-[#9ca3af]">
              <span>{product.views} ko&apos;rishlar</span>
              <span>&middot;</span>
              <span>SKU: {product.sku}</span>
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-5 text-[20px] font-black text-[#111111] dark:text-white">O&apos;xshash mahsulotlar</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {similar.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="group overflow-hidden rounded-[20px] border border-black/8 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-white/8 dark:bg-[#1a1a1a]"
                >
                  <div className="aspect-[3/4] w-full overflow-hidden bg-[#f3f4f6] dark:bg-[#111111]">
                    {p.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumbnail} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package size={28} className="text-[#d1d5db]" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-[12px] font-bold text-[#111111] dark:text-white">{p.name}</p>
                    <p className="mt-0.5 text-[13px] font-black text-[#00c853]">{Number(p.base_price).toLocaleString()} so&apos;m</p>
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
