/**
 * TransactionItem — A single row in the Recent Transactions list.
 * Renders a category icon, title/subtitle, signed amount, and coloured status badge.
 */
import TranslateIcon from "./translateIcon";

export type TransactionData = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  amount: string;
  isPositive: boolean;
  status: "PENDING" | "COMPLETED" | "FAILED";
};

type TransactionItemProps = {
  transaction: TransactionData;
};

const STATUS_COLOR: Record<TransactionData["status"], string> = {
  PENDING:   "text-[var(--color-pending)]",
  COMPLETED: "text-on-dim",
  FAILED:    "text-error",
};

const STATUS_LABELS: Record<TransactionData["status"], string> = {
  PENDING: "PENDIENTE",
  COMPLETED: "COMPLETADO",
  FAILED: "FALLIDO",
};

/**
 * @param props - The transaction data to render.
 */
export default function TransactionItem({ transaction }: TransactionItemProps) {
  return (
    <li
      aria-label={`${transaction.title}: ${transaction.amount}`}
      className="
        flex items-center gap-4
        py-4 border-b border-border
        transition-colors duration-150
        hover:bg-white/[0.018] hover:rounded-xl
        hover:-mx-3 hover:px-3
      "
    >
      <div
        aria-hidden="true"
        className="
          shrink-0 size-[42px] rounded-xl
          bg-surface-2 border border-border
          flex items-center justify-center
          text-primary
        "
      >
        <TranslateIcon iconKey={transaction.icon} size={18} className="text-current" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-on-surface truncate">
          {transaction.title}
        </p>
        <p className="text-[12px] text-on-dim mt-0.5">
          {transaction.subtitle}
        </p>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1">
        <p
          className={`
            font-[var(--font-data)] text-[14px] font-semibold tracking-wide
            ${transaction.isPositive
              ? "text-primary"
              : "text-on-surface"
            }
          `}
        >
          {transaction.amount}
        </p>
        <span
          aria-label={`Estado: ${STATUS_LABELS[transaction.status]}`}
          className={`
            font-[var(--font-data)] text-[10px] font-bold tracking-[0.08em] uppercase
            ${STATUS_COLOR[transaction.status]}
          `}
        >
          {STATUS_LABELS[transaction.status]}
        </span>
      </div>
    </li>
  );
}
