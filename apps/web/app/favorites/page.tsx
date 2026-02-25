"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { IconButton } from "@/src/components/ui/IconButton";
import { MarketplaceShell } from "@/src/components/ui/MarketplaceShell";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import { ProductCard } from "@/src/components/ui/ProductCard";
import { Chip } from "@/src/components/ui/Chip";
import { BackIcon } from "@/src/components/ui/icons";
import { favoritesService } from "@/src/services/favorites.service";
import type { Product } from "@/src/types/marketplace";
import { Trash2 } from "lucide-react";

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

  return (
    <MarketplaceShell
      title="Sevimlilar"
      topLeft={
        <Link href="/" aria-label="Back home">
          <IconButton icon={<BackIcon />} />
        </Link>
      }
    >
      <div className="mb-4">
        <div className="overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5 flex gap-2.5">
          {["Barchasi", "Pidjaklar", "Ko&apos;ylaklar", "Shimlar"].map(cat => (
            <Chip key={cat} active={cat === "Barchasi"}>{cat.replace('&apos;', "'")}</Chip>
          ))}
        </div>
      </div>

      {loading ? <SkeletonCard rows={3} /> : null}

      {!loading && !items.length ? (
        <EmptyState
          title="Sevimlilar bo&apos;sh"
          description="Siz hali hech narsa qo&apos;shmadingiz."
          action={
            <Link href="/search">
              <Button variant="ghost">Qidiruvni ochish</Button>
            </Link>
          }
        />
      ) : null}

      {!loading && items.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              id={item.id}
              name={item.name}
              brand={item.category || "General"}
              price={item.price}
              image={item.image || "https://images.unsplash.com/photo-1542272604-787c3835535d?w=1000&q=80"}
              badgeText="ONLY 2 LEFT"
              actionIcon={<Trash2 className="w-[18px] h-[18px] text-red-500" strokeWidth={2.5} />}
              onFavoriteClick={() => void removeFavorite(item.id)}
            />
          ))}
        </div>
      ) : null}
    </MarketplaceShell>
  );
}
