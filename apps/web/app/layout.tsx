import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'Telegram Mini App Store',
    description: 'Premium Marketplace',
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning className={inter.variable}>
            <head />
            <body className="font-sans antialiased min-h-[100dvh] flex justify-center bg-[var(--color-bg)]" suppressHydrationWarning>
                <div className="w-full max-w-[500px] min-h-[100dvh] flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] relative shadow-2xl overflow-x-hidden md:border-x md:border-[var(--color-border)]">
                    <Providers>{children}</Providers>
                </div>
            </body>
        </html>
    );
}
