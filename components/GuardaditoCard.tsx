import type { GuardaditoData } from "@/components/GuardaditosSection";
import TranslateIcon from "./translateIcon";
import Link from "next/link";

type GuardaditoCardProps = {
  guardadito: GuardaditoData;
};

const THEMES = [
  {
    gradient: "linear-gradient(135deg, var(--color-surface-2) 0%, rgba(10,77,46,0.18) 100%)",
    iconColor: "var(--color-primary-deep)",
  },
  {
    gradient: "linear-gradient(135deg, var(--color-surface-2) 0%, rgba(45,106,72,0.14) 100%)",
    iconColor: "var(--color-primary-mid)",
  },
  {
    gradient: "linear-gradient(135deg, var(--color-surface-1) 0%, rgba(17,81,50,0.2) 100%)",
    iconColor: "var(--color-primary-ctr)",
  },
] as const;

/**
 * @param props - The savings goal data to render.
 */
export default function GuardaditoCard({ guardadito }: GuardaditoCardProps) {
  const theme = THEMES[guardadito.themeIndex % THEMES.length];
  const progress = guardadito.target && guardadito.target > 0
    ? Math.min((guardadito.current / guardadito.target) * 100, 100)
    : null;


  return (
    <Link href={`/guardaditos/${guardadito.id}`} className="block w-full">
      <article
        aria-label={`Meta de ahorro ${guardadito.name}`}
        style={{ background: theme.gradient }}
        className="
          pinstripe
          relative overflow-hidden
          flex flex-col justify-end
          min-h-[160px] w-full rounded-2xl p-5
          border border-border
          cursor-pointer
          transition-all duration-200
          hover:-translate-y-0.5
          hover:shadow-[var(--shadow-glow)]
        "
      >
        {/* Cover image background */}
        {guardadito.coverUrl && (
            <div
              aria-hidden="true"
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: `url(${guardadito.coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: guardadito.coverPosition,
                opacity: guardadito.coverOpacity,
              }}
            />  
        )}

        <div
          aria-hidden="true"
          style={{ color: theme.iconColor }}
          className="absolute top-4 right-4 opacity-85 transition-transform duration-200 z-20"
        >
          <TranslateIcon iconKey={guardadito.icon} size={24} className="text-current" />
        </div>

        <div className="relative z-20 flex flex-col gap-1 mt-6">
          <p className="font-[var(--font-data)] text-[11px] font-semibold tracking-[0.12em] uppercase text-on-muted">
            {guardadito.name}
          </p>
          <p className="font-[var(--font-data)] text-[22px] font-bold tracking-tight leading-tight text-on-surface">
            {guardadito.formattedAmount}
          </p>
          {progress !== null ? (
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${Math.round(progress)}% de la meta alcanzado`}
              className="mt-2 w-full h-[3px] bg-black/10 dark:bg-white/10 rounded-full overflow-hidden"
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${progress}%`, background: theme.iconColor }}
              />
            </div>
          ) : (
            <div className="mt-2 w-full h-[3px] bg-black/5 dark:bg-white/5 rounded-full" aria-hidden="true" />
          )}
        </div>
        <div className="absolute w-full h-20 bg-surface-1 left-0 -bottom-4 blur-md scale-200 opacity-80 z-0">

        </div>
      </article>
    </Link>
  );
}
