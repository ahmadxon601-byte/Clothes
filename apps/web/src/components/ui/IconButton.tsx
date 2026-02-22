import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./ui.module.css";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
};

export function IconButton({ icon, className = "", ...props }: IconButtonProps) {
  return (
    <button type="button" className={`${styles.iconButton} ${className}`.trim()} {...props}>
      {icon}
    </button>
  );
}
