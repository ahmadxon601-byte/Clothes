import type { ButtonHTMLAttributes } from "react";
import styles from "./ui.module.css";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function Chip({ active = false, className = "", children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${active ? styles.chipActive : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
