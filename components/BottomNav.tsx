/**
 * BottomNav — Persistent mobile-style bottom navigation bar.
 * Renders three icon tabs and a centred FAB with emerald glow.
 * Hidden on desktop viewports where Sidebar handles navigation.
 *
 * The FAB opens a creation picker drawer with 4 options:
 *   expense, income, guardadito, pocket
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Drawer } from "vaul";
import TranslateIcon from "./translateIcon";

const NAV_ITEMS = [
  { id: "nav-home",    href: "/",       label: "Inicio",    iconKey: "home" },
  { id: "nav-wallet",  href: "/wallet", label: "Cartera",  iconKey: "wallet" },
  { id: "nav-profile", href: "/profile",label: "Perfil", iconKey: "profile" },
] as const;

/** Options that appear inside the FAB creation picker */
const CREATE_OPTIONS = [
  {
    id: "create-expense",
    label: "Gasto",
    description: "Registra un gasto del saldo",
    iconKey: "minus",
    iconColor: "text-error-icon",
    bgColor: "bg-error-subtle border-error-border",
    action: "expense" as const,
  },
  {
    id: "create-income",
    label: "Ingreso",
    description: "Agrega dinero a tu billetera",
    iconKey: "plus",
    iconColor: "text-primary",
    bgColor: "bg-primary/10 border-primary/20",
    action: "income" as const,
  },
  {
    id: "create-guardadito",
    label: "Guardadito",
    description: "Nueva meta de ahorro",
    iconKey: "piggybank",
    iconColor: "text-warning-icon",
    bgColor: "bg-warning-subtle border-warning-border",
    action: "guardadito" as const,
  },
  {
    id: "create-pocket",
    label: "Pocket / Tarjeta",
    description: "Nueva cuenta o tarjeta",
    iconKey: "creditCard",
    iconColor: "text-info-icon",
    bgColor: "bg-info-subtle border-info-border",
    action: "pocket" as const,
  },
] as const;

type CreateAction = typeof CREATE_OPTIONS[number]["action"];

type BottomNavProps = {
  /** Called when a creation action is selected from the FAB picker. */
  onCreateAction?: (action: CreateAction) => void;
};

/**
 * @param props - Optional create-action handler.
 */
export default function BottomNav({ onCreateAction }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isFabOpen, setIsFabOpen] = useState(false);

  /**
   * Determines whether a nav item should be considered "active".
   * Root "/" is only active on exact match; others match as prefix.
   */
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleCreateOption = (action: CreateAction) => {
    setIsFabOpen(false);
    if (action === "expense") {
      router.push("/transaction?type=EXPENSE");
      return;
    }
    if (action === "income") {
      router.push("/transaction?type=INCOME");
      return;
    }
    if (action === "pocket") {
      router.push("/wallet?drawer=pocket");
      return;
    }
    if (action === "guardadito") {
      router.push("/?drawer=guardadito");
      return;
    }
  };

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="
          fixed bottom-0 left-0 right-0 z-20
          lg:hidden
          h-[72px]
          bg-surface-1 border-t border-border
          backdrop-blur-xl
          flex items-center justify-around
          px-6
        "
      >
        {NAV_ITEMS.slice(0, 2).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              id={item.id}
              href={item.href}
              prefetch={true}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`
                flex items-center justify-center
                size-11 rounded-full
                transition-colors duration-200
                ${active
                  ? "text-primary"
                  : "text-on-dim hover:text-on-muted"
                }
              `}
            >
              <TranslateIcon iconKey={item.iconKey} size={22} className="text-current" />
            </Link>
          );
        })}

        {/* FAB — opens creation picker */}
        <button
          id="btn-fab"
          onClick={() => setIsFabOpen(true)}
          aria-label="Crear nuevo"
          aria-haspopup="dialog"
          className="
            -mt-5 shrink-0
            flex items-center justify-center
            size-16 rounded-full
            bg-primary-ctr text-on-primary
            shadow-[var(--shadow-fab)]
            transition-all duration-200
            hover:scale-[1.08] hover:-translate-y-0.5
            hover:shadow-[0_0_36px_rgba(10,77,46,0.6),0_6px_20px_rgba(0,0,0,0.7)]
            hover:bg-primary-mid
            active:scale-[0.97] active:translate-y-0
          "
        >
          <TranslateIcon iconKey="plus" size={24} className="text-on-primary" />
        </button>

        {NAV_ITEMS.slice(2).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              id={item.id}
              href={item.href}
              prefetch={true}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`
                flex items-center justify-center
                size-11 rounded-full
                transition-colors duration-200
                ${active
                  ? "text-primary"
                  : "text-on-dim hover:text-on-muted"
                }
              `}
            >
              <TranslateIcon iconKey={item.iconKey} size={22} className="text-current" />
            </Link>
          );
        })}
      </nav>

      {/* ── FAB Creation Picker Drawer ── */}
      <Drawer.Root open={isFabOpen} onOpenChange={setIsFabOpen} direction="bottom">
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 animate-in fade-in duration-200 lg:hidden" />
          <Drawer.Content
            className="
              fixed z-50 bottom-0 left-0 right-0
              lg:hidden
              bg-surface-2
              rounded-t-2xl border-t border-border
              flex flex-col
              pb-[calc(72px+env(safe-area-inset-bottom,0px))]
              focus:outline-none
            "
          >
            {/* Drag handle */}
            <div className="mx-auto w-12 h-1.5 rounded-full bg-white/10 my-4 shrink-0" />

            <div className="px-5 pb-2 flex flex-col gap-3">
              <Drawer.Title className="text-xs font-bold tracking-[0.12em] uppercase text-on-dim">
                Crear nuevo
              </Drawer.Title>

              <div className="grid grid-cols-2 gap-3">
                {CREATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    id={opt.id}
                    onClick={() => handleCreateOption(opt.action)}
                    className={`
                      flex items-center gap-3
                      p-4 rounded-2xl border
                      text-left
                      transition-all duration-150
                      active:scale-95
                      ${opt.bgColor}
                    `}
                  >
                    <div className={`shrink-0 ${opt.iconColor}`}>
                      <TranslateIcon iconKey={opt.iconKey} size={22} className="text-current" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-on-surface leading-tight">
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-on-dim leading-tight mt-0.5 truncate">
                        {opt.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
