/**
 * Sidebar — Persistent desktop left-rail navigation.
 * Visible only on lg+ breakpoints. Contains the STASH brand mark,
 * primary navigation links, and a quick-action button.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TranslateIcon from "./translateIcon";

const NAV_ITEMS = [
  { id: "sidebar-home",      href: "/",          label: "Inicio",      iconKey: "home" },
  { id: "sidebar-wallet",    href: "/wallet",     label: "Cartera",    iconKey: "wallet" },
  { id: "sidebar-profile",   href: "/profile",    label: "Perfil",   iconKey: "profile" },
] as const;

type SidebarProps = {
  onFabClick?: () => void;
};

/**
 * @param props - Optional click handler for the primary action button.
 */
export default function Sidebar({ onFabClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="
        hidden lg:flex flex-col
        w-64 shrink-0 max-h-svh overflow-hidden
        bg-surface-1
        border-r border-border
        p-6 sticky top-0
      "
    >
      <div className="mb-10 px-3 py-2">
        <Link
          href="/"
          className="
            font-[var(--font-data)] text-xl font-bold
            tracking-[0.2em] uppercase
            text-primary
          "
        >
          STASH
        </Link>
      </div>

      <nav aria-label="Sidebar navigation" className="flex-1 flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={true}
              className={`
                flex items-center gap-4
                px-4 py-3 rounded-xl
                transition-all duration-200
                ${active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-on-dim hover:text-on-surface hover:bg-white/[0.02]"
                }
              `}
            >
              <TranslateIcon iconKey={item.iconKey} size={20} className="text-current" />
              <span className="text-[14px] tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-border">
        <Link
          href="/transaction"
          className="
            w-full flex items-center justify-center gap-2
            h-12 rounded-xl
            bg-primary-ctr text-on-primary
            font-[var(--font-data)] text-[12px] font-bold tracking-[0.1em] uppercase
            shadow-[var(--shadow-fab)]
            transition-all duration-200
            hover:-translate-y-0.5 hover:bg-primary-mid
            hover:shadow-[0_0_24px_rgba(10,77,46,0.5)]
            active:translate-y-0
          "
        >
          <TranslateIcon iconKey="plus" size={16} />
          NUEVA TRANSACCIÓN
        </Link>
      </div>
    </aside>
  );
}
