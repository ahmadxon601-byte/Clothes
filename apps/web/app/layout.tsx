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
            <head>
                <script src="https://telegram.org/js/telegram-web-app.js" async />
            </head>
            <body className="font-sans antialiased min-h-[100dvh] flex justify-center bg-zinc-100 dark:bg-zinc-950" suppressHydrationWarning>
                <div className="w-full max-w-[430px] min-h-[100dvh] flex flex-col bg-[var(--color-tg-bg)] text-[var(--color-tg-text)] relative shadow-2xl overflow-x-hidden">
                    <Providers>{children}</Providers>
                </div>
            </body>
        </html>
    );
}
