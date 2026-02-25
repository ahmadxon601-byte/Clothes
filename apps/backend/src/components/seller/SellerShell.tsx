import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { IconButton } from "@/src/components/ui/IconButton";
import { MarketplaceShell } from "@/src/components/ui/MarketplaceShell";
import styles from "@/src/components/ui/ui.module.css";
import { BackIcon, ProfileIcon } from "@/src/components/ui/icons";

type SellerShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

const sellerLinks = [
  { href: "/seller", label: "Overview" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/promotions", label: "Promotions" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/settings", label: "Settings" }
];

export function SellerShell({ title, subtitle, children }: SellerShellProps) {
  return (
    <MarketplaceShell
      title={title}
      subtitle={subtitle}
      topLeft={
        <Link href="/profile" aria-label="Back to profile">
          <IconButton icon={<BackIcon />} />
        </Link>
      }
      topRight={
        <Link href="/profile" aria-label="Buyer profile">
          <IconButton icon={<ProfileIcon />} />
        </Link>
      }
    >
      <Card tone="surface2">
        <div className={styles.inlineRow}>
          {sellerLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost">{item.label}</Button>
            </Link>
          ))}
        </div>
      </Card>
      {children}
    </MarketplaceShell>
  );
}
