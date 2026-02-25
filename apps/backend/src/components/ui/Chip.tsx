import type { ButtonHTMLAttributes } from "react";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function Chip({ active = false, className = "", children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={`whitespace-nowrap px-6 py-2.5 rounded-[40px] text-[15px] font-semibold transition-all active:scale-95 ${active
          ? 'bg-[#111827] text-white shadow-sm'
          : 'bg-white text-gray-500 border border-white hover:border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
        } ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
