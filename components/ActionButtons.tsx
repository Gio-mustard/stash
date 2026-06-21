/**
 * ActionButtons — "Add Expense" (filled emerald pill) + "Add Income" (ghost pill).
 * Dispatches to parent-provided callbacks; rendering is purely presentational.
 */
"use client";

import TranslateIcon from "./translateIcon";

type ActionButtonsProps = {
  onAddExpense?: () => void;
  onAddIncome?: () => void;
};

/**
 * @param props - Click callbacks for each action variant.
 */
export default function ActionButtons({
  onAddExpense,
  onAddIncome,
}: ActionButtonsProps) {
  return (
    <div
      role="group"
      aria-label="Acciones rápidas"
      className="anim-fade-up-2 flex gap-3 w-full max-w-2xl lg:max-w-none"
    >
      <button
        id="btn-add-expense"
        onClick={onAddExpense}
        aria-label="Agregar un nuevo gasto"
        className="
          flex-1 flex items-center justify-center gap-2
          h-[52px] rounded-full
          bg-primary-ctr text-on-primary
          font-[var(--font-data)] text-[12px] font-bold tracking-[0.1em] uppercase
          border-none
          transition-all duration-200
          hover:-translate-y-px hover:bg-primary-mid
          hover:shadow-[0_0_16px_rgba(10,77,46,0.35)]
          active:translate-y-0
          text-nowrap px-4
        "
      >
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center size-5 rounded-full bg-primary/15 text-primary"
        >
          <TranslateIcon iconKey="minus" size={12} className="text-current" />
        </span>
        AGREGAR GASTO
      </button>
 
      <button
        id="btn-add-income"
        onClick={onAddIncome}
        aria-label="Agregar un nuevo ingreso"
        className="
          flex-1 flex items-center justify-center gap-2
          h-[52px] rounded-full
          bg-transparent text-on-muted
          font-[var(--font-data)] text-[12px] font-bold tracking-[0.1em] uppercase
          border border-border
          transition-all duration-200
          hover:-translate-y-px hover:border-primary hover:text-primary
          active:translate-y-0
          px-4
        "
      >
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center size-5 rounded-full bg-black/10 dark:bg-white/10 text-on-muted"
        >
          <TranslateIcon iconKey="plus" size={12} className="text-current" />
        </span>
        AGREGAR INGRESO
      </button>
    </div>
  );
}
