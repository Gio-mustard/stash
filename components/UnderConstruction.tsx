/**
 * UnderConstruction — Generic placeholder for pages not yet implemented.
 * Displays a cat illustration with a fun "working on it" message.
 */
import Link from "next/link";

type UnderConstructionProps = {
  title: string;
};

/**
 * @param props - Page title to display as context.
 */
export default function UnderConstruction({ title }: UnderConstructionProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-6">
      <div className="relative">
        <div className="text-[80px] leading-none select-none" role="img" aria-label="Gato trabajando">
          🐱
        </div>
        <div
          aria-hidden="true"
          className="absolute -bottom-1 -right-2 text-[32px] animate-bounce"
        >
          🔧
        </div>
      </div>

      <div className="flex flex-col gap-2 max-w-xs">
        <h2 className="text-lg font-bold tracking-tight text-on-surface">
          Página en Construcción
        </h2>
        <p className="text-sm text-on-dim leading-relaxed">
          <span className="text-primary font-semibold">{title}</span>{" "}
          está siendo construida. El gato está en ello, ten paciencia. 🐾
        </p>
      </div>

      <Link
        href="/profile"
        className="h-10 px-6 rounded-xl bg-surface-3 border border-border hover:border-white/10 text-xs font-semibold tracking-wider text-on-surface hover:-translate-y-0.5 transition-all"
      >
        ← Volver a Perfil
      </Link>
    </div>
  );
}
