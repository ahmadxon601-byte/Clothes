"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./ui.module.css";

export type BottomNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

type BottomNavProps = {
  items: BottomNavItem[];
};

const isActive = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
};

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.bottomNav} aria-label="Bottom navigation">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.bottomNavLink} ${active ? styles.bottomNavLinkActive : ""}`.trim()}
            aria-label={item.label}
          >
            <span className={styles.bottomNavBubble}>{item.icon}</span>
          </Link>
        );
      })}
    </nav>
  );
}
