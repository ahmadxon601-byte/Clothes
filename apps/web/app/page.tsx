"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { hideMainButton, initTelegramWebApp, setMainButton } from "@/src/lib/telegram";

type Screen = "home" | "cart";

type Category = { id: string; name: string; image: string };
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

const categories: Category[] = [
  {
    id: "windbreaker",
    name: "Windbreaker",
    image: "https://images.unsplash.com/photo-1494959764136-6be9eb3c261e?w=800&q=80"
  },
  {
    id: "shirts",
    name: "Shirts",
    image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80"
  },
  {
    id: "footwears",
    name: "Footwears",
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80"
  },
  {
    id: "cargo-vest",
    name: "Cargo vest",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80"
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

const formatMoney = (amount: number, withDecimals = false) =>
  withDecimals ? `$${amount.toFixed(2)}` : `$${amount}`;

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon-svg" aria-hidden>
      <path d="M4 7.5h16M4 12h16M4 16.5h16" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon-svg" aria-hidden>
      <path d="M7 9V7.6A5 5 0 0 1 12 2.8a5 5 0 0 1 5 4.8V9" />
      <path d="M4.5 9.5h15l-1.1 10a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8l-1.1-10Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon-svg" aria-hidden>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon-svg" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="8" cy="7" r="1.8" />
      <circle cx="15.5" cy="12" r="1.8" />
      <circle cx="11" cy="17" r="1.8" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon-svg" aria-hidden>
      <path d="m4 10.2 8-6.2 8 6.2v9a1 1 0 0 1-1 1h-4.8v-6.2H9.8v6.2H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function HeartIcon({ filled = false }: { filled?: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" className="icon-svg icon-filled" aria-hidden>
        <path d="M12 20.6 4.8 14a4.6 4.6 0 0 1 0-6.5 4.7 4.7 0 0 1 6.6 0L12 8l.6-.6a4.7 4.7 0 0 1 6.6 0 4.6 4.6 0 0 1 0 6.5z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="icon-svg" aria-hidden>
      <path d="M12 20.6 4.8 14a4.6 4.6 0 0 1 0-6.5 4.7 4.7 0 0 1 6.6 0L12 8l.6-.6a4.7 4.7 0 0 1 6.6 0 4.6 4.6 0 0 1 0 6.5z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon-svg" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.6 20a7.4 7.4 0 0 1 14.8 0" />
    </svg>
  );
}

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
    <div className="screen-content">
      <header className="home-top-bar">
        <button
          type="button"
          className="circle-btn"
          aria-label="Open notifications"
          onClick={onOpenNotifications}
        >
          <MenuIcon />
        </button>
        <button type="button" className="circle-btn" aria-label="Open cart" onClick={onOpenCart}>
          <BagIcon />
        </button>
      </header>

      <div className="search-layout">
        <label className="search-box">
          <SearchIcon />
          <input placeholder="what are you looking for?" />
        </label>
        <button type="button" className="filter-btn" aria-label="Open search" onClick={onOpenSearch}>
          <FilterIcon />
        </button>
      </div>

      <section className="promo-card" aria-label="Limited offer banner">
        <div className="promo-left">
          <span className="limited-pill">Limited Offer</span>
          <h1 className="promo-title">
            First Purchase
            <br />
            Enjoy a Special
            <br />
            Offer
          </h1>
          <button type="button" className="promo-cta" onClick={onOpenSearch}>
            Shop Now <span aria-hidden>↗</span>
          </button>
        </div>
        <div className="promo-right">
          <Image
            src="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1000&q=80"
            alt="Promo model"
            fill
            sizes="(max-width: 430px) 50vw, 215px"
          />
        </div>
      </section>
      <div className="promo-dots" aria-hidden>
        <span className="promo-dot" />
        <span className="promo-dot active" />
        <span className="promo-dot" />
      </div>

      <section className="section-block">
        <div className="section-head">
          <h2>Categories</h2>
          <button type="button" onClick={onOpenCategories}>
            See all
          </button>
        </div>
        <div className="category-row">
          {categories.map((item) => (
            <article key={item.id} className="category-item">
              <div className="category-thumb">
                <Image src={item.image} alt={item.name} fill sizes="(max-width: 430px) 25vw, 100px" />
              </div>
              <p>{item.name}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <h2>New Arrival</h2>
          <button type="button" onClick={onOpenSearch}>
            See all
          </button>
        </div>
        <div className="product-grid">
          {products.map((item) => (
            <article
              key={item.id}
              className="product-card"
              onClick={() => onOpenProduct(item.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  onOpenProduct(item.id);
                }
              }}
              aria-label={`Open ${item.name}`}
            >
              <div className="product-media">
                <Image src={item.image} alt={item.name} fill sizes="(max-width: 430px) 50vw, 200px" />
                <button
                  type="button"
                  className="heart-btn"
                  aria-label={favorites[item.id] ? "Remove from favorites" : "Add to favorites"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleFavorite(item.id);
                  }}
                >
                  <HeartIcon filled={Boolean(favorites[item.id])} />
                </button>
              </div>
              <h3>{item.name}</h3>
              <p>{formatMoney(item.price)}</p>
            </article>
          ))}
        </div>
      </section>
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

function BottomTabBar({
  active,
  onChange,
  onOpenFavorites,
  onOpenProfile
}: {
  active: Screen;
  onChange: (screen: Screen) => void;
  onOpenFavorites: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <nav className="bottom-tab">
      <button
        type="button"
        className={`tab-btn ${active === "home" ? "active" : ""}`}
        onClick={() => onChange("home")}
        aria-label="Home"
      >
        <span className="tab-icon-wrap">
          <HomeIcon />
        </span>
      </button>
      <button
        type="button"
        className={`tab-btn ${active === "cart" ? "active" : ""}`}
        onClick={() => onChange("cart")}
        aria-label="Bag"
      >
        <span className="tab-icon-wrap">
          <BagIcon />
        </span>
      </button>
      <button type="button" className="tab-btn" aria-label="Favorites" onClick={onOpenFavorites}>
        <span className="tab-icon-wrap">
          <HeartIcon />
        </span>
      </button>
      <button type="button" className="tab-btn" aria-label="Profile" onClick={onOpenProfile}>
        <span className="tab-icon-wrap">
          <ProfileIcon />
        </span>
      </button>
    </nav>
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
      return () => {};
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

      <BottomTabBar
        active={screen}
        onChange={setScreen}
        onOpenFavorites={() => router.push("/favorites")}
        onOpenProfile={() => router.push("/profile")}
      />
    </div>
  );
}
