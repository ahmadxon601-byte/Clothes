'use client';

import { useEffect, useMemo, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronLeft, Heart, Loader2, MapPin, Package, Store } from 'lucide-react';
import { RichTextContent } from '../../../../src/shared/ui/RichTextContent';
import { getVariantMeta, getDepartmentBySlug } from '../../../../src/shared/lib/productCategoryMeta';
import { useTranslation } from '../../../../src/shared/lib/i18n';
import { translateText, translateHtmlToPlainText } from '../../../../src/shared/lib/translateClient';
import { detectSourceLanguage, sanitizeProductLabel } from '../../../../src/shared/lib/webProductText';
import { formatPrice } from '../../../../src/shared/lib/formatPrice';

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
  location?: {
    latitude?: number | string | null;
    longitude?: number | string | null;
    address?: string | null;
  } | null;
  thumbnail?: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  marketing_campaign?: {
    id: string;
    name: string;
    label: string;
    type: string;
    status: string;
    description?: string;
    summary?: string;
  } | null;
}

interface SimilarProduct {
  id: string;
  name: string;
  base_price: number;
  thumbnail: string | null;
  store_name: string | null;
}

function isValidLatLng(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function parseAddressCoords(raw: string | null | undefined): { text: string; lat: number | null; lng: number | null } {
  if (!raw) return { text: '', lat: null, lng: null };
  const value = raw.trim();

  const labeledMatch = value.match(/Coordinates:\s*([-\d.]+)\s*,\s*([-\d.]+)/i);
  if (labeledMatch) {
    const lat = parseFloat(labeledMatch[1]);
    const lng = parseFloat(labeledMatch[2]);
    const text = value.replace(labeledMatch[0], '').trim();
    if (isValidLatLng(lat, lng)) return { text, lat, lng };
  }

  const latLngMatch = value.match(/lat(?:itude)?\s*[:=]\s*([-\d.]+).{0,40}?(?:lng|lon|longitude)\s*[:=]\s*([-\d.]+)/i);
  if (latLngMatch) {
    const lat = parseFloat(latLngMatch[1]);
    const lng = parseFloat(latLngMatch[2]);
    const text = value.replace(latLngMatch[0], '').trim();
    if (isValidLatLng(lat, lng)) return { text, lat, lng };
  }

  const plainMatch = value.match(/([+-]?\d{1,2}(?:\.\d+)?)\s*,\s*([+-]?\d{1,3}(?:\.\d+)?)/);
  if (plainMatch) {
    const lat = parseFloat(plainMatch[1]);
    const lng = parseFloat(plainMatch[2]);
    const text = value.replace(plainMatch[0], '').trim();
    if (isValidLatLng(lat, lng)) return { text, lat, lng };
  }

  return { text: value, lat: null, lng: null };
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, language } = useTranslation();
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [similar, setSimilar] = useState<SimilarProduct[]>([]);
  const [translatedName, setTranslatedName] = useState('');
  const [translatedDescription, setTranslatedDescription] = useState('');
  const [translatedSimilar, setTranslatedSimilar] = useState<Record<string, string>>({});
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [fallbackCoords, setFallbackCoords] = useState<{ lat: number; lng: number } | null>(null);
  const variants = useMemo(() => product?.variants ?? [], [product?.variants]);
  const images = useMemo(
    () => (product?.images?.length ? [...product.images].sort((a, b) => a.sort_order - b.sort_order) : []),
    [product?.images]
  );
  const displayImage = images[activeImg]?.url || product?.thumbnail || null;
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
  const productLat = product?.location?.latitude == null ? null : Number(product.location.latitude);
  const productLng = product?.location?.longitude == null ? null : Number(product.location.longitude);
  const storeLat = storeLatFromAddress ?? storeLatFromDescription ?? (Number.isFinite(productLat) ? productLat : null) ?? fallbackCoords?.lat ?? null;
  const storeLng = storeLngFromAddress ?? storeLngFromDescription ?? (Number.isFinite(productLng) ? productLng : null) ?? fallbackCoords?.lng ?? null;
  const storeAddressLabel = storeAddressText || product?.location?.address || '';
  const storeMapLabel = storeAddressText || product?.location?.address || product?.store_name || '';
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('marketplace_token');
    if (!token || !product?.id) {
      setIsFav(false);
      return;
    }

    fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        const rows = json?.data ?? [];
        setIsFav(Array.isArray(rows) && rows.some((item) => item?.product_id === product.id));
      })
      .catch(() => {});
  }, [product?.id]);

  useEffect(() => {
    let cancelled = false;
    if (!product) return;

    const baseName = sanitizeProductLabel(product.name, language);
    setTranslatedName(baseName);
    setTranslatedDescription(product.description ?? '');

    if (language === 'uz') return;

    const run = async () => {
      try {
        const [name, description] = await Promise.all([
          translateText(product.name, language, detectSourceLanguage(product.name)),
          product.description ? translateHtmlToPlainText(product.description, language, detectSourceLanguage(product.description)) : Promise.resolve(''),
        ]);
        if (!cancelled) {
          setTranslatedName(sanitizeProductLabel(name, language));
          setTranslatedDescription(description || product.description || '');
        }
      } catch {
        if (!cancelled) {
          setTranslatedName(baseName);
          setTranslatedDescription(product.description ?? '');
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [language, product]);

  useEffect(() => {
    let cancelled = false;
    const base = Object.fromEntries(similar.map((item) => [item.id, sanitizeProductLabel(item.name, language)]));
    setTranslatedSimilar(base);
    if (language === 'uz' || similar.length === 0) return;

    const run = async () => {
      const translated = await Promise.all(
        similar.map(async (item) => {
          try {
            return [item.id, sanitizeProductLabel(await translateText(item.name, language, detectSourceLanguage(item.name)), language)] as const;
          } catch {
            return [item.id, sanitizeProductLabel(item.name, language)] as const;
          }
        })
      );
      if (!cancelled) setTranslatedSimilar(Object.fromEntries(translated));
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [language, similar]);

  useEffect(() => {
    if (!product) {
      setFallbackCoords(null);
      return;
    }

    const parsedAddress = parseAddressCoords(product.store_address);
    const parsedDescription = parseAddressCoords(product.store_description);
    const productLatValue = product.location?.latitude == null ? null : Number(product.location.latitude);
    const productLngValue = product.location?.longitude == null ? null : Number(product.location.longitude);
    const existingLat = parsedAddress.lat ?? parsedDescription.lat ?? (Number.isFinite(productLatValue) ? productLatValue : null);
    const existingLng = parsedAddress.lng ?? parsedDescription.lng ?? (Number.isFinite(productLngValue) ? productLngValue : null);

    if (existingLat !== null && existingLng !== null) {
      setFallbackCoords({ lat: existingLat, lng: existingLng });
      return;
    }

    const queryText = (parsedAddress.text || parsedDescription.text || product.store_name || '').trim();
    if (!queryText) {
      setFallbackCoords(null);
      return;
    }

    let cancelled = false;
    setFallbackCoords(null);

    void fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryText)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'uz,ru,en' } }
    )
      .then((res) => res.json())
      .then((data: Array<{ lat?: string; lon?: string }>) => {
        if (cancelled) return;
        const item = Array.isArray(data) ? data[0] : undefined;
        const lat = item?.lat ? parseFloat(item.lat) : NaN;
        const lng = item?.lon ? parseFloat(item.lon) : NaN;
        if (isValidLatLng(lat, lng)) {
          setFallbackCoords({ lat, lng });
        } else {
          setFallbackCoords(null);
        }
      })
      .catch(() => {
        if (!cancelled) setFallbackCoords(null);
      });

    return () => {
      cancelled = true;
    };
  }, [product]);

  const handleFav = async () => {
    if (typeof window === 'undefined' || !product) return;
    const token = localStorage.getItem('marketplace_token');
    if (!token) return;

    setFavLoading(true);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: product.id }),
      });
      const json = await res.json().catch(() => ({}));
      const favorited = json?.data?.favorited ?? json?.favorited;
      if (typeof favorited === 'boolean') {
        setIsFav(favorited);
      }
    } catch {
      // ignore
    } finally {
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
        <Package size={40} className="text-[#9ca3af]" />
        <p className="text-[16px] font-bold text-[#111111] dark:text-white">{t.product_not_found}</p>
        <button
          onClick={() => router.back()}
          className="rounded-full border border-black/10 px-5 py-2 text-sm dark:border-white/10 dark:text-white"
        >
          {t.back}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f9fb] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-[1280px] px-0 py-2 sm:px-4 sm:py-6 md:px-8 md:py-10">
        <button
          onClick={() => router.back()}
          aria-label={t.back}
          className="mb-7 ml-1 hidden h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-[#111111] shadow-[0_18px_34px_-22px_rgba(15,23,42,0.32)] transition-all hover:-translate-y-0.5 hover:bg-[#f8fafc] dark:border-white/15 dark:bg-[#161616] dark:text-white dark:shadow-[0_16px_32px_-18px_rgba(0,0,0,0.7)] dark:hover:bg-[#1b1b1b] md:inline-flex"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="grid gap-0 md:grid-cols-2 md:items-start md:gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] lg:gap-14">
          <div className="relative min-w-0">
            <button
              onClick={() => router.back()}
              aria-label={t.back}
              className="absolute left-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/92 text-[#111111] shadow-[0_16px_32px_-18px_rgba(15,23,42,0.35)] backdrop-blur-sm transition-all hover:bg-white md:hidden dark:border-white/20 dark:bg-[#111111]/78 dark:text-white dark:shadow-[0_16px_32px_-18px_rgba(0,0,0,0.75)] dark:hover:bg-[#1b1b1b]/88"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="md:sticky md:top-28">
              <div className="overflow-hidden rounded-[26px] border-y border-black/8 bg-white md:rounded-[32px] md:border md:bg-[linear-gradient(180deg,#ffffff_0%,#f7faf8_100%)] md:p-5 md:shadow-[0_34px_70px_-42px_rgba(15,23,42,0.3)] dark:border-white/8 dark:bg-[#1a1a1a] md:dark:bg-[linear-gradient(180deg,#1a1a1a_0%,#121212_100%)]">
                <button
                  onClick={handleFav}
                  disabled={favLoading}
                  aria-label={t.favorites}
                  className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/92 text-[#111111] shadow-[0_16px_32px_-18px_rgba(15,23,42,0.35)] backdrop-blur-sm transition-all hover:bg-white disabled:cursor-not-allowed md:right-9 md:top-9 dark:border-white/20 dark:bg-[#111111]/78 dark:text-white dark:shadow-[0_16px_32px_-18px_rgba(0,0,0,0.75)] dark:hover:bg-[#1b1b1b]/88"
                >
                  {favLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Heart size={18} className={isFav ? 'fill-red-500 text-red-500' : ''} />
                  )}
                </button>
                {displayImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayImage}
                    alt={translatedName || sanitizeProductLabel(product.name, language)}
                    className="h-[min(68svh,520px)] w-full object-contain md:aspect-[4/4.65] md:rounded-[26px] md:bg-white md:object-contain dark:md:bg-[#101010]"
                  />
                ) : (
                  <div className="flex h-[min(68svh,520px)] items-center justify-center bg-[#f3f4f6] md:aspect-[4/4.65] md:rounded-[26px] dark:bg-[#111111]">
                    <Package size={64} className="text-[#d1d5db]" />
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:px-0 md:mt-4 md:grid md:grid-cols-5 md:gap-3 md:overflow-visible md:px-0">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImg(i)}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-[12px] border-2 bg-white transition-all sm:h-16 sm:w-16 md:h-auto md:w-auto md:aspect-square md:rounded-[18px] ${
                        i === activeImg
                          ? 'border-[#00c853] shadow-[0_12px_24px_-18px_rgba(0,200,83,0.65)]'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 mx-3 flex min-w-0 flex-col rounded-[28px] border border-black/8 bg-white/92 p-4 shadow-[0_22px_48px_-34px_rgba(0,0,0,0.45)] backdrop-blur-sm max-[480px]:mx-2.5 max-[480px]:p-3.5 md:mx-0 md:mt-0 md:rounded-[32px] md:border-black/6 md:bg-white md:p-7 md:shadow-[0_36px_72px_-48px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[#171717]/92 md:dark:bg-[#171717]">
            {product.category_name && (
              <p className="break-words text-[11px] font-bold uppercase tracking-[0.12em] text-[#00a645]">{product.category_name}</p>
            )}
            <h1 className="mt-1.5 break-words text-[20px] font-black leading-tight text-[#111111] dark:text-white sm:text-[28px] md:text-[34px]">{translatedName || sanitizeProductLabel(product.name, language)}</h1>

            {product.marketing_campaign ? (
              <div className="mt-4 rounded-[24px] border border-[#00c853]/20 bg-[linear-gradient(135deg,rgba(0,200,83,0.09),rgba(0,200,83,0.02))] p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#00a645]">Aksiya</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-[#00c853] px-3 py-1 text-[12px] font-black text-white">
                    {product.marketing_campaign.label}
                  </span>
                  <span className="text-[14px] font-bold text-[#111111] dark:text-white">{product.marketing_campaign.name}</span>
                </div>
                {product.marketing_campaign.summary ? (
                  <p className="mt-2 text-[13px] leading-6 text-[#46604c] dark:text-[#b7d7be]">{product.marketing_campaign.summary}</p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 rounded-[24px] border border-[#00c853]/20 bg-[linear-gradient(135deg,rgba(0,200,83,0.08),rgba(0,200,83,0.02))] px-4 py-4 sm:px-5">
              <p className="min-w-0 break-words text-[clamp(28px,8vw,32px)] font-black leading-none text-[#00c853]">{formatPrice(Number(displayPrice), 'UZS', language)}</p>
              {displayPrice < product.base_price && (
                <>
                  <p className="break-words text-[14px] font-semibold text-[#9ca3af] line-through sm:text-[18px]">{formatPrice(Number(product.base_price), 'UZS', language)}</p>
                  <span className="inline-flex min-h-8 items-center rounded-full bg-red-500 px-2.5 py-0.5 text-[12px] font-black text-white">
                    -{Math.round((1 - displayPrice / product.base_price) * 100)}%
                  </span>
                </>
              )}
            </div>

            {translatedDescription && (
              <RichTextContent
                html={translatedDescription}
                className="mt-4 text-[13px] leading-6 text-[#6b7280] sm:text-[14px] sm:leading-relaxed [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_ul]:ml-5 [&_ul]:list-disc"
              />
            )}

            {(sizeOptions.length > 0 || colorOptions.length > 0) && (
              <div className="mt-5 space-y-4 rounded-[24px] border border-black/8 bg-[#fafafa] p-4 max-[480px]:p-3.5 md:p-5 dark:border-white/10 dark:bg-[#111111]">
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
                          className={`min-h-11 min-w-[44px] rounded-xl border px-3.5 text-[13px] font-bold transition-all ${
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
                          className={`min-h-11 max-w-full rounded-xl border px-3.5 text-[13px] font-bold transition-all ${
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
              <div className="mb-2 mt-4 md:mb-0">
                {selectedVariant.stock > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00c853]/10 px-3 py-1 text-[12px] font-bold text-[#008d3a]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00c853]" />
                    {t.available_count.replace('{count}', String(selectedVariant.stock))}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[12px] font-bold text-red-500">
                    {t.sold_out}
                  </span>
                )}
              </div>
            )}

            <div className="mt-5 space-y-3 md:mt-6">
              <Link
                href={`/store/${product.store_id}`}
                className="flex min-w-0 items-center gap-3 rounded-[22px] border border-black/8 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#00c853]/40 hover:shadow-[0_18px_36px_-24px_rgba(0,0,0,0.35)] max-[480px]:p-3.5 dark:border-white/10 dark:bg-[#1a1a1a]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#00c853]/10 text-[#00a645]">
                  <Store size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-[#9ca3af]">{t.store}</p>
                  <p className="truncate text-[15px] font-bold text-[#111111] dark:text-white">{product.store_name}</p>
                  {storeAddressLabel && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                      <MapPin size={12} className="shrink-0" />
                      {storeAddressLabel}
                    </p>
                  )}
                </div>
                <ChevronLeft size={16} className="rotate-180 text-[#9ca3af]" />
              </Link>

              {storeLat !== null && storeLng !== null && (
                <div className="overflow-hidden rounded-[22px] border border-black/8 bg-white p-1.5 dark:border-white/10 dark:bg-[#1a1a1a]">
                  <div className="overflow-hidden rounded-[18px]">
                    <MapDisplay lat={storeLat} lng={storeLng} height={190} label={storeMapLabel} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <div className="mt-10 px-3 sm:px-0 md:mt-12">
            <h2 className="mb-4 text-[18px] font-black text-[#111111] dark:text-white sm:mb-5 sm:text-[20px]">{t.similar_products}</h2>
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
                      <img src={p.thumbnail} alt={translatedSimilar[p.id] || sanitizeProductLabel(p.name, language)} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package size={28} className="text-[#d1d5db]" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-[12px] font-bold text-[#111111] dark:text-white">{translatedSimilar[p.id] || sanitizeProductLabel(p.name, language)}</p>
                    <p className="mt-0.5 text-[13px] font-black text-[#00c853]">{formatPrice(Number(p.base_price), 'UZS', language)}</p>
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
