import type { SVGProps } from "react";
import styles from "./ui.module.css";

type IconProps = SVGProps<SVGSVGElement>;

const BaseIcon = ({ children, className = "", ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" className={`${styles.icon} ${className}`.trim()} aria-hidden {...props}>
    {children}
  </svg>
);

export const HomeIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="m4 10.2 8-6.2 8 6.2v9a1 1 0 0 1-1 1h-4.8v-6.2H9.8v6.2H5a1 1 0 0 1-1-1z" />
  </BaseIcon>
);

export const BagIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M7 9V7.6A5 5 0 0 1 12 2.8a5 5 0 0 1 5 4.8V9" />
    <path d="M4.5 9.5h15l-1.1 10a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8l-1.1-10Z" />
  </BaseIcon>
);

export const HeartIcon = ({
  className = "",
  filled = false,
  ...props
}: IconProps & { filled?: boolean }) => (
  <BaseIcon {...props} className={`${className} ${filled ? styles.iconFilled : ""}`.trim()}>
    <path d="M12 20.6 4.8 14a4.6 4.6 0 0 1 0-6.5 4.7 4.7 0 0 1 6.6 0L12 8l.6-.6a4.7 4.7 0 0 1 6.6 0 4.6 4.6 0 0 1 0 6.5z" />
  </BaseIcon>
);

export const ProfileIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.6 20a7.4 7.4 0 0 1 14.8 0" />
  </BaseIcon>
);

export const SearchIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </BaseIcon>
);

export const MenuIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M4 7.5h16M4 12h16M4 16.5h16" />
  </BaseIcon>
);

export const BackIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="m14.5 5.5-6 6 6 6" />
  </BaseIcon>
);

export const BellIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M12 3a5 5 0 0 0-5 5v2.8l-1.8 3.1c-.4.7.1 1.6.9 1.6h11.8c.8 0 1.3-.9.9-1.6L17 10.8V8a5 5 0 0 0-5-5Z" />
    <path d="M9.8 18.2a2.2 2.2 0 0 0 4.4 0" />
  </BaseIcon>
);

export const PlusIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M12 5v14M5 12h14" />
  </BaseIcon>
);

export const FilterIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
    <circle cx="8" cy="7" r="1.8" />
    <circle cx="15.5" cy="12" r="1.8" />
    <circle cx="11" cy="17" r="1.8" />
  </BaseIcon>
);
