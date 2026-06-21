/**
 * RecentTransactions — Section wrapper for the transactions list.
 * Renders the section heading and maps over transaction data to produce TransactionItem rows.
 */
import TransactionItem, { type TransactionData } from "./TransactionItem";

type RecentTransactionsProps = {
  transactions: TransactionData[];
};

/**
 * @param props - Array of transaction records to display.
 */
export default function RecentTransactions({
  transactions,
}: RecentTransactionsProps) {
  return (
    <section
      aria-labelledby="transactions-heading"
      className="anim-fade-up-4 flex flex-col pb-4"
    >
      <h2
        id="transactions-heading"
        className="text-[18px] font-semibold tracking-tight text-[var(--color-on-surface)] mb-0"
      >
        Transacciones Recientes
      </h2>

      <ul
        aria-label="Transacciones recientes"
        className="border-t border-white/5 mt-4"
      >
        {transactions.map((tx) => (
          <TransactionItem key={tx.id} transaction={tx} />
        ))}
      </ul>
    </section>
  );
}
