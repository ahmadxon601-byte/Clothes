import type { FormEvent, ReactNode } from "react";
import styles from "./ui.module.css";
import { SearchIcon } from "./icons";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  rightAction?: ReactNode;
};

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "what are you looking for?",
  rightAction
}: SearchBarProps) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit?.();
  };

  return (
    <form className={styles.searchBar} onSubmit={submit}>
      <SearchIcon />
      <input
        className={styles.searchInput}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {rightAction}
    </form>
  );
}
