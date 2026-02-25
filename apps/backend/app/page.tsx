"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { hideMainButton, initTelegramWebApp, setMainButton } from "@/src/lib/telegram";
import { Moon, Globe } from "lucide-react";
import { BannerCard } from "@/src/components/ui/BannerCard";
import { ProductCard } from "@/src/components/ui/ProductCard";
import { SearchBar } from "@/src/components/ui/SearchBar";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Chip } from "@/src/components/ui/Chip";
import { BottomNav } from "@/src/components/ui/BottomNav";

type Screen = "home" | "cart";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
};
type CartItem = {
  id: string;
  name: string;
  image: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
};

const initialCartItems: CartItem[] = [
  {
    id: "nike-air-zoom",
    name: "Nike Air Zoom",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    size: "42",
    color: "Red",
    price: 140,
    quantity: 1
  },
  {
    id: "grey-casual-shoe",
    name: "Grey Casual Shoe",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
    size: "L",
    color: "Grey",
    price: 120,
    quantity: 1
  },
  {
    id: "minimalist-watch",
    name: "Minimalist Watch",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80",
    size: "Uni",
    color: "White",
    price: 85,
    quantity: 1
  }
];

const products: Product[] = [
  {
    id: "brown-harrington",
    name: "Brown Harrington",
    price: 210,
    image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=1000&q=80"
  },
  {
    id: "grey-casual-shoe",
    name: "Grey Casual Shoe",
    price: 120,
    image: "https://images.unsplash.com/photo-1505685296765-3a2736de412f?w=1000&q=80"
  },
  {
    id: "essential-white-tee",
    name: "Essential White Tee",
    price: 45,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1000&q=80"
  },
  {
    id: "blue-slim-cenim",
    name: "Blue Slim Čenim",
    price: 89,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=1000&q=80"
  }
];

const formatMoney = (amount: number, withDecimals = false) =>
  withDecimals ? `$${amount.toFixed(2)}` : `$${amount}`;

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon-svg" aria-hidden>
      <path d="m14.5 5.5-6 6 6 6" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon-svg" aria-hidden>
      <circle cx="6.2" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="17.8" cy="12" r="1.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon-svg" aria-hidden>
      <path d="m8 8 8 8M16 8l-8 8" />
    </svg>
  );
}

function HomeScreen({
  favorites,
  onToggleFavorite,
  onOpenCart,
  onOpenSearch,
  onOpenCategories,
  onOpenProduct,
  onOpenNotifications
}: {
  favorites: Record<string, boolean>;
  onToggleFavorite: (id: string) => void;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onOpenCategories: () => void;
  onOpenProduct: (id: string) => void;
  onOpenNotifications: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans selection:bg-[#00C853]/20">
      <header className="sticky top-0 z-40 w-full bg-[#F5F5F5]/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-5 h-24 max-w-md mx-auto pt-6 pb-2">
          <button
            onClick={onOpenNotifications}
            className="w-[52px] h-[52px] flex flex-shrink-0 items-center justify-center bg-white text-gray-900 rounded-full shadow-sm transition-colors active:scale-95"
          >
            <Moon className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={2.5} />
          </button>

          <h1 className="text-[20px] font-extrabold text-[#111827] tracking-tight truncate flex-1 text-center px-4">
            Clothes MP
          </h1>

          <button
            onClick={onOpenCart}
            className="relative w-[52px] h-[52px] flex flex-shrink-0 items-center justify-center bg-white text-gray-900 rounded-full shadow-sm transition-colors active:scale-95"
          >
            <Globe className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-3 pb-32">
        <div className="mb-5" onClick={onOpenSearch}>
          <SearchBar placeholder="Search luxury menswear..." value="" onChange={() => { }} />
        </div>

        <div className="mb-6">
          <BannerCard
            title="First Purchase Enjoy a Special Offer"
            subtitle=""
            badge="Limited Offer"
            imageUrl="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400"
            onClick={onOpenCategories}
          />
        </div>

        <div className="mb-8">
          <div className="overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5 flex gap-2.5">
            {["All", "Jackets", "Shirts", "Pants"].map(cat => (
              <Chip key={cat} active={cat === "All"} onClick={onOpenCategories}>{cat}</Chip>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <SectionHeader title="Special for you" onAction={onOpenCategories} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.image}
                badgeText={product.id === "brown-harrington" ? "ONLY 3 LEFT" : undefined}
                isFavorite={!!favorites[product.id]}
                onFavoriteClick={onToggleFavorite}
                onClick={onOpenProduct}
                brand={product.name.split(' ')[0]}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function CartScreen({
  items,
  onBack,
  onRemove,
  onIncrease,
  onDecrease,
  onOpenOrders,
  onOpenCheckout
}: {
  items: CartItem[];
  onBack: () => void;
  onRemove: (id: string) => void;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onOpenOrders: () => void;
  onOpenCheckout: () => void;
}) {
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const shipping = items.length ? 15 : 0;
  const total = subtotal + shipping;

  return (
    <div className="screen-content">
      <header className="cart-top-bar">
        <button type="button" className="circle-btn" aria-label="Back to home" onClick={onBack}>
          <BackIcon />
        </button>
        <h1>Your Shopping Cart</h1>
        <button type="button" className="circle-btn" aria-label="Open orders" onClick={onOpenOrders}>
          <DotsIcon />
        </button>
      </header>

      <div className="cart-list">
        {items.map((item) => (
          <article key={item.id} className="cart-card">
            <div className="cart-thumb">
              <Image src={item.image} alt={item.name} fill sizes="96px" />
            </div>
            <div className="cart-main">
              <div className="cart-main-top">
                <div>
                  <h3>{item.name}</h3>
                  <p>
                    Size: {item.size} | Color: {item.color}
                  </p>
                </div>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="cart-main-bottom">
                <strong>{formatMoney(item.price, true)}</strong>
                <div className="qty-stepper">
                  <button type="button" onClick={() => onDecrease(item.id)} aria-label="Decrease quantity">
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => onIncrease(item.id)} aria-label="Increase quantity">
                    +
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="promo-row">
        <input placeholder="Promo code" />
        <button type="button">APPLY</button>
      </div>

      <section className="summary-card">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>{formatMoney(subtotal, true)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping</span>
          <span>{formatMoney(shipping, true)}</span>
        </div>
        <div className="summary-row total-row">
          <span>Total</span>
          <strong>{formatMoney(total, true)}</strong>
        </div>
      </section>

      <button type="button" className="checkout-btn" onClick={onOpenCheckout}>
        Proceed to Checkout <span aria-hidden>→</span>
      </button>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("home");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateQuantity = (id: string, type: "increase" | "decrease") => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const nextQuantity = type === "increase" ? item.quantity + 1 : Math.max(1, item.quantity - 1);
        return { ...item, quantity: nextQuantity };
      })
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  useEffect(() => {
    initTelegramWebApp();

    if (screen !== "cart") {
      hideMainButton();
      return () => { };
    }

    const dispose = setMainButton({
      text: "Checkout",
      visible: true,
      enabled: cartItems.length > 0,
      onClick: () => router.push("/checkout")
    });

    return () => {
      dispose();
      hideMainButton();
    };
  }, [cartItems.length, router, screen]);

  return (
    <div className="app-shell">
      {screen === "home" ? (
        <HomeScreen
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onOpenCart={() => setScreen("cart")}
          onOpenSearch={() => router.push("/search")}
          onOpenCategories={() => router.push("/categories")}
          onOpenProduct={(id) => router.push(`/product/${id}`)}
          onOpenNotifications={() => router.push("/notifications")}
        />
      ) : (
        <CartScreen
          items={cartItems}
          onBack={() => setScreen("home")}
          onRemove={removeItem}
          onIncrease={(id) => updateQuantity(id, "increase")}
          onDecrease={(id) => updateQuantity(id, "decrease")}
          onOpenOrders={() => router.push("/orders")}
          onOpenCheckout={() => router.push("/checkout")}
        />
      )}

      {screen === "home" && <BottomNav />}
    </div>
  );
}
