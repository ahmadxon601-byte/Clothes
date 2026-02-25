"use client";

import { FormEvent, useEffect, useState } from "react";
import { SellerShell } from "@/src/components/seller/SellerShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import styles from "@/src/components/ui/ui.module.css";
import { hapticImpact } from "@/src/lib/telegram";
import { sellerService } from "@/src/services/seller.service";
import type { SellerPromotion } from "@/src/types/marketplace";

type PromotionForm = {
  title: string;
  code: string;
  discountPercent: string;
};

const initialForm: PromotionForm = {
  title: "",
  code: "",
  discountPercent: ""
};

export default function SellerPromotionsPage() {
  const [promotions, setPromotions] = useState<SellerPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);

  const refresh = () => {
    setLoading(true);
    setPromotions(sellerService.listPromotions());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.code.trim()) {
      return;
    }

    sellerService.createPromotion({
      title: form.title.trim(),
      code: form.code.trim().toUpperCase(),
      discountPercent: Number(form.discountPercent) || 0,
      active: true
    });
    hapticImpact("medium");
    setForm(initialForm);
    refresh();
  };

  const toggleActive = (id: string, active: boolean) => {
    setPromotions(sellerService.setPromotionActive(id, active));
  };

  return (
    <SellerShell title="Seller Promotions" subtitle="Control active promo campaigns and coupon codes.">
      <SectionHeader title="Promotions" />

      <form onSubmit={submit}>
        <Card>
          <label className={styles.tinyMuted} htmlFor="promo-title">
            Campaign title
          </label>
          <input
            id="promo-title"
            className={styles.fieldInput}
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          />

          <label className={styles.tinyMuted} htmlFor="promo-code">
            Promo code
          </label>
          <input
            id="promo-code"
            className={styles.fieldInput}
            value={form.code}
            onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
          />

          <label className={styles.tinyMuted} htmlFor="promo-discount">
            Discount %
          </label>
          <input
            id="promo-discount"
            type="number"
            className={styles.fieldInput}
            value={form.discountPercent}
            onChange={(event) => setForm((prev) => ({ ...prev, discountPercent: event.target.value }))}
          />

          <Button type="submit">Create Promotion</Button>
        </Card>
      </form>

      {loading ? <SkeletonCard rows={3} /> : null}

      {!loading && !promotions.length ? (
        <EmptyState title="No promotions" description="Create a campaign above to start promotions." />
      ) : null}

      {!loading ? (
        <div className={styles.listStack}>
          {promotions.map((promotion) => (
            <Card key={promotion.id}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.itemTitle}>{promotion.title}</h2>
                <span className={styles.statusBadge}>{promotion.discountPercent}%</span>
              </div>
              <p className={styles.tinyMuted}>Code: {promotion.code}</p>
              <Button
                variant={promotion.active ? "secondary" : "primary"}
                onClick={() => toggleActive(promotion.id, !promotion.active)}
              >
                {promotion.active ? "Deactivate" : "Activate"}
              </Button>
            </Card>
          ))}
        </div>
      ) : null}
    </SellerShell>
  );
}
