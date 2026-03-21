import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'Aksiya.uz — Premium Fashion Marketplace',
    description: 'Modern luxury fashion. Premium silhouettes, curated essentials and clean lines.',
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
            <body className="font-sans antialiased min-h-[100dvh] bg-[var(--color-bg)] text-[var(--color-text)]" suppressHydrationWarning>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
