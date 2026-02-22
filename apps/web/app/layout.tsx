import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { PageTransition } from "@/src/components/ui/PageTransition";
import { RouteProgress } from "@/src/components/ui/RouteProgress";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clothes Marketplace",
  description: "Marketplace WebApp + Telegram bot stack"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <RouteProgress />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
