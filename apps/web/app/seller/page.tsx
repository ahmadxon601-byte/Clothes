"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SellerShell } from "@/src/components/seller/SellerShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import styles from "@/src/components/ui/ui.module.css";
import { sellerService } from "@/src/services/seller.service";

export default function SellerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [promotionCount, setPromotionCount] = useState(0);
  const [activePromotionCount, setActivePromotionCount] = useState(0);

  useEffect(() => {
    const products = sellerService.listProducts();
    const promotions = sellerService.listPromotions();
    setProductCount(products.length);
    setPromotionCount(promotions.length);
    setActivePromotionCount(promotions.filter((item) => item.active).length);
    setLoading(false);
  }, []);

  return (
    <SellerShell title="Seller Studio" subtitle="Manage your products, offers and order flow.">
      <SectionHeader title="Overview" actionHref="/seller/products/new" actionLabel="Add Product" />

      {loading ? <SkeletonCard rows={3} /> : null}

      {!loading ? (
        <div className={styles.listStack}>
          <Card>
            <div className={styles.sectionHeader}>
              <h2 className={styles.itemTitle}>Products</h2>
              <span className={styles.statusBadge}>{productCount}</span>
            </div>
            <p className={styles.tinyMuted}>Total catalog items currently visible in seller mode.</p>
            <Link href="/seller/products">
              <Button variant="secondary">Manage Products</Button>
            </Link>
          </Card>

          <Card>
            <div className={styles.sectionHeader}>
              <h2 className={styles.itemTitle}>Promotions</h2>
              <span className={styles.statusBadge}>
                {activePromotionCount}/{promotionCount} active
              </span>
            </div>
            <p className={styles.tinyMuted}>Create and toggle campaign codes for your storefront.</p>
            <Link href="/seller/promotions">
              <Button variant="secondary">Open Promotions</Button>
            </Link>
          </Card>

          <Card>
            <div className={styles.inlineRow}>
              <Link href="/seller/orders">
                <Button>Seller Orders</Button>
              </Link>
              <Link href="/seller/settings">
                <Button variant="ghost">Seller Settings</Button>
              </Link>
            </div>
          </Card>
        </div>
      ) : null}
    </SellerShell>
  );
}
