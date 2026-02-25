import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

type MarketplaceShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  topLeft?: ReactNode;
  topRight?: ReactNode;
  showBottomNav?: boolean;
};

export function MarketplaceShell({
  title,
  subtitle,
  children,
  topLeft,
  topRight,
  showBottomNav = true
}: MarketplaceShellProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-32 font-sans selection:bg-[#00C853]/20">
      <header className="sticky top-0 z-40 w-full bg-[#F5F5F5]/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-5 h-24 max-w-md mx-auto pt-6 pb-2">
          {topLeft ? topLeft : <div className="w-[52px] h-[52px] flex-shrink-0" />}
          <h1 className="text-[20px] font-extrabold text-[#111827] tracking-tight truncate flex-1 text-center px-4">
            {title}
          </h1>
          {topRight ? topRight : <div className="w-[52px] h-[52px] flex-shrink-0" />}
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-3">
        {subtitle && <p className="text-gray-500 font-medium text-sm text-center mb-4">{subtitle}</p>}
        {children}
      </main>

      {showBottomNav ? <BottomNav /> : null}
    </div>
  );
}
