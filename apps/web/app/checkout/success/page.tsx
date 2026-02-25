import Link from "next/link";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { IconButton } from "@/src/components/ui/IconButton";
import { MarketplaceShell } from "@/src/components/ui/MarketplaceShell";
import { BackIcon } from "@/src/components/ui/icons";
import styles from "@/src/components/ui/ui.module.css";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    orderId?: string;
  }>;
};

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const orderId = params.orderId ?? "pending-order";

  return (
    <MarketplaceShell
      title="Order Confirmed"
      subtitle="Your checkout completed successfully."
      topLeft={
        <Link href="/checkout" aria-label="Back to checkout">
          <IconButton icon={<BackIcon />} />
        </Link>
      }
    >
      <Card>
        <h2 style={{ margin: 0, fontSize: 22 }}>Success</h2>
        <p className={styles.tinyMuted}>Order ID: {orderId}</p>
        <p className={styles.tinyMuted}>
          We sent your order for processing. You can track status on the Orders page.
        </p>
        <div className={styles.inlineRow}>
          <Link href="/orders">
            <Button>View Orders</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">Continue Shopping</Button>
          </Link>
        </div>
      </Card>
    </MarketplaceShell>
  );
}
