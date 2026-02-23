'use client';
import { BottomNav } from '../../src/shared/ui/BottomNav';
import { ToastProvider } from '../../src/shared/ui/Toast';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-[100dvh] w-full">
            <ToastProvider />
            <main className="flex-1 pb-[68px] animate-in fade-in duration-300">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
