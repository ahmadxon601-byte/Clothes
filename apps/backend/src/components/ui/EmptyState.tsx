import type { ReactNode } from "react";
import styles from "./ui.module.css";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      {icon}
      <p className={styles.emptyTitle}>{title}</p>
      <p className={styles.emptyBody}>{description}</p>
      {action ? <div className={styles.inlineRow} style={{ justifyContent: "center", marginTop: 10 }}>{action}</div> : null}
    </div>
  );
}
