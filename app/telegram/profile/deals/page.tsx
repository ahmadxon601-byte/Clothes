'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Package, Percent } from 'lucide-react';
import { getApiToken, setApiToken, telegramWebAppAuth } from '../../../../src/lib/apiClient';
import { isTelegramLoggedOutByUser } from '../../../../src/lib/telegramAuthState';
import { useTelegram } from '../../../../src/telegram/useTelegram';
import { TELEGRAM_ROUTES } from '../../../../src/shared/config/constants';
import { useTranslation } from '../../../../src/shared/lib/i18n';
import { formatPrice } from '../../../../src/shared/lib/formatPrice';
import { useSSERefetch } from '../../../../src/shared/hooks/useSSERefetch';

interface DealItem {
  product_id: string;
  name?: string;
  base_price?: number;
  sale_price?: number | null;
  thumbnail?: string | null;
}

interface DailyDealInvite {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  store_id: string;
  store_name: string;
  campaign_id: string;
  title: string;
  message: string;
  starts_at: string;
  ends_at: string;
  campaign_status: string;
  selected_items: DealItem[];
}

export default function TelegramProfileDealsPage() {
  const { WebApp, isReady } = useTelegram();
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<DailyDealInvite[]>([]);

  const loadInvites = async (tokenArg?: string | null) => {
    const token = tokenArg ?? getApiToken();
    if (!token) {
      setInvites([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/daily-deals/my-invites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      const nextInvites = (json.data?.invites ?? json.invites ?? []) as DailyDealInvite[];
      setInvites(nextInvites.filter((invite) => invite.status === 'accepted' && invite.selected_items?.length));
    } catch {
      setInvites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isReady) return;
    const initData = WebApp?.initData;
    const isLoggedOut = isTelegramLoggedOutByUser();
    if (initData) {
      if (isLoggedOut) {
        loadInvites();
        return;
      }
      telegramWebAppAuth(initData)
        .then((token) => {
          setApiToken(token);
          return loadInvites(token);
        })
        .catch(() => loadInvites());
    } else {
      loadInvites();
    }
  }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useSSERefetch(['daily_deals', 'products'], () => loadInvites());

  const groupedInvites = useMemo(
    () =>
      invites.map((invite) => ({
        ...invite,
        items: invite.selected_items.filter((item) => item.product_id),
      })),
    [invites]
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (!getApiToken()) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface2)]">
          <Percent size={24} className="text-[var(--color-hint)]" />
        </div>
        <p className="text-[17px] font-bold text-[var(--color-text)]">Chegirma bo&apos;limi yopiq</p>
        <p className="mt-2 text-[13px] text-[var(--color-hint)]">
          Mehmon foydalanuvchi bu bo&apos;limdan foydalana olmaydi. Faqat mahsulot ko&apos;rish va sozlamalarni almashtirish ochiq.
        </p>
        <Link
          href={TELEGRAM_ROUTES.HOME}
          className="mx-auto mt-5 flex h-11 w-full max-w-xs items-center justify-center rounded-full bg-[var(--color-primary)] text-[13px] font-bold text-white"
        >
          Mahsulotlarga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pb-8">
      <div className="mb-5 flex items-center justify-between">
        <Link href={TELEGRAM_ROUTES.PROFILE} className="flex items-center gap-2 text-[14px] font-medium text-[var(--color-hint)]">
          <ArrowLeft size={18} /> {t.profile}
        </Link>
        <h2 className="text-[17px] font-bold text-[var(--color-text)]">{t.deal_products}</h2>
        <div className="w-16" />
      </div>

      {groupedInvites.length > 0 ? (
        <div className="space-y-4">
          {groupedInvites.map((invite) => (
            <div key={invite.id} className="rounded-[24px] border border-[var(--color-primary)]/20 bg-[var(--color-surface)] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  <Percent size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--color-primary)]">{invite.store_name}</p>
                  <h3 className="mt-1 text-[18px] font-black text-[var(--color-text)]">{invite.title}</h3>
                  <p className="mt-1 text-[12px] leading-5 text-[var(--color-hint)]">
                    {new Date(invite.starts_at).toLocaleString()} - {new Date(invite.ends_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {invite.items.map((item) => {
                  const base = Number(item.base_price ?? 0);
                  const current =
                    item.sale_price != null && Number(item.sale_price) > 0 && Number(item.sale_price) < base
                      ? Number(item.sale_price)
                      : base;
                  const discount = base > 0 && current < base ? Math.max(1, Math.round((1 - current / base) * 100)) : 0;

                  return (
                    <Link
                      key={item.product_id}
                      href={TELEGRAM_ROUTES.PRODUCT(item.product_id)}
                      className="flex items-center gap-3 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface2)] px-3 py-3 active:scale-[0.99] transition"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--color-surface)]">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.name ?? ''} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package size={20} className="text-[var(--color-hint)]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold text-[var(--color-text)]">{item.name ?? 'Mahsulot'}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-[13px] font-bold text-[var(--color-primary)]">{formatPrice(current, 'UZS', language)}</span>
                          {discount > 0 ? (
                            <>
                              <span className="text-[11px] text-[var(--color-hint)] line-through">{formatPrice(base, 'UZS', language)}</span>
                              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">-{discount}%</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-14 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface2)]">
            <Percent size={22} className="text-[var(--color-hint)]" />
          </div>
          <p className="text-[16px] font-bold text-[var(--color-text)]">{t.deal_products}</p>
          <p className="mt-1 max-w-xs text-[13px] text-[var(--color-hint)]">{t.no_deal_products}</p>
        </div>
      )}
    </div>
  );
}
