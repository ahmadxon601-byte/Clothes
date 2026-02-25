"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { IconButton } from "@/src/components/ui/IconButton";
import { MarketplaceShell } from "@/src/components/ui/MarketplaceShell";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import styles from "@/src/components/ui/ui.module.css";
import { BackIcon } from "@/src/components/ui/icons";
import { cartService } from "@/src/services/cart.service";
import { ordersService } from "@/src/services/orders.service";
import { listProducts } from "@/src/services/products.service";
import type { Order } from "@/src/types/marketplace";

const formatMoney = (value: number) => `$${value.toFixed(2)}`;
const formatDate = (value: string) => new Date(value).toLocaleString();

export default function OrderDetailsPage() {
  const params = useParams<{ id: string | string[] }>();
  const orderId = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    ordersService.list().then((orders) => {
      if (!mounted) {
        return;
      }

      setOrder(orders.find((item) => item.id === orderId) ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [orderId]);

  const repeatOrder = async () => {
    if (!order) {
      return;
    }

    const products = await listProducts();
    order.items.forEach((line) => {
      const product = products.find((item) => item.id === line.id);
      if (product) {
        cartService.addProduct(product, { quantity: line.quantity, size: "Uni", color: "Default" });
      }
    });

    setMessage("Items added to basket.");
  };

  return (
    <MarketplaceShell
      title="Order Details"
      subtitle="View order lines and repeat purchase."
      topLeft={
        <Link href="/orders" aria-label="Back to orders">
          <IconButton icon={<BackIcon />} />
        </Link>
      }
    >
      <SectionHeader title={orderId ?? "Order"} actionHref="/orders" actionLabel="All Orders" />

      {loading ? <SkeletonCard rows={4} /> : null}

      {!loading && !order ? (
        <EmptyState
          title="Order not found"
          description="This order id does not exist in the local/API history."
          action={
            <Link href="/orders">
              <Button variant="secondary">Back to Orders</Button>
            </Link>
          }
        />
      ) : null}

      {!loading && order ? (
        <>
          <Card>
            <div className={styles.sectionHeader}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{order.id}</h2>
              <span className={styles.statusBadge}>{order.status}</span>
            </div>
            <p className={styles.tinyMuted}>{formatDate(order.createdAt)}</p>
            <div className={styles.sectionHeader}>
              <span className={styles.tinyMuted}>Total</span>
              <strong>{formatMoney(order.total)}</strong>
            </div>
          </Card>

          <Card>
            <h3 style={{ margin: 0, fontSize: 18 }}>Order lines</h3>
            <div className={styles.listStack}>
              {order.items.map((line) => (
                <div key={`${order.id}-${line.id}`} className={styles.sectionHeader}>
                  <span>{line.name}</span>
                  <span>
                    x{line.quantity} | {formatMoney(line.price)}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.inlineRow}>
              <Button onClick={() => void repeatOrder()}>Repeat Order</Button>
              <Link href="/checkout">
                <Button variant="secondary">Open Basket</Button>
              </Link>
            </div>
            {message ? <p className={styles.tinyMuted}>{message}</p> : null}
          </Card>
        </>
      ) : null}
    </MarketplaceShell>
  );
}
