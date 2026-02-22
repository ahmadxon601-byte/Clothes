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
import { BackIcon, ProfileIcon } from "@/src/components/ui/icons";
import { profileService } from "@/src/services/profile.service";
import type { UserProfile } from "@/src/types/marketplace";

const defaultProfile: UserProfile = {
  fullName: "",
  phone: "",
  email: ""
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    let mounted = true;

    profileService.getProfile().then((nextProfile) => {
      if (!mounted) {
        return;
      }

      setProfile(nextProfile);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const savedProfile = await profileService.saveProfile(profile);
    setProfile(savedProfile);
    setSaved("Profile saved successfully.");
  };

  return (
    <MarketplaceShell
      title="Profile"
      subtitle="Manage account info and switch between buyer/seller flows."
      topLeft={
        <Link href="/" aria-label="Back home">
          <IconButton icon={<BackIcon />} />
        </Link>
      }
    >
      <SectionHeader title="Account" actionHref="/settings" actionLabel="Settings" />

      {loading ? <SkeletonCard rows={3} /> : null}

      {!loading ? (
        <>
          <Card>
            <div className={styles.inlineRow}>
              <IconButton icon={<ProfileIcon />} aria-label="Profile icon" />
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>{profile.fullName || "Guest User"}</h2>
                <p className={styles.tinyMuted}>{profile.email || "guest@example.com"}</p>
              </div>
            </div>
          </Card>

          <form onSubmit={submit}>
            <Card>
              <h3 style={{ margin: 0, fontSize: 18 }}>Personal information</h3>
              <label className={styles.tinyMuted} htmlFor="full-name">
                Full name
              </label>
              <input
                id="full-name"
                className={styles.fieldInput}
                value={profile.fullName}
                onChange={(event) => setProfile((prev) => ({ ...prev, fullName: event.target.value }))}
                placeholder="Full name"
              />

              <label className={styles.tinyMuted} htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                value={profile.phone}
                onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+998 90 000 00 00"
                className={styles.fieldInput}
              />

              <label className={styles.tinyMuted} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={profile.email}
                onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="you@example.com"
                className={styles.fieldInput}
              />

              <div className={styles.inlineRow}>
                <Button type="submit">Save Profile</Button>
                <Link href="/orders">
                  <Button variant="secondary">Orders</Button>
                </Link>
                <Link href="/seller">
                  <Button variant="ghost">Seller Mode</Button>
                </Link>
              </div>
              {saved ? <p className={styles.tinyMuted}>{saved}</p> : null}
            </Card>
          </form>
        </>
      ) : null}
    </MarketplaceShell>
  );
}
