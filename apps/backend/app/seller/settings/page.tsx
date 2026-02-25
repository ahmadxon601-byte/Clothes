"use client";

import { FormEvent, useState } from "react";
import { SellerShell } from "@/src/components/seller/SellerShell";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import styles from "@/src/components/ui/ui.module.css";
import { hapticNotify } from "@/src/lib/telegram";
import { sellerService } from "@/src/services/seller.service";
import type { SellerSettings } from "@/src/types/marketplace";

export default function SellerSettingsPage() {
  const [settings, setSettings] = useState<SellerSettings>(sellerService.getSettings());
  const [message, setMessage] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    sellerService.saveSettings(settings);
    hapticNotify("success");
    setMessage("Seller settings saved.");
  };

  return (
    <SellerShell title="Seller Settings" subtitle="Configure shop-level settings and support contact.">
      <SectionHeader title="Shop Preferences" />

      <form onSubmit={submit}>
        <Card>
          <label className={styles.tinyMuted} htmlFor="shop-name">
            Shop name
          </label>
          <input
            id="shop-name"
            className={styles.fieldInput}
            value={settings.shopName}
            onChange={(event) => setSettings((prev) => ({ ...prev, shopName: event.target.value }))}
          />

          <label className={styles.tinyMuted} htmlFor="support-phone">
            Support phone
          </label>
          <input
            id="support-phone"
            className={styles.fieldInput}
            value={settings.supportPhone}
            onChange={(event) => setSettings((prev) => ({ ...prev, supportPhone: event.target.value }))}
          />

          <label className={styles.inlineRow} htmlFor="auto-confirm">
            <span className={styles.tinyMuted}>Auto confirm incoming orders</span>
            <input
              id="auto-confirm"
              type="checkbox"
              checked={settings.autoConfirmOrders}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, autoConfirmOrders: event.target.checked }))
              }
            />
          </label>

          <Button type="submit">Save Seller Settings</Button>
          {message ? <p className={styles.tinyMuted}>{message}</p> : null}
        </Card>
      </form>
    </SellerShell>
  );
}
