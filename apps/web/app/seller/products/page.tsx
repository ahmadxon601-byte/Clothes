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
import type { SellerProduct } from "@/src/types/marketplace";

const formatMoney = (value: number) => `$${value.toFixed(2)}`;

export default function SellerProductsPage() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    setProducts(sellerService.listProducts());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const toggleActive = (id: string, active: boolean) => {
    setProducts(sellerService.setProductActive(id, active));
  };

  return (
    <SellerShell title="Seller Products" subtitle="Update stock and publish status.">
      <SectionHeader title="Catalog" actionHref="/seller/products/new" actionLabel="Add New" />

      {loading ? <SkeletonCard rows={4} /> : null}

      {!loading && !products.length ? (
        <EmptyState
          title="No seller products"
          description="Create your first seller product."
          action={
            <Link href="/seller/products/new">
              <Button variant="secondary">Create Product</Button>
            </Link>
          }
        />
      ) : null}

      {!loading ? (
        <div className={styles.listStack}>
          {products.map((product) => (
            <Card key={product.id} hoverable>
              <div className={styles.sectionHeader}>
                <h2 className={styles.itemTitle}>{product.name}</h2>
                <span className={styles.price}>{formatMoney(product.price)}</span>
              </div>
              <p className={styles.tinyMuted}>
                Stock: {product.stock} | Category: {product.category}
              </p>
              <div className={styles.inlineRow}>
                <Button
                  variant={product.active ? "secondary" : "primary"}
                  onClick={() => toggleActive(product.id, !product.active)}
                >
                  {product.active ? "Unpublish" : "Publish"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </SellerShell>
  );
}
