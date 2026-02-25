"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { IconButton } from "@/src/components/ui/IconButton";
import { MarketplaceShell } from "@/src/components/ui/MarketplaceShell";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import styles from "@/src/components/ui/ui.module.css";
import { BackIcon, BellIcon } from "@/src/components/ui/icons";
import { notificationsService } from "@/src/services/notifications.service";
import type { MarketplaceNotification } from "@/src/types/marketplace";

const formatDate = (value: string) => new Date(value).toLocaleString();

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<MarketplaceNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const next = await notificationsService.list();
    setNotifications(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markAllRead = () => {
    const next = notificationsService.markAllRead();
    setNotifications(next);
  };

  const markOneRead = (id: string) => {
    const next = notificationsService.markRead(id);
    setNotifications(next);
  };

  return (
    <MarketplaceShell
      title="Notifications"
      subtitle="Track marketplace updates and mark important items."
      topLeft={
        <Link href="/" aria-label="Back home">
          <IconButton icon={<BackIcon />} />
        </Link>
      }
      topRight={
        <IconButton icon={<BellIcon />} aria-label="Notifications" />
      }
    >
      <SectionHeader title="Inbox" actionHref="/orders" actionLabel="Orders" />
      <Card>
        <div className={styles.inlineRow}>
          <Button variant="secondary" onClick={() => void loadNotifications()}>
            Refresh
          </Button>
          <Button variant="ghost" onClick={markAllRead}>
            Mark all read
          </Button>
        </div>
      </Card>

      {loading ? <SkeletonCard rows={3} /> : null}

      {!loading && !notifications.length ? (
        <EmptyState
          title="No notifications"
          description="You are all caught up."
          action={
            <Link href="/search">
              <Button variant="secondary">Browse products</Button>
            </Link>
          }
        />
      ) : null}

      {!loading && notifications.length ? (
        <div className={styles.listStack}>
          {notifications.map((item) => (
            <Card key={item.id} hoverable>
              <div className={styles.sectionHeader}>
                <h2 style={{ margin: 0, fontSize: 18 }}>{item.title}</h2>
                <span className={styles.statusBadge}>{item.read ? "Read" : "New"}</span>
              </div>
              <p className={styles.tinyMuted}>{item.body}</p>
              <p className={styles.tinyMuted}>{formatDate(item.createdAt)}</p>
              {!item.read ? (
                <Button variant="secondary" onClick={() => markOneRead(item.id)}>
                  Mark as read
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}
    </MarketplaceShell>
  );
}
