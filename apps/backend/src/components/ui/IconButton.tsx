import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./ui.module.css";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
};

export function IconButton({ icon, className = "", ...props }: IconButtonProps) {
  return (
    <button type="button" className={`w-[52px] h-[52px] flex flex-shrink-0 items-center justify-center bg-white text-[#111827] rounded-full shadow-sm transition-colors active:scale-95 ${className}`.trim()} {...props}>
      {icon}
    </button>
  );
}
