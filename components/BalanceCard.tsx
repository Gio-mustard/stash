/**
 * BalanceCard — Displays the total portfolio balance and percentage change.
 */

import TranslateIcon from "./translateIcon";

type BalanceCardProps = {
  totalBalance: string;
  changePercent: string;
  isPositive: boolean;
};

export default function BalanceCard({
  totalBalance,
  changePercent,
  isPositive,
}: BalanceCardProps) {
  return (
    <section
      aria-label="Saldo Total"
      className="
        anim-fade-up-1
        relative overflow-hidden
        flex flex-col items-center lg:items-start gap-3
        bg-surface-1
        border border-border
        rounded-2xl px-6 py-8
        
        balance-shimmer
        w-full max-w-2xl lg:max-w-none
      "
    >
      <div
        className="absolute w-64 h-52 -top-32 right-0 bg-primary-deep blur-3xl opacity-30 dark:opacity-100"
      >

      </div>
        <div
          className="absolute opacity-20 dark:opacity-50 w-64 h-52 -bottom-32 left-0 bg-primary-deep blur-3xl"
        ></div>
      <p className="font-[var(--font-data)] z-10 text-[11px] font-semibold tracking-[0.1em] uppercase text-on-dim">
        Saldo Total
      </p>

      <h1 className="font-[var(--font-data)] z-10 text-[38px] lg:text-[44px] font-bold tracking-tight leading-none text-on-surface">
        {totalBalance}
      </h1>

      <div
        className={`
          inline-flex items-center gap-1
          z-10
          px-3 py-1 rounded-full
          font-[var(--font-data)] text-[13px] font-semibold tracking-wide
          ${isPositive
            ? "bg-primary/10 text-primary"
            : "bg-[var(--color-error)]/10 text-error"
          }
        `}
      >
        <TranslateIcon
          iconKey={isPositive ? "arrowUpRight" : "arrowDownRight"}
          size={14}
          className="text-current"
        />
        <span>{changePercent}</span>
      </div>
    </section>
  );
}
