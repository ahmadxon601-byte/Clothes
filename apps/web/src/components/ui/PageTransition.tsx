"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./ui.module.css";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className={styles.pageTransition}>
      {children}
    </div>
  );
}
