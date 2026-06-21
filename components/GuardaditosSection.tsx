/**
 * GuardaditosSection — Section heading and grid of savings-goal cards.
 * Renders an empty state CTA when no goals exist.
 * Exports the GuardaditoData type for reuse in sibling components.
 */
"use client";

import GuardaditoCard from "./GuardaditoCard";
import TranslateIcon from "./translateIcon";

export type GuardaditoData = {
  id: string;
  name: string;
  icon: string;
  current: number;
  target: number | null;
  formattedAmount: string;
  themeIndex: number;
};

type GuardaditosSectionProps = {
  items: GuardaditoData[];
  onCreateNew: () => void;
};

/**
 * @param props - Array of savings goals and handler to open the creation drawer.
 */
export default function GuardaditosSection({ items, onCreateNew }: GuardaditosSectionProps) {
  if (items.length === 0) {
    return (
      <section
        aria-labelledby="guardaditos-heading"
        className="anim-fade-up-3 flex flex-col w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="guardaditos-heading"
            className="text-[18px] font-semibold tracking-tight text-on-surface"
          >
            Guardaditos
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center gap-5 py-10 border border-dashed border-white/8 rounded-2xl bg-surface-1/40">
          <div className="size-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <TranslateIcon iconKey="piggybank" size={24} className="text-current" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center px-4">
            <p className="text-[15px] font-semibold text-on-surface">
              Aún no tienes guardaditos
            </p>
            <p className="text-xs text-on-dim max-w-xs leading-relaxed">
              Crea tu primer guardadito para empezar a ahorrar hacia tus metas financieras.
            </p>
          </div>
          <button
            id="btn-create-first-guardadito"
            onClick={onCreateNew}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-primary-ctr text-on-primary font-[var(--font-data)] text-[11px] font-bold tracking-widest uppercase shadow-[var(--shadow-fab)] transition-all hover:-translate-y-0.5 hover:bg-primary-mid active:translate-y-0"
          >
            <TranslateIcon iconKey="plus" size={14} className="text-on-primary" />
            Crear Guardadito
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="guardaditos-heading"
      className="anim-fade-up-3 flex flex-col w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          id="guardaditos-heading"
          className="text-[18px] font-semibold tracking-tight text-on-surface"
        >
          Guardaditos
        </h2>
        <button
          id="btn-new-guardadito"
          onClick={onCreateNew}
          aria-label="Crear nuevo guardadito"
          className="flex items-center gap-1.5 font-[var(--font-data)] text-[11px] font-semibold tracking-[0.1em] uppercase text-primary transition-opacity hover:opacity-70"
        >
          <TranslateIcon iconKey="plus" size={12} className="text-current" />
          NUEVO
        </button>
      </div>

      <div role="list" className="flex flex-wrap gap-4 w-full">
        {items.map((item) => (
          <div key={item.id} role="listitem" className="flex-1 min-w-[160px] max-w-[200px]">
            <GuardaditoCard guardadito={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
