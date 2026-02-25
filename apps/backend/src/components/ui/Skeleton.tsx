import { Card } from "./Card";
import styles from "./ui.module.css";

type SkeletonProps = {
  rows?: number;
};

export function SkeletonCard({ rows = 3 }: SkeletonProps) {
  return (
    <Card className={styles.skeletonCard}>
      <div className={styles.listStack}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className={styles.skeleton} style={{ height: index === 0 ? 22 : 14 }} />
        ))}
      </div>
    </Card>
  );
}
