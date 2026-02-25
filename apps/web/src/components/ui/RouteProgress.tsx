"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./ui.module.css";

export function RouteProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];

    setVisible(true);
    setWidth(22);

    timers.current.push(window.setTimeout(() => setWidth(64), 60));
    timers.current.push(window.setTimeout(() => setWidth(86), 150));
    timers.current.push(
      window.setTimeout(() => {
        setWidth(100);
        timers.current.push(
          window.setTimeout(() => {
            setVisible(false);
            setWidth(0);
          }, 230)
        );
      }, 260)
    );

    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    };
  }, [pathname]);

  return (
    <div className={styles.progressWrap} aria-hidden>
      <div className={styles.progressBar} style={{ width: `${width}%`, opacity: visible ? 1 : 0 }} />
    </div>
  );
}
