"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { IconButton } from "@/src/components/ui/IconButton";
import { MarketplaceShell } from "@/src/components/ui/MarketplaceShell";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import styles from "@/src/components/ui/ui.module.css";
import { BackIcon } from "@/src/components/ui/icons";
import { ordersService } from "@/src/services/orders.service";
import type { Order } from "@/src/types/marketplace";

const formatMoney = (value: number) => `$${value.toFixed(2)}`;
const formatDate = (value: string) => new Date(value).toLocaleString();

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const nextOrders = await ordersService.list();
    setOrders(nextOrders);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return (
    <MarketplaceShell
      title="Orders"
      subtitle="Track and open order details."
      topLeft={
        <Link href="/" aria-label="Back home">
          <IconButton icon={<BackIcon />} />
        </Link>
      }
    >
      <SectionHeader title="Order History" actionHref="/checkout" actionLabel="Checkout" />
      <Card>
        <div className={styles.inlineRow}>
          <Button variant="secondary" onClick={() => void loadOrders()}>
            Refresh
          </Button>
          <Link href="/checkout">
            <Button variant="ghost">Go to Checkout</Button>
          </Link>
        </div>
      </Card>

      {loading ? <SkeletonCard rows={3} /> : null}

      {!loading && !orders.length ? (
        <EmptyState
          title="No orders yet"
          description="Create an order from Checkout."
          action={
            <Link href="/checkout">
              <Button variant="secondary">Open Checkout</Button>
            </Link>
          }
        />
      ) : null}

      {!loading && orders.length ? (
        <div className={styles.listStack}>
          {orders.map((order) => (
            <Card key={order.id} hoverable>
              <div className={styles.sectionHeader}>
                <h2 style={{ margin: 0, fontSize: 18 }}>{order.id}</h2>
                <span className={styles.statusBadge}>{order.status}</span>
              </div>
              <p className={styles.tinyMuted}>{formatDate(order.createdAt)}</p>
              <p className={styles.tinyMuted}>
                {order.items.length} line(s) | Total {formatMoney(order.total)}
              </p>
              <Link href={`/orders/${order.id}`}>
                <Button variant="secondary">View Details</Button>
              </Link>
            </Card>
          ))}
        </div>
      ) : null}
    </MarketplaceShell>
  );
}
