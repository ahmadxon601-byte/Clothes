import Link from "next/link";
import styles from "./ui.module.css";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

export function SectionHeader({
  title,
  actionLabel = "See all",
  actionHref,
  onAction
}: SectionHeaderProps) {
  return (
    <div className={styles.sectionHeader}>
      <h2>{title}</h2>
      {actionHref ? (
        <Link className={styles.sectionHeaderAction} href={actionHref}>
          {actionLabel}
        </Link>
      ) : (
        <button type="button" className={styles.sectionHeaderAction} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
