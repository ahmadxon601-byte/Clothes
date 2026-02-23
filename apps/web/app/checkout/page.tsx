"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { IconButton } from "@/src/components/ui/IconButton";
import { MarketplaceShell } from "@/src/components/ui/MarketplaceShell";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import styles from "@/src/components/ui/ui.module.css";
import { BackIcon } from "@/src/components/ui/icons";
import {
  hapticNotify,
  hideMainButton,
  initTelegramWebApp,
  setBackButton,
  setMainButton
} from "@/src/lib/telegram";
import { cartService } from "@/src/services/cart.service";
import { ordersService } from "@/src/services/orders.service";
import type { CartItem } from "@/src/types/marketplace";

const formatMoney = (value: number) => `$${value.toFixed(2)}`;

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    setItems(cartService.list());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const summary = useMemo(() => cartService.summary(items), [items]);
  const canPlaceOrder = items.length > 0 && !processing;

  const placeOrder = useCallback(async () => {
    if (!canPlaceOrder) {
      return;
    }

    setProcessing(true);
    const created = await ordersService.createFromCart();
    refresh();
    setProcessing(false);

    if (!created) {
      setMessage("Basket is empty.");
      hapticNotify("warning");
      return;
    }

    hapticNotify("success");
    setMessage(`Order ${created.id} created.`);
    router.push(`/checkout/success?orderId=${encodeURIComponent(created.id)}`);
  }, [canPlaceOrder, refresh, router]);

  useEffect(() => {
    initTelegramWebApp();

    const disposeMainButton = setMainButton({
      text: processing ? "Processing..." : "Place Order",
      visible: true,
      enabled: canPlaceOrder,
      onClick: placeOrder
    });

    const disposeBackButton = setBackButton(() => {
      window.history.back();
    });

    return () => {
      disposeMainButton();
      disposeBackButton();
      hideMainButton();
    };
  }, [canPlaceOrder, placeOrder, processing]);

  const changeQuantity = (id: string, delta: number) => {
    const current = items.find((item) => item.id === id);
    if (!current) {
      return;
    }

    cartService.setQuantity(id, current.quantity + delta);
    refresh();
  };

  const removeItem = (id: string) => {
    cartService.remove(id);
    refresh();
  };

  return (
    <MarketplaceShell
      title="Checkout"
      subtitle="Review basket items and place order."
      topLeft={
        <Link href="/" aria-label="Back home">
          <IconButton icon={<BackIcon />} />
        </Link>
      }
    >
      <SectionHeader title="Review Basket" actionHref="/orders" actionLabel="Orders" />

      {loading ? <SkeletonCard rows={3} /> : null}

      {!loading && !items.length ? (
        <EmptyState
          title="Basket is empty"
          description="Add items from search or product details."
          action={
            <>
              <Link href="/search">
                <Button variant="secondary">Open Search</Button>
              </Link>
              <Link href="/product/grey-casual-shoe">
                <Button variant="ghost">Open Product</Button>
              </Link>
            </>
          }
        />
      ) : null}

      {!loading && items.length ? (
        <div className={styles.listStack}>
          {items.map((item) => (
            <Card key={`${item.id}-${item.size}-${item.color}`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.itemTitle}>{item.name}</h2>
                <span className={styles.price}>{formatMoney(item.price)}</span>
              </div>
              <p className={styles.tinyMuted}>
                Size: {item.size} | Color: {item.color}
              </p>
              <div className={styles.inlineRow}>
                <Button variant="secondary" onClick={() => changeQuantity(item.id, -1)}>
                  -
                </Button>
                <span className={styles.statusBadge}>Qty {item.quantity}</span>
                <Button variant="secondary" onClick={() => changeQuantity(item.id, 1)}>
                  +
                </Button>
                <Button variant="ghost" onClick={() => removeItem(item.id)}>
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      <Card>
        <h2 className={styles.itemTitle} style={{ marginBottom: 16 }}>Summary</h2>
        <div className={styles.sectionHeader}>
          <span className={styles.tinyMuted}>Subtotal</span>
          <span>{formatMoney(summary.subtotal)}</span>
        </div>
        <div className={styles.sectionHeader}>
          <span className={styles.tinyMuted}>Shipping</span>
          <span>{formatMoney(summary.shipping)}</span>
        </div>
        <div className={styles.sectionHeader}>
          <strong>Total</strong>
          <strong>{formatMoney(summary.total)}</strong>
        </div>
        <Button onClick={placeOrder} disabled={!canPlaceOrder}>
          {processing ? "Processing..." : "Place Order"}
        </Button>
        {message ? <p className={styles.tinyMuted}>{message}</p> : null}
      </Card>
    </MarketplaceShell>
  );
}
