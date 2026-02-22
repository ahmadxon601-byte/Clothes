"use client";

import { useMemo, useState } from "react";

type Category = { name: string; thumb: string };
type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  label?: string;
};

const categories: Category[] = [
  { name: "Men's outfit", thumb: "https://images.unsplash.com/photo-1494959764136-6be9eb3c261e?w=200&q=60" },
  { name: "Women's outfit", thumb: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&q=60" },
  { name: "Men's footwear", thumb: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=200&q=60" }
];

const newArrivals: Product[] = [
  {
    id: "jacket",
    name: "Olive Bomber",
    category: "New Arrival",
    price: 210,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=60"
  },
  {
    id: "slipon",
    name: "Grey Casual shoe",
    category: "Men Footwear",
    price: 120,
    image: "https://images.unsplash.com/photo-1505685296765-3a2736de412f?w=600&q=60",
    label: "Limited Offer"
  }
];

function HomeScreen({ onOpenProduct }: { onOpenProduct: (product: Product) => void }) {
  return (
    <div className="mobile-shell">
      <header className="top-bar">
        <button className="icon-btn">
          <span>☰</span>
        </button>
        <div className="spacer" />
        <button className="icon-btn">
          <span>🔔</span>
        </button>
      </header>

      <div className="search-row">
        <input className="search" placeholder="Mahsulotlarni qidirish..." />
        <button className="icon-btn">
          <span>⚙️</span>
        </button>
      </div>

      <div className="banner">
        <div>
          <div className="pill">Limited Offer</div>
          <h3>Yangi to&apos;plam bilan zamonaviy ko&apos;rinish</h3>
          <button className="cta-btn">
            Sotib olish
            <span>→</span>
          </button>
        </div>
        <img
          src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&q=60"
          alt="Offer"
          className="banner-img"
        />
      </div>

      <section className="section">
        <div className="section-header">
          <h4>Kategoriyalar</h4>
          <button className="text-btn">Hammasi</button>
        </div>
        <div className="chips">
          <div className="chip active">
            <span>Hammasi</span>
          </div>
          {categories.map((item) => (
            <div key={item.name} className="chip">
              <img src={item.thumb} alt={item.name} />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h4>Yangi kelganlar</h4>
          <button className="text-btn">Hammasi</button>
        </div>
        <div className="card-grid">
          {newArrivals.map((item) => (
            <button key={item.id} className="product-card" onClick={() => onOpenProduct(item)}>
              <div className="product-img" style={{ backgroundImage: `url(${item.image})` }} />
              <div className="product-info">
                <span className="product-name">{item.name}</span>
                <span className="product-price">${item.price}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <nav className="bottom-nav">
        <button className="nav-item active">
          <span className="icon">🏠</span>
          <span>Home</span>
        </button>
        <button className="nav-item">
          <span className="icon">🔍</span>
          <span>Search</span>
        </button>
        <button className="nav-item">
          <span className="icon">🛒</span>
          <span>Cart</span>
        </button>
        <button className="nav-item">
          <span className="icon">👤</span>
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}

function DetailsScreen({ product, onBack }: { product: Product; onBack: () => void }) {
  const [qty, setQty] = useState(1);
  const price = useMemo(() => product.price * qty, [product.price, qty]);

  return (
    <div className="mobile-shell">
      <header className="top-bar">
        <button className="icon-btn" onClick={onBack}>
          ←
        </button>
        <div className="spacer" />
        <button className="icon-btn ghost">♡</button>
      </header>

      <div className="detail-hero">
        <div className="detail-image" style={{ backgroundImage: `url(${product.image})` }} />
        <div className="dots">
          <span className="dot active" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </div>

      <div className="detail-body">
        <div className="detail-meta">
          <div>
            <p className="subtle">{product.category}</p>
            <h3>{product.name}</h3>
          </div>
          <button className="follow-btn">Following</button>
        </div>

        <div className="detail-row">
          <div className="label">O&apos;lchamni tanlang</div>
          <div className="sizes">
            {["S", "M", "L", "XL"].map((size) => (
              <button key={size} className={`size-btn ${size === "M" ? "active" : ""}`}>
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="detail-row qty-row">
          <span className="label">Soni</span>
          <div className="qty">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
            <span>{qty}</span>
            <button onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
        </div>

        <div className="detail-row description">
          <p className="subtle">Tavsif</p>
          <p>Engil va qulay slip-on krossovkalar, kunlik kiyinish uchun.</p>
        </div>
      </div>

      <div className="purchase-bar">
        <div>
          <p className="subtle">Umumiy narx</p>
          <strong>${price}</strong>
        </div>
        <button className="cta-add">Korzina</button>
      </div>
    </div>
  );
}

export default function Page() {
  const [selected, setSelected] = useState<Product | null>(null);

  if (selected) {
    return <DetailsScreen product={selected} onBack={() => setSelected(null)} />;
  }

  return <HomeScreen onOpenProduct={setSelected} />;
}
