import type { HTMLAttributes, ReactNode } from "react";
import styles from "./ui.module.css";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: "surface" | "surface2";
  hoverable?: boolean;
  pressable?: boolean;
};

export function Card({
  children,
  tone = "surface",
  hoverable = false,
  pressable = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`${styles.card} ${tone === "surface2" ? styles.cardSurface2 : ""} ${
        hoverable ? styles.cardHover : ""
      } ${pressable ? styles.cardPress : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
