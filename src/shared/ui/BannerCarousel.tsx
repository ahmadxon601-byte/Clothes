'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { useSSERefetch } from '../hooks/useSSERefetch';
import { translateText, type UiLanguage } from '../lib/translateClient';

interface BannerData {
  id: string;
  title: string;
  image_url?: string | null;
}

type Props = {
  variant?: 'desktop' | 'telegram';
};

function detectSourceLanguage(text: string): UiLanguage {
  if (/[А-Яа-яЁё]/.test(text)) return 'ru';
  if (/[A-Za-z]/.test(text)) return 'uz';
  return 'uz';
}

export function BannerCarousel({ variant = 'desktop' }: Props) {
  const { language } = useTranslation();
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [current, setCurrent] = useState(0);
  const [translatedTitle, setTranslatedTitle] = useState('');
  const isDesktop = variant === 'desktop';

  const loadBanner = useCallback(() => {
    fetch('/api/banners')
      .then((r) => r.json())
      .then((j) => {
        const next = j?.data?.banners ?? [];
        setBanners(Array.isArray(next) ? next : []);
        setCurrent(0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadBanner();
  }, [loadBanner]);

  useSSERefetch(['banners'], loadBanner);

  useEffect(() => {
    let cancelled = false;
    const title = banners[current]?.title?.trim() ?? '';
    setTranslatedTitle(title);
    if (!title || language === 'uz') return;

    translateText(title, language, detectSourceLanguage(title))
      .then((nextTitle) => {
        if (!cancelled) setTranslatedTitle(nextTitle || title);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [banners, current, language]);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [banners]);

  if (banners.length === 0) return null;

  const banner = banners[current];
  if (!banner) return null;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[24px] ${
        isDesktop ? 'h-[380px]' : 'h-[220px] rounded-[20px]'
      }`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: banner.image_url ? `url(${banner.image_url})` : undefined,
          backgroundColor: banner.image_url ? undefined : '#1a1a2e',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/52 to-black/18" />

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/16 text-white backdrop-blur-sm transition hover:bg-white/28"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => setCurrent((prev) => (prev + 1) % banners.length)}
            className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/16 text-white backdrop-blur-sm transition hover:bg-white/28"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      <div className={`absolute inset-0 flex items-end ${isDesktop ? 'p-8' : 'p-4'}`}>
        <h3
          className={`max-w-[min(90%,680px)] font-black leading-tight text-white ${
            isDesktop ? 'text-[28px]' : 'text-[18px]'
          }`}
        >
          {translatedTitle || banner.title}
        </h3>
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {banners.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrent(index)}
              className={index === current ? 'h-1.5 w-5 rounded-full bg-white' : 'h-1.5 w-1.5 rounded-full bg-white/45'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
