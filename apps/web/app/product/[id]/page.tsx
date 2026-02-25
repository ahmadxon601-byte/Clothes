"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Chip } from "@/src/components/ui/Chip";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { IconButton } from "@/src/components/ui/IconButton";
import { MarketplaceShell } from "@/src/components/ui/MarketplaceShell";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import styles from "@/src/components/ui/ui.module.css";
import { BackIcon, BagIcon, HeartIcon } from "@/src/components/ui/icons";
import {
  getUser,
  hapticImpact,
  hideMainButton,
  initTelegramWebApp,
  setBackButton,
  setMainButton
} from "@/src/lib/telegram";
import { cartService } from "@/src/services/cart.service";
import { favoritesService } from "@/src/services/favorites.service";
import { getProductById } from "@/src/services/products.service";
import type { Product } from "@/src/types/marketplace";

const formatMoney = (value: number) => `$${value.toFixed(2)}`;

export default function ProductPage() {
  const params = useParams<{ id: string | string[] }>();
  const productId = useMemo(() => {
    const id = params?.id;
    return Array.isArray(id) ? id[0] : id;
  }, [params]);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("Uni");
  const [color, setColor] = useState("Default");
  const [message, setMessage] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    getProductById(productId)
      .then((item) => {
        if (!mounted) {
          return;
        }

        setProduct(item);
        if (item) {
          setIsFavorite(favoritesService.isFavorite(item.id));
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [productId]);

  const addToBasket = useCallback(() => {
    if (!product) {
      return;
    }

    const nextQuantity = Math.max(1, Math.floor(quantity));
    cartService.addProduct(product, { size, color, quantity: nextQuantity });
    hapticImpact("medium");
    setMessage(`${product.name} added to basket (${nextQuantity}).`);
  }, [color, product, quantity, size]);

  useEffect(() => {
    initTelegramWebApp();

    if (!product) {
      hideMainButton();
      return () => { };
    }

    const disposeMainButton = setMainButton({
      text: "Add to Basket",
      visible: true,
      enabled: true,
      onClick: addToBasket
    });

    const disposeBackButton = setBackButton(() => {
      window.history.back();
    });

    return () => {
      disposeMainButton();
      disposeBackButton();
      hideMainButton();
    };
  }, [addToBasket, product]);

  const toggleFavorite = () => {
    if (!product) {
      return;
    }

    const ids = favoritesService.toggle(product.id);
    setIsFavorite(ids.includes(product.id));
    hapticImpact("light");
  };

  return (
    <MarketplaceShell
      title="Product Details"
      subtitle={`@${getUser()?.username ?? "guest"} product view`}
      topLeft={
        <Link href="/search" aria-label="Back to search">
          <IconButton icon={<BackIcon />} />
        </Link>
      }
      topRight={
        <Link href="/checkout" aria-label="Open basket">
          <IconButton icon={<BagIcon />} />
        </Link>
      }
    >
      <SectionHeader title="Details" actionHref="/search" actionLabel="Search" />

      {loading ? <SkeletonCard rows={4} /> : null}

      {!loading && !product ? (
        <EmptyState
          title="Product not found"
          description="This product id does not exist in API or fallback data."
          action={
            <Link href="/">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          }
        />
      ) : null}

      {!loading && product ? (
        <>
          <Card>
            <Image
              src={product.image}
              alt={product.name}
              width={390}
              height={280}
              style={{ width: "100%", height: "auto", borderRadius: 20 }}
              priority
            />
            <div className={styles.sectionHeader}>
              <h2 className={styles.itemTitle}>{product.name}</h2>
              <span className={styles.price}>{formatMoney(product.price)}</span>
            </div>
            <p className={styles.tinyMuted}>
              {product.description ?? "A clean and practical piece from the latest collection."}
            </p>
            <div className={styles.inlineRow}>
              <Button variant="secondary" onClick={toggleFavorite} leftIcon={<HeartIcon filled={isFavorite} />}>
                {isFavorite ? "Saved" : "Save"}
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className={styles.itemTitle} style={{ marginBottom: 12 }}>Customize</h3>

            <div className={styles.inlineRow}>
              {["S", "M", "L", "XL", "Uni"].map((value) => (
                <Chip key={value} active={size === value} onClick={() => setSize(value)}>
                  {value}
                </Chip>
              ))}
            </div>

            <label className={styles.tinyMuted} htmlFor="color-input">
              Color
            </label>
            <input
              id="color-input"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              placeholder="Color"
              className={styles.fieldInput}
            />

            <label className={styles.tinyMuted} htmlFor="qty-input">
              Quantity
            </label>
            <input
              id="qty-input"
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className={styles.fieldInput}
            />

            <div className={styles.inlineRow}>
              <Button onClick={addToBasket}>Add to Basket</Button>
              <Link href="/checkout">
                <Button variant="secondary">Go to Checkout</Button>
              </Link>
            </div>
            {message ? <p className={styles.tinyMuted}>{message}</p> : null}
          </Card>
        </>
      ) : null}
    </MarketplaceShell>
  );
}
