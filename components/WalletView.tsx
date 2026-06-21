"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TranslateIcon from "./translateIcon";
import PocketCard, { PocketData } from "./PocketCard";
import CreatePocketDrawer from "./CreatePocketDrawer";
import Link from "next/link";

type WalletViewProps = {
  pockets: PocketData[];
  walletBalance: number;
  guardaditosTotal: number;
  pocketsTotal: number;
};

export default function WalletView({
  pockets,
  walletBalance,
  guardaditosTotal,
  pocketsTotal,
}: WalletViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("drawer") === "pocket") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  const handleCloseDrawer = () => {
    setIsCreateOpen(false);
    // Remove query param
    router.replace("/wallet");
  };

  const totalGeneral = walletBalance + guardaditosTotal + pocketsTotal;

  const formattedGeneral = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(totalGeneral);

  return (
    <>
      <main className="flex-1 overflow-y-auto px-6 py-6 pb-20 w-full max-w-4xl mx-auto flex flex-col gap-8">
          {/* Header section with Total General */}
          <section
            aria-label="Total Wallet Balance"
            className="
              relative overflow-hidden
              flex flex-col gap-4
              bg-[var(--color-surface-1)]
              border border-white/5
              rounded-2xl p-6 sm:p-8
              balance-shimmer
              w-full
            "
          >
            <div className="absolute -top-32 right-0 w-64 h-52 bg-primary-ctr blur-3xl opacity-30 pointer-events-none" />
            <div className="absolute -bottom-32 left-0 w-64 h-52 bg-primary-ctr blur-3xl opacity-20 pointer-events-none" />

            <div>
              <p className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--color-on-dim)]">
                Patrimonio Total Estimado
              </p>
              <h1 className="font-[var(--font-data)] text-4xl sm:text-5xl font-extrabold tracking-tight mt-1 text-[var(--color-on-surface)] leading-none">
                {formattedGeneral}
              </h1>
            </div>

            {/* Breakdown row */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 mt-2 z-10 text-[var(--color-on-muted)]">
              <div>
                <p className="text-[10px] font-semibold tracking-wider uppercase text-[var(--color-on-dim)]">
                  Billetera
                </p>
                <p className="font-[var(--font-data)] text-sm sm:text-base font-bold text-[var(--color-on-surface)] mt-0.5">
                  ${walletBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wider uppercase text-[var(--color-on-dim)]">
                  Pockets
                </p>
                <p className="font-[var(--font-data)] text-sm sm:text-base font-bold text-[var(--color-on-surface)] mt-0.5">
                  ${pocketsTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wider uppercase text-[var(--color-on-dim)]">
                  Guardaditos
                </p>
                <p className="font-[var(--font-data)] text-sm sm:text-base font-bold text-[var(--color-on-surface)] mt-0.5">
                  ${guardaditosTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </section>

          {/* Pocket Cards list/grid section */}
          <section className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold tracking-tight text-[var(--color-on-surface)]">
                  Tus Pockets / Tarjetas
                </h2>
                <p className="text-xs text-[var(--color-on-dim)] mt-0.5">
                  Tus cuentas bancarias, tarjetas o efectivo físico.
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/wallet/custom-design"
                  className="h-9 px-4 rounded-xl border border-white/10 text-xs font-semibold flex items-center gap-1.5 hover:bg-white/5 active:scale-95 transition-all"
                >
                  <TranslateIcon iconKey="settings" size={14} />
                  <span>Personalizar</span>
                </Link>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="h-9 px-4 rounded-xl bg-[var(--color-primary-ctr)] text-white text-xs font-bold tracking-wide uppercase flex items-center gap-1 hover:bg-[var(--color-primary-mid)] active:scale-95 transition-all"
                >
                  <TranslateIcon iconKey="plus" size={14} />
                  <span>Crear</span>
                </button>
              </div>
            </div>

            {pockets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {pockets.map((pocket) => (
                  <PocketCard key={pocket.id} pocket={pocket} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl p-12 text-center mt-2 bg-[var(--color-surface-1)]">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[var(--color-on-dim)] mb-4">
                  <TranslateIcon iconKey="creditCard" size={24} />
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-on-surface)]">
                  No hay pockets registrados
                </h3>
                <p className="text-xs text-[var(--color-on-dim)] max-w-xs mt-1 leading-normal">
                  Crea una tarjeta para comenzar a gestionar tu dinero en bancos o efectivo de forma independiente.
                </p>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="h-10 px-5 mt-5 rounded-xl bg-[var(--color-primary-ctr)] text-white text-xs font-bold tracking-wider uppercase hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  Crear primera tarjeta
                </button>
              </div>
            )}
          </section>
      </main>

      <CreatePocketDrawer
        isOpen={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDrawer();
          else setIsCreateOpen(true);
        }}
      />
    </>
  );
}
