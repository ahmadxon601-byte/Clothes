import Link from "next/link";

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
    <div className="flex items-center justify-between mb-4 mt-6">
      <h2 className="text-[20px] font-extrabold text-[#111827] tracking-tight">{title}</h2>
      {actionHref ? (
        <Link className="text-sm font-bold text-[#00C853] hover:text-[#00C853]/80 active:scale-95 transition-all" href={actionHref}>
          {actionLabel}
        </Link>
      ) : onAction ? (
        <button type="button" className="text-sm font-bold text-[#00C853] hover:text-[#00C853]/80 active:scale-95 transition-all" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
