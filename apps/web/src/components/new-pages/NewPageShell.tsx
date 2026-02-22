import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./NewPageShell.module.css";

type NewPageShellProps = {
  title: string;
  description?: string;
  activePath?: string;
  children: ReactNode;
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/search", label: "Search" },
  { href: "/categories", label: "Categories" },
  { href: "/favorites", label: "Favorites" },
  { href: "/checkout", label: "Checkout" },
  { href: "/orders", label: "Orders" },
  { href: "/notifications", label: "Notifications" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" }
];

const isActiveLink = (href: string, activePath: string) => {
  if (href === "/") {
    return activePath === "/";
  }

  return activePath.startsWith(href);
};

export function NewPageShell({
  title,
  description,
  activePath = "",
  children
}: NewPageShellProps) {
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
      </header>

      <nav className={styles.nav} aria-label="Marketplace pages">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${isActiveLink(item.href, activePath) ? styles.navLinkActive : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <section className={styles.content}>{children}</section>
    </main>
  );
}
