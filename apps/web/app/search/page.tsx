"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { IconButton } from "@/src/components/ui/IconButton";
import { MarketplaceShell } from "@/src/components/ui/MarketplaceShell";
import { SearchBar } from "@/src/components/ui/SearchBar";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import { ProductCard } from "@/src/components/ui/ProductCard";
import { Chip } from "@/src/components/ui/Chip";
import { BackIcon } from "@/src/components/ui/icons";
import { favoritesService } from "@/src/services/favorites.service";
import { searchProducts } from "@/src/services/products.service";
import type { Product } from "@/src/types/marketplace";

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
        <div /> // Hidden
      }
    >
      <div className="mb-5">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={() => void runSearch(query)}
          placeholder="Kiyimlar qidiruvi..."
        />
      </div>

      <div className="mb-8">
        <div className="overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5 flex gap-2.5">
          {["Barchasi", "Pidjaklar", "Ko&apos;ylaklar", "Shimlar"].map(cat => (
            <Chip key={cat} active={cat === "Barchasi"}>{cat.replace('&apos;', "'")}</Chip>
          ))}
        </div>
      </div>

      {loading ? <SkeletonCard rows={3} /> : null}

      {!loading && !results.length ? (
        <EmptyState
          title="Topilmadi"
          description="Boshqa so&apos;z bilan qidirib ko&apos;ring."
          action={
            <Link href="/categories">
              <Button variant="secondary">Kategoriyalar</Button>
            </Link>
          }
        />
      ) : null}

      {!loading ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {results.map((item) => {
            const isFavorite = favoriteIds.includes(item.id);
            return (
              <ProductCard
                key={item.id}
                id={item.id}
                name={item.name}
                price={item.price}
                brand={item.category || "General"}
                image={item.image || "https://images.unsplash.com/photo-1542272604-787c3835535d?w=1000&q=80"}
                isFavorite={isFavorite}
                onFavoriteClick={() => toggleFavorite(item.id)}
              />
            );
          })}
        </div>
      ) : null}
    </MarketplaceShell>
  );
}
