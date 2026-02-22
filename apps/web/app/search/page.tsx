"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { IconButton } from "@/src/components/ui/IconButton";
import { MarketplaceShell } from "@/src/components/ui/MarketplaceShell";
import { SearchBar } from "@/src/components/ui/SearchBar";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import styles from "@/src/components/ui/ui.module.css";
import { favoritesService } from "@/src/services/favorites.service";
import { searchProducts } from "@/src/services/products.service";
import type { Product } from "@/src/types/marketplace";
import { BackIcon, FilterIcon, HeartIcon } from "@/src/components/ui/icons";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const runSearch = async (nextQuery: string) => {
    setLoading(true);
    const products = await searchProducts(nextQuery);
    setResults(products);
    setFavoriteIds(favoritesService.listIds());
    setLoading(false);
  };

  useEffect(() => {
    const queryFromUrl =
      typeof window === "undefined"
        ? ""
        : new URLSearchParams(window.location.search).get("q") ?? "";
    setQuery(queryFromUrl);
    void runSearch(queryFromUrl);
  }, []);

  const toggleFavorite = (productId: string) => {
    favoritesService.toggle(productId);
    setFavoriteIds(favoritesService.listIds());
  };

  return (
    <MarketplaceShell
      title="Search Products"
      subtitle="Find by product name or category."
      topLeft={
        <Link href="/" aria-label="Back home">
          <IconButton icon={<BackIcon />} />
        </Link>
      }
      topRight={
        <Link href="/categories" aria-label="Open categories">
          <IconButton icon={<FilterIcon />} />
        </Link>
      }
    >
      <SearchBar
        value={query}
        onChange={setQuery}
        onSubmit={() => void runSearch(query)}
        rightAction={
          <Button variant="ghost" type="submit">
            Search
          </Button>
        }
      />

      <SectionHeader title="Results" actionHref="/favorites" actionLabel="Favorites" />

      {loading ? <SkeletonCard rows={3} /> : null}

      {!loading && !results.length ? (
        <EmptyState
          title="Nothing found"
          description="Try another keyword to discover products."
          action={
            <Link href="/categories">
              <Button variant="secondary">Browse Categories</Button>
            </Link>
          }
        />
      ) : null}

      {!loading ? (
        <div className={styles.listStack}>
          {results.map((item) => {
            const isFavorite = favoriteIds.includes(item.id);
            return (
              <Card key={item.id} hoverable>
                <div className={styles.sectionHeader}>
                  <h2 style={{ margin: 0, fontSize: 18 }}>{item.name}</h2>
                  <span className={styles.price}>${item.price}</span>
                </div>
                <p className={styles.tinyMuted}>{item.description ?? item.category ?? "General item"}</p>
                <div className={styles.inlineRow}>
                  <Link href={`/product/${item.id}`}>
                    <Button variant="secondary">View Product</Button>
                  </Link>
                  <Button
                    variant={isFavorite ? "primary" : "ghost"}
                    onClick={() => toggleFavorite(item.id)}
                    leftIcon={<HeartIcon filled={isFavorite} />}
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
