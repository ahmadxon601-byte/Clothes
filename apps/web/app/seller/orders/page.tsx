"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SellerShell } from "@/src/components/seller/SellerShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import styles from "@/src/components/ui/ui.module.css";
import { sellerService } from "@/src/services/seller.service";
import type { Order } from "@/src/types/marketplace";

const formatMoney = (value: number) => `$${value.toFixed(2)}`;
const formatDate = (value: string) => new Date(value).toLocaleString();

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    setOrders(await sellerService.listOrders());
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <SellerShell title="Seller Orders" subtitle="Incoming orders linked from buyer checkout.">
      <SectionHeader title="Incoming" actionHref="/orders" actionLabel="Buyer View" />

      <Card>
        <Button variant="secondary" onClick={() => void refresh()}>
          Refresh Orders
        </Button>
      </Card>

      {loading ? <SkeletonCard rows={3} /> : null}

      {!loading && !orders.length ? (
        <EmptyState
          title="No incoming orders"
          description="Orders appear here once buyers place checkout."
          action={
            <Link href="/checkout">
              <Button variant="secondary">Open Buyer Checkout</Button>
            </Link>
          }
        />
      ) : null}

      {!loading ? (
        <div className={styles.listStack}>
          {orders.map((order) => (
            <Card key={order.id}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.itemTitle}>{order.id}</h2>
                <span className={styles.statusBadge}>{order.status}</span>
              </div>
              <p className={styles.tinyMuted}>{formatDate(order.createdAt)}</p>
              <p className={styles.tinyMuted}>
                {order.items.length} line(s), total {formatMoney(order.total)}
              </p>
              <Link href={`/orders/${order.id}`}>
                <Button variant="ghost">Open Details</Button>
              </Link>
            </Card>
          ))}
        </div>
      ) : null}
    </SellerShell>
  );
}
