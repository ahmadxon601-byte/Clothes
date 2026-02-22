import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./ui.module.css";
import { BottomNav } from "./BottomNav";
import { BagIcon, HeartIcon, HomeIcon, ProfileIcon } from "./icons";

type MarketplaceShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  topLeft?: ReactNode;
  topRight?: ReactNode;
  showBottomNav?: boolean;
};

const navItems = [
  { href: "/", label: "Home", icon: <HomeIcon /> },
  { href: "/checkout", label: "Basket", icon: <BagIcon /> },
  { href: "/favorites", label: "Favorites", icon: <HeartIcon /> },
  { href: "/profile", label: "Profile", icon: <ProfileIcon /> }
];

export function MarketplaceShell({
  title,
  subtitle,
  children,
  topLeft,
  topRight,
  showBottomNav = true
}: MarketplaceShellProps) {
  return (
    <main className={`${styles.shell} app-shell`.trim()}>
      <header className={styles.topBar}>
        {topLeft ?? <span />}
        {topRight ?? (
          <Link href="/notifications" aria-label="Notifications" className={styles.sectionHeaderAction}>
            Alerts
          </Link>
        )}
      </header>
      <section className={styles.contentStack}>
        <div>
          <h1 className={styles.pageTitle}>{title}</h1>
          {subtitle ? <p className={styles.pageMuted}>{subtitle}</p> : null}
        </div>
        {children}
      </section>
      {showBottomNav ? <BottomNav items={navItems} /> : null}
    </main>
  );
}
