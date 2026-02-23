"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { IconButton } from "@/src/components/ui/IconButton";
import { MarketplaceShell } from "@/src/components/ui/MarketplaceShell";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import styles from "@/src/components/ui/ui.module.css";
import { BackIcon } from "@/src/components/ui/icons";
import { profileService } from "@/src/services/profile.service";
import type { UserSettings } from "@/src/types/marketplace";

const defaultSettings: UserSettings = {
  language: "en",
  marketingEmails: true,
  orderUpdates: true
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    let mounted = true;
    profileService.getSettings().then((nextSettings) => {
      if (!mounted) {
        return;
      }

      setSettings(nextSettings);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextSettings = await profileService.saveSettings(settings);
    setSettings(nextSettings);
    setSaved("Settings saved.");
  };

  return (
    <MarketplaceShell
      title="Settings"
      subtitle="Configure notifications and language preferences."
      topLeft={
        <Link href="/profile" aria-label="Back to profile">
          <IconButton icon={<BackIcon />} />
        </Link>
      }
    >
      <SectionHeader title="Preferences" actionHref="/profile" actionLabel="Profile" />

      {loading ? <SkeletonCard rows={3} /> : null}

      {!loading ? (
        <form onSubmit={submit}>
          <Card>
            <h2 className={styles.itemTitle} style={{ marginBottom: 12 }}>App settings</h2>

            <label className={styles.tinyMuted} htmlFor="language">
              Language
            </label>
            <select
              id="language"
              value={settings.language}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, language: event.target.value === "uz" ? "uz" : "en" }))
              }
              className={styles.fieldSelect}
            >
              <option value="en">English</option>
              <option value="uz">Uzbek</option>
            </select>

            <label className={styles.inlineRow} htmlFor="order-updates">
              <span className={styles.tinyMuted}>Order updates</span>
              <input
                id="order-updates"
                type="checkbox"
                checked={settings.orderUpdates}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, orderUpdates: event.target.checked }))
                }
              />
            </label>

            <label className={styles.inlineRow} htmlFor="marketing-emails">
              <span className={styles.tinyMuted}>Marketing emails</span>
              <input
                id="marketing-emails"
                type="checkbox"
                checked={settings.marketingEmails}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, marketingEmails: event.target.checked }))
                }
              />
            </label>

            <div className={styles.inlineRow}>
              <Button type="submit">Save Settings</Button>
              <Link href="/notifications">
                <Button variant="secondary">Notifications</Button>
              </Link>
            </div>
            {saved ? <p className={styles.tinyMuted}>{saved}</p> : null}
          </Card>
        </form>
      ) : null}
    </MarketplaceShell>
  );
}
