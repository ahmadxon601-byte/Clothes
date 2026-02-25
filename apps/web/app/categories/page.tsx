"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { IconButton } from "@/src/components/ui/IconButton";
import { MarketplaceShell } from "@/src/components/ui/MarketplaceShell";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import styles from "@/src/components/ui/ui.module.css";
import { BackIcon } from "@/src/components/ui/icons";
import { listCategories, listProducts } from "@/src/services/products.service";
import type { Category } from "@/src/types/marketplace";

type CategoryWithCount = Category & { productCount: number };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([listCategories(), listProducts()]).then(([nextCategories, nextProducts]) => {
      if (!mounted) {
        return;
      }

      const withCount = nextCategories.map((category) => ({
        ...category,
        productCount: nextProducts.filter((item) => item.category === category.id).length
      }));
      setCategories(withCount);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <MarketplaceShell
      title="Categories"
      subtitle="Pick a category to open its product flow."
      topLeft={
        <Link href="/" aria-label="Back home">
          <IconButton icon={<BackIcon />} />
        </Link>
      }
    >
      <SectionHeader title="All Categories" actionHref="/search" actionLabel="Search" />

      {loading ? <SkeletonCard rows={4} /> : null}

      {!loading && !categories.length ? (
        <EmptyState
          title="No categories"
          description="Category list is currently empty."
          action={
            <Link href="/search">
              <Button variant="secondary">Open Search</Button>
            </Link>
          }
        />
      ) : null}

      {!loading && categories.length ? (
        <div className={styles.listStack}>
          {categories.map((item) => (
            <Card key={item.id} hoverable>
              <div className={styles.sectionHeader}>
                <h2 className={styles.itemTitle}>{item.name}</h2>
                <span className={styles.statusBadge}>{item.productCount} items</span>
              </div>
              <div className={styles.inlineRow}>
                <Link href={`/category/${item.id}`}>
                  <Button variant="secondary">Open Category</Button>
                </Link>
                <Link href={`/search?q=${encodeURIComponent(item.name)}`}>
                  <Button variant="ghost">Quick Search</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </MarketplaceShell>
  );
}
