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
import { BackIcon, HeartIcon } from "@/src/components/ui/icons";
import { favoritesService } from "@/src/services/favorites.service";
import { listProducts } from "@/src/services/products.service";
import type { Product } from "@/src/types/marketplace";

export default function FavoritesPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    const nextItems = await favoritesService.listProducts();
    setItems(nextItems);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const removeFavorite = async (productId: string) => {
    favoritesService.set(productId, false);
    await loadFavorites();
  };

  const addSampleFavorite = async () => {
    const products = await listProducts();
    if (!products.length) {
      return;
    }

    favoritesService.set(products[0].id, true);
    await loadFavorites();
  };

  return (
    <MarketplaceShell
      title="Favorites"
      subtitle="Your saved products are synced with local fallback."
      topLeft={
        <Link href="/" aria-label="Back home">
          <IconButton icon={<BackIcon />} />
        </Link>
      }
    >
      <SectionHeader title="Saved Items" actionHref="/search" actionLabel="Find More" />

      {loading ? <SkeletonCard rows={3} /> : null}

      {!loading && !items.length ? (
        <EmptyState
          title="Favorites are empty"
          description="Save items from Search or Product pages."
          action={
            <>
              <Button variant="secondary" onClick={() => void addSampleFavorite()}>
                Add Sample
              </Button>
              <Link href="/search">
                <Button variant="ghost">Open Search</Button>
              </Link>
            </>
          }
        />
      ) : null}

      {!loading && items.length ? (
        <div className={styles.listStack}>
          {items.map((item) => (
            <Card key={item.id} hoverable>
              <div className={styles.sectionHeader}>
                <h2 style={{ margin: 0, fontSize: 18 }}>{item.name}</h2>
                <span className={styles.price}>${item.price}</span>
              </div>
              <p className={styles.tinyMuted}>{item.category ?? "General"}</p>
              <div className={styles.inlineRow}>
                <Link href={`/product/${item.id}`}>
                  <Button variant="secondary">Open Product</Button>
                </Link>
                <Button
                  variant="ghost"
                  leftIcon={<HeartIcon filled />}
                  onClick={() => void removeFavorite(item.id)}
                >
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </MarketplaceShell>
  );
}
