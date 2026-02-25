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
import { BackIcon, HeartIcon } from "@/src/components/ui/icons";
import { favoritesService } from "@/src/services/favorites.service";
import { listCategories, listProducts } from "@/src/services/products.service";
import type { Category, Product } from "@/src/types/marketplace";

export default function CategoryDetailsPage() {
  const params = useParams<{ slug: string | string[] }>();
  const slug = useMemo(() => {
    const raw = params?.slug;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([listCategories(), listProducts()]).then(([categories, allProducts]) => {
      if (!mounted) {
        return;
      }

      const currentCategory = categories.find((item) => item.id === slug || item.slug === slug) ?? null;
      const categoryProducts = allProducts.filter((item) => item.category === slug);

      setCategory(currentCategory);
      setProducts(categoryProducts);
      setFavoriteIds(favoritesService.listIds());
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [slug]);

  const toggleFavorite = (productId: string) => {
    favoritesService.toggle(productId);
    setFavoriteIds(favoritesService.listIds());
  };

  return (
    <MarketplaceShell
      title={category?.name ?? "Category"}
      subtitle="Explore category products in the same marketplace style."
      topLeft={
        <Link href="/categories" aria-label="Back to categories">
          <IconButton icon={<BackIcon />} />
        </Link>
      }
    >
      <SectionHeader title="Products" actionHref="/search" actionLabel="Search all" />

      {loading ? <SkeletonCard rows={4} /> : null}

      {!loading && !products.length ? (
        <EmptyState
          title="No products in this category"
          description="Try another category or explore all products."
          action={
            <Link href="/categories">
              <Button variant="secondary">Back to Categories</Button>
            </Link>
          }
        />
      ) : null}

      {!loading ? (
        <div className={styles.listStack}>
          {products.map((product) => {
            const isFavorite = favoriteIds.includes(product.id);
            return (
              <Card key={product.id} hoverable>
                <div className={styles.sectionHeader}>
                  <h2 style={{ margin: 0, fontSize: 18 }}>{product.name}</h2>
                  <span className={styles.price}>${product.price}</span>
                </div>
                <p className={styles.tinyMuted}>{product.description ?? "Category product item"}</p>
                <div className={styles.inlineRow}>
                  <Link href={`/product/${product.id}`}>
                    <Button variant="secondary">View</Button>
                  </Link>
                  <Button
                    variant={isFavorite ? "primary" : "ghost"}
                    leftIcon={<HeartIcon filled={isFavorite} />}
                    onClick={() => toggleFavorite(product.id)}
                  >
                    {isFavorite ? "Saved" : "Save"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
    </MarketplaceShell>
  );
}
