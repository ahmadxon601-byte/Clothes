'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerProduct {
  id: string;
  name: string;
  base_price: number;
  sale_price: number | null;
  thumbnail: string | null;
}

interface BannerData {
  id: string;
  title: string;
  products: BannerProduct[];
}

type Props = {
  /** 'desktop' or 'telegram' — controls height and styling */
  variant?: 'desktop' | 'telegram';
  /** Route prefix for product links */
  productRoute?: (id: string) => string;
};

export function BannerCarousel({ variant = 'desktop', productRoute }: Props) {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    fetch('/api/banners')
      .then(r => r.json())
      .then(j => { if (j?.data?.banner) setBanner(j.data.banner); })
      .catch(() => {});
  }, []);

  const products = banner?.products ?? [];
  const count = products.length;

  const goTo = useCallback((idx: number) => {
    setFading(true);
    setTimeout(() => {
      setCurrent(idx);
      setFading(false);
    }, 250);
  }, []);

  const next = useCallback(() => goTo((current + 1) % count), [current, count, goTo]);
  const prev = useCallback(() => goTo((current - 1 + count) % count), [current, count, goTo]);

  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(next, 10000);
    return () => clearInterval(t);
  }, [count, next]);

  if (!banner || count === 0) return null;

  const product = products[current];
  if (!product) return null;

  const bp = Number(product.base_price);
  const sp = product.sale_price != null ? Number(product.sale_price) : null;
  const cur = sp != null && sp < bp ? sp : bp;
  const hasDis = cur < bp;
  const pct = hasDis ? Math.round((1 - cur / bp) * 100) : 0;
  const fmt = (n: number) => n.toLocaleString('ru-RU');

  const href = productRoute ? productRoute(product.id) : `/product/${product.id}`;

  const isDesktop = variant === 'desktop';

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[24px] select-none ${
        isDesktop ? 'h-[380px]' : 'h-[220px] rounded-[20px]'
      }`}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-300"
        style={{
          backgroundImage: product.thumbnail
            ? `url(${product.thumbnail})`
            : undefined,
          backgroundColor: product.thumbnail ? undefined : '#1a1a2e',
          opacity: fading ? 0 : 1,
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
          fading ? 'opacity-0' : 'opacity-100'
        } ${isDesktop ? 'p-8' : 'p-4'}`}
      >
        {hasDis && (
          <span
            className={`mb-2 self-start rounded-full bg-red-500 font-black text-white ${
              isDesktop ? 'px-3 py-1 text-[11px]' : 'px-2 py-0.5 text-[9px]'
            }`}
          >
            −{pct}%
          </span>
        )}
        <h3
          className={`font-black leading-tight text-white line-clamp-2 ${
            isDesktop ? 'text-[28px] max-w-lg' : 'text-[16px] max-w-[240px]'
          }`}
        >
          {product.name}
        </h3>
        <div className={`flex items-baseline gap-2 ${isDesktop ? 'mt-2' : 'mt-1'}`}>
          <span
            className={`font-black text-[#00e676] ${
              isDesktop ? 'text-[22px]' : 'text-[14px]'
            }`}
          >
            {fmt(cur)} so&apos;m
          </span>
          {hasDis && (
            <span
              className={`text-white/50 line-through ${
                isDesktop ? 'text-[14px]' : 'text-[11px]'
              }`}
            >
              {fmt(bp)}
            </span>
          )}
        </div>
        <Link
          href={href}
          className={`mt-3 self-start rounded-full bg-white font-black text-[#111111] transition-opacity hover:opacity-90 active:scale-95 ${
            isDesktop ? 'px-6 py-2.5 text-[13px]' : 'px-4 py-2 text-[11px]'
          }`}
        >
          Ko&apos;rish
        </Link>
      </div>

      {/* Arrows (desktop only) */}
      {isDesktop && count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/40"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/40"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all ${
                i === current
                  ? 'bg-white w-5 h-1.5'
                  : 'bg-white/40 w-1.5 h-1.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
