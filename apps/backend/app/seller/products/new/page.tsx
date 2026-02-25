"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { SellerShell } from "@/src/components/seller/SellerShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import styles from "@/src/components/ui/ui.module.css";
import { hapticNotify } from "@/src/lib/telegram";
import { sellerService } from "@/src/services/seller.service";

type ProductForm = {
  name: string;
  price: string;
  stock: string;
  category: string;
  image: string;
};

const initialForm: ProductForm = {
  name: "",
  price: "",
  stock: "",
  category: "",
  image: ""
};

export default function SellerNewProductPage() {
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [message, setMessage] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setMessage("Product name is required.");
      return;
    }

    sellerService.createProduct({
      name: form.name.trim(),
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      category: form.category.trim() || "general",
      image:
        form.image.trim() || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1000&q=80",
      active: true
    });
    hapticNotify("success");
    setMessage("Product created.");
    setForm(initialForm);
  };

  return (
    <SellerShell title="Add Product" subtitle="Create a new product for seller catalog.">
      <SectionHeader title="New Product" actionHref="/seller/products" actionLabel="Back to Products" />
      <form onSubmit={submit}>
        <Card>
          <label className={styles.tinyMuted} htmlFor="seller-name">
            Product name
          </label>
          <input
            id="seller-name"
            className={styles.fieldInput}
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />

          <label className={styles.tinyMuted} htmlFor="seller-price">
            Price
          </label>
          <input
            id="seller-price"
            type="number"
            className={styles.fieldInput}
            value={form.price}
            onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
          />

          <label className={styles.tinyMuted} htmlFor="seller-stock">
            Stock
          </label>
          <input
            id="seller-stock"
            type="number"
            className={styles.fieldInput}
            value={form.stock}
            onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
          />

          <label className={styles.tinyMuted} htmlFor="seller-category">
            Category
          </label>
          <input
            id="seller-category"
            className={styles.fieldInput}
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
          />

          <label className={styles.tinyMuted} htmlFor="seller-image">
            Image URL
          </label>
          <input
            id="seller-image"
            className={styles.fieldInput}
            value={form.image}
            onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
          />

          <div className={styles.inlineRow}>
            <Button type="submit">Create Product</Button>
            <Link href="/seller/products">
              <Button variant="secondary">Cancel</Button>
            </Link>
          </div>
          {message ? <p className={styles.tinyMuted}>{message}</p> : null}
        </Card>
      </form>
    </SellerShell>
  );
}
