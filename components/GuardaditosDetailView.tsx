"use client";

import React, { useState, useTransition } from "react";
import { Drawer } from "vaul";
import TranslateIcon from "@/components/translateIcon";
import { updateGuardaditoDetails, quickDepositOrWithdraw } from "@/app/actions";
import { deleteGuardadito } from "@/app/actions_extended";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import BackBreadcrumb from "./BackBreadcrumb";
import TransactionModal from "./TransactionModal";
import { createTransaction } from "@/app/actions";

import type { CustomCategory } from "./DashboardView";

type GuardaditosDetailViewProps = {
  userName: string;
  avatarUrl?: string | null;
  guardadito: {
    id: string;
    name: string;
    icon: string;
    current: number;
    target: number | null;
    notes: string;
    link: string;
    themeIndex: number;
  };
  transactions: {
    id: string;
    amount: number;
    is_positive: boolean;
    created_at: string;
    title: string;
  }[];
  guardaditos: {
    id: string;
    name: string;
    icon: string;
    current: number;
    target: number | null;
    formattedAmount: string;
    themeIndex: number;
  }[];
  customCategories: CustomCategory[];
  walletBalance: number;
};

const THEMES = [
  {
    gradient: "linear-gradient(135deg, #101010 0%, rgba(10,77,46,0.2) 100%)",
    glowColor: "rgba(150,212,171,0.15)",
    textColor: "#96d4ab",
  },
  {
    gradient: "linear-gradient(135deg, #101010 0%, rgba(45,106,72,0.16) 100%)",
    glowColor: "rgba(127,189,149,0.15)",
    textColor: "#7fbd95",
  },
  {
    gradient: "linear-gradient(135deg, #101010 0%, rgba(17,81,50,0.22) 100%)",
    glowColor: "rgba(177,241,198,0.15)",
    textColor: "#b1f1c6",
  },
] as const;

/**
 * GuardaditosDetailView renders detail info for a specific savings goal.
 * Features an SVG sparkline, notes editor, and Vaul Drawers for quick deposit/withdrawals.
 */
export default function GuardaditosDetailView({
  userName,
  avatarUrl,
  guardadito,
  transactions,
  guardaditos,
  customCategories,
  walletBalance,
}: GuardaditosDetailViewProps) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(guardadito.notes || "");
  const [link, setLink] = useState(guardadito.link || "");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Drawer open states
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");

  // Transaction Modal State (triggered by Sidebar FAB)
  const [txModalState, setTxModalState] = useState<{
    isOpen: boolean;
    type: "EXPENSE" | "INCOME";
  }>({
    isOpen: false,
    type: "EXPENSE",
  });

  const theme = THEMES[guardadito.themeIndex % THEMES.length];
  const progressPercent = guardadito.target && guardadito.target > 0
    ? Math.min((guardadito.current / guardadito.target) * 100, 100)
    : 0;

  const openTxModal = (type: "EXPENSE" | "INCOME") => {
    setTxModalState({ isOpen: true, type });
  };

  const closeTxModal = () => {
    setTxModalState((prev) => ({ ...prev, isOpen: false }));
  };

  /**
   * Triggers the server action to save links and notes.
   */
  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateGuardaditoDetails(guardadito.id, notes, link);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    });
  };

  /**
   * Direct deposit into the guardadito.
   */
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError(null);
    const parsed = parseFloat(depositAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setDepositError("Monto inválido.");
      return;
    }

    if (parsed > walletBalance) {
      setDepositError(`Fondos insuficientes en tu billetera. Saldo disponible: $${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`);
      return;
    }

    startTransition(async () => {
      try {
        await quickDepositOrWithdraw(guardadito.id, guardadito.name, guardadito.icon, parsed, true);
        setDepositAmount("");
        setDepositError(null);
        setIsDepositOpen(false);
      } catch (err: any) {
        setDepositError(err.message || "Error al realizar el depósito.");
      }
    });
  };

  /**
   * Direct withdrawal (from hidden zone drawer).
   */
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    const parsed = parseFloat(withdrawAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setWithdrawError("Monto inválido.");
      return;
    }

    if (parsed > guardadito.current) {
      setWithdrawError(`Fondos insuficientes en el guardadito. Saldo disponible: $${guardadito.current.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`);
      return;
    }

    const confirmText = `¿Estás seguro que deseas retirar $${parsed} de tu meta "${guardadito.name}"? Esto afectará tu progreso de ahorro.`;
    if (!window.confirm(confirmText)) return;

    startTransition(async () => {
      try {
        await quickDepositOrWithdraw(guardadito.id, guardadito.name, guardadito.icon, parsed, false);
        setWithdrawAmount("");
        setWithdrawError(null);
        setIsWithdrawOpen(false);
      } catch (err: any) {
        setWithdrawError(err.message || "Error al realizar el retiro.");
      }
    });
  };

  /**
   * Triggers the server action to delete the guardadito.
   */
  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmDeleteText !== `eliminar ${guardadito.name}`) return;

    startTransition(async () => {
      await deleteGuardadito(guardadito.id);
    });
  };

  // Reconstruct historical progression values
  let runningSavingsVal = guardadito.current;
  const historyDataPoints = [];

  for (const tx of transactions) {
    const amt = Number(tx.amount);
    const wasDeposit = tx.is_positive === false;
    historyDataPoints.push({
      val: runningSavingsVal,
      date: new Date(tx.created_at),
      change: wasDeposit ? amt : -amt
    });

    if (wasDeposit) {
      runningSavingsVal -= amt;
    } else {
      runningSavingsVal += amt;
    }
  }

  // If there is only 1 transaction, add a starting point of 0/initial so we can render a line.
  if (transactions.length === 1) {
    const firstTxDate = new Date(transactions[0].created_at);
    const startDate = new Date(firstTxDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before
    historyDataPoints.push({
      val: runningSavingsVal,
      date: startDate,
      change: 0
    });
  }

  const plotPoints = historyDataPoints.reverse();

  const maxVal = Math.max(guardadito.target || 0, ...plotPoints.map((p) => p.val));
  const minVal = 0;
  const range = maxVal - minVal || 1;

  // Build SVG path
  const width = 560;
  const height = 160;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingBottom = 30;
  const paddingTop = 20;

  const coords = plotPoints.map((p, idx) => {
    const x = paddingLeft + (idx / (plotPoints.length - 1 || 1)) * (width - paddingLeft - paddingRight);
    const y = height - paddingBottom - ((p.val - minVal) / range) * (height - paddingBottom - paddingTop);
    return { x, y, val: p.val, date: p.date, change: p.change };
  });

  let pointsString = "";
  let areaString = "";

  if (plotPoints.length > 1) {
    pointsString = coords.map((c) => `${c.x},${c.y}`).join(" ");
    areaString = `M ${coords[0].x},${height - paddingBottom} L ${pointsString} L ${coords[coords.length - 1].x},${height - paddingBottom} Z`;
  }

  const showXLabelList = coords.map((_, idx) => {
    if (coords.length <= 5) return true;
    if (idx === 0 || idx === coords.length - 1) return true;
    if (coords.length === 6 && idx === 3) return true;
    if (coords.length > 6 && idx === Math.floor(coords.length / 2)) return true;
    return false;
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[var(--color-bg)]">
      <Sidebar onFabClick={() => openTxModal("EXPENSE")} />

      <div className="flex-1 flex flex-col min-h-screen">
        <TopBar 
          userName={userName} 
          avatarUrl={avatarUrl} 
          breadcrumbOptions={{
            parentHref: "/",
            parentLabel: "Dashboard",
            last: guardadito.name
          }}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6 pb-20 w-full max-w-4xl mx-auto flex flex-col gap-8">
          {/* Header Card / Progress */}
          <div
            style={{ background: theme.gradient, boxShadow: `0 0 30px ${theme.glowColor}` }}
            className="pinstripe relative overflow-hidden rounded-2xl p-6 border border-white/5 flex flex-col gap-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
              <div className="flex flex-col">
                <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] text-[var(--color-on-muted)] uppercase">
                  Ahorrado actualmente
                </span>
                <span className="text-4xl font-extrabold text-[var(--color-on-surface)] tracking-tight mt-1">
                  ${Number(guardadito.current).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex flex-col md:items-end">
                <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] text-[var(--color-on-muted)] uppercase">
                  Meta de ahorro
                </span>
                <span className="text-xl font-semibold text-[var(--color-on-surface)] mt-1">
                  {guardadito.target !== null
                    ? `$${Number(guardadito.target).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                    : "Sin meta"}
                </span>
              </div>
            </div>

            {guardadito.target !== null ? (
              <div className="flex flex-col gap-2 z-10">
                <div className="flex justify-between text-xs text-[var(--color-on-dim)] font-[var(--font-data)]">
                  <span>{progressPercent.toFixed(1)}% completado</span>
                  <span>Restan: ${Math.max(0, guardadito.target - guardadito.current).toLocaleString("en-US")}</span>
                </div>
                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${progressPercent}%`, backgroundColor: theme.textColor }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* SVG Progression Chart */}
          <section className="bg-[var(--color-surface-1)] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--color-on-surface)]">
              Progreso Histórico
            </h2>
            {plotPoints.length > 1 ? (
              <div className="w-full relative" style={{ aspectRatio: "3.5 / 1" }}>
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full h-full"
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.textColor} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={theme.textColor} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Y-axis gridlines & labels */}
                  <text
                    x={paddingLeft - 10}
                    y={height - paddingBottom}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    fill="rgba(255,255,255,0.4)"
                    fontSize="9"
                    fontFamily="var(--font-data)"
                  >
                    $0
                  </text>
                  <line
                    x1={paddingLeft}
                    y1={height - paddingBottom}
                    x2={width - paddingRight}
                    y2={height - paddingBottom}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                  />

                  <text
                    x={paddingLeft - 10}
                    y={paddingTop + (height - paddingBottom - paddingTop) / 2}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    fill="rgba(255,255,255,0.4)"
                    fontSize="9"
                    fontFamily="var(--font-data)"
                  >
                    ${Math.round(maxVal / 2).toLocaleString("en-US")}
                  </text>
                  <line
                    x1={paddingLeft}
                    y1={paddingTop + (height - paddingBottom - paddingTop) / 2}
                    x2={width - paddingRight}
                    y2={paddingTop + (height - paddingBottom - paddingTop) / 2}
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />

                  <text
                    x={paddingLeft - 10}
                    y={paddingTop}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    fill="rgba(255,255,255,0.4)"
                    fontSize="9"
                    fontFamily="var(--font-data)"
                  >
                    ${Math.round(maxVal).toLocaleString("en-US")}
                  </text>
                  <line
                    x1={paddingLeft}
                    y1={paddingTop}
                    x2={width - paddingRight}
                    y2={paddingTop}
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />

                  {/* Gradient Area under line */}
                  {areaString && <path d={areaString} fill="url(#chartGradient)" />}
                  
                  {/* Line path */}
                  {pointsString && (
                    <polyline
                      fill="none"
                      stroke={theme.textColor}
                      strokeWidth="2.5"
                      points={pointsString}
                    />
                  )}

                  {/* Dot values (amounts above the circles) */}
                  {coords.map((c, idx) => {
                    if (c.change === 0) return null;
                    const showVal = showXLabelList[idx];
                    if (!showVal) return null;
                    let anchor: "start" | "middle" | "end" = "middle";
                    if (idx === 0) anchor = "start";
                    if (idx === coords.length - 1) anchor = "end";
                    return (
                      <text
                        key={`val-lbl-${idx}`}
                        x={c.x}
                        y={c.y - 10}
                        textAnchor={anchor}
                        fill={theme.textColor}
                        fontSize="9"
                        fontWeight="600"
                        fontFamily="var(--font-data)"
                      >
                        {c.change > 0 ? "+" : "-"}${Math.abs(Math.round(c.change)).toLocaleString("en-US")}
                      </text>
                    );
                  })}

                  {/* Render circles (dots) at each coordinate */}
                  {coords.map((c, idx) => (
                    <circle
                      key={`dot-${idx}`}
                      cx={c.x}
                      cy={c.y}
                      r="4.5"
                      fill={theme.textColor}
                      stroke="#0a0a0a"
                      strokeWidth="1.5"
                    />
                  ))}

                  {/* X-axis labels (dates below the circles) */}
                  {coords.map((c, idx) => {
                    if (!showXLabelList[idx]) return null;
                    let anchor: "start" | "middle" | "end" = "middle";
                    if (idx === 0) anchor = "start";
                    if (idx === coords.length - 1) anchor = "end";
                    return (
                      <text
                        key={`x-lbl-${idx}`}
                        x={c.x}
                        y={height - paddingBottom + 16}
                        textAnchor={anchor}
                        fill="rgba(255,255,255,0.4)"
                        fontSize="9"
                        fontFamily="var(--font-data)"
                      >
                        {c.date.toLocaleDateString("es-MX", { day: 'numeric', month: 'short' })}
                      </text>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div className="h-[120px] flex items-center justify-center border border-dashed border-white/5 rounded-xl text-xs text-[var(--color-on-dim)]">
                Agrega transacciones o depósitos para ver tu progreso en el tiempo.
              </div>
            )}
          </section>

          {/* Quick Deposit Actions */}
          <section className="bg-[var(--color-surface-2)] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-[var(--color-on-surface)]">
                  Ingresar Dinero (Ahorrar)
                </h2>
                <p className="text-[11px] text-[var(--color-on-dim)] mt-0.5">
                  Añade fondos directamente a este guardadito
                </p>
              </div>
              <button
                onClick={() => setIsDepositOpen(true)}
                className="h-10 px-5 rounded-xl bg-[var(--color-primary-ctr)] text-white text-xs font-bold tracking-widest uppercase hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Depositar
              </button>
            </div>
          </section>

          {/* Notes & Links Form */}
          <section className="bg-[var(--color-surface-2)] border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--color-on-surface)] mb-4">
              Notas y Enlaces
            </h2>
            <form onSubmit={handleSaveDetails} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
                  Notas sobre tu meta
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escribe detalles como el modelo del auto, fechas estimadas, o planes de viaje..."
                  rows={3}
                  disabled={isPending}
                  className="w-full rounded-xl bg-[var(--color-surface-3)] border border-white/5 p-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
                  Enlace externo (ej. tienda, cotización)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://example.com/item"
                    disabled={isPending}
                    className="flex-1 h-11 rounded-xl bg-[var(--color-surface-3)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
                  />
                  {guardadito.link && (
                    <a
                      href={guardadito.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-11 w-11 rounded-xl bg-[var(--color-surface-3)] flex items-center justify-center border border-white/5 hover:text-[var(--color-primary)] transition-colors"
                      title="Visitar enlace"
                    >
                      <TranslateIcon iconKey="plane" size={16} />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex justify-end items-center gap-3">
                {isSaved && (
                  <span className="text-xs text-[var(--color-primary)] animate-pulse">
                    ¡Guardado con éxito!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-10 px-5 rounded-xl bg-[var(--color-surface-3)] border border-white/10 hover:border-white/20 text-xs font-semibold tracking-wider hover:-translate-y-0.5 active:translate-y-0 transition-all text-[var(--color-on-surface)] disabled:opacity-50"
                >
                  Guardar Detalles
                </button>
              </div>
            </form>
          </section>

          {/* Historical Logs List */}
          <section className="bg-[var(--color-surface-1)] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--color-on-surface)]">
              Movimientos del Guardadito
            </h2>
            <div className="flex flex-col gap-3">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-white/5"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[var(--color-on-surface)]">
                        {tx.title}
                      </span>
                      <span className="text-[10px] text-[var(--color-on-dim)] font-[var(--font-data)]">
                        {new Date(tx.created_at).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold font-[var(--font-data)] ${
                        tx.is_positive ? "text-[var(--color-error)]" : "text-[var(--color-primary)]"
                      }`}
                    >
                      {tx.is_positive ? "-" : "+"}${Number(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-[var(--color-on-dim)]">
                  No hay transacciones registradas para este guardadito.
                </div>
              )}
            </div>
          </section>

          {/* Hidden withdraw option at the bottom */}
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-6">
            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="text-xs font-bold tracking-widest text-red-400/60 hover:text-red-300 transition-colors uppercase"
            >
              Quitar Dinero
            </button>
            <span className="text-white/10 hidden sm:inline">|</span>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="text-xs font-bold tracking-widest text-red-500 hover:text-red-400 transition-colors uppercase"
            >
              Eliminar Guardadito
            </button>
          </div>
        </main>
      </div>

      <BottomNav />

      {/* Deposit Drawer (Vaul) */}
      <Drawer.Root open={isDepositOpen} onOpenChange={(open) => {
        if (!open) setDepositError(null);
        setIsDepositOpen(open);
      }} direction="right">
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
          <Drawer.Content className="
            fixed z-50 text-[var(--color-on-surface)] bg-[var(--color-surface-3)] focus:outline-none
            /* Mobile: bottom-to-top */
            bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl border-t border-white/5 flex flex-col
            /* Desktop: right-to-left side-drawer */
            sm:top-0 sm:right-0 sm:left-auto sm:bottom-0 sm:w-[400px] sm:max-h-full sm:rounded-l-2xl sm:rounded-tr-none sm:border-l sm:border-t-0
          ">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 my-4 sm:hidden" />
            <div className="flex-1 overflow-y-auto px-6 pb-8 sm:py-8 w-full">
              <div className="flex items-center justify-between mb-6">
                <Drawer.Title className="text-lg font-semibold tracking-tight">
                  Depositar en {guardadito.name}
                </Drawer.Title>
                <Drawer.Close className="text-[var(--color-on-dim)] hover:text-[var(--color-on-surface)]">
                  <TranslateIcon iconKey="plus" size={20} className="rotate-45" />
                </Drawer.Close>
              </div>

              {depositError && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                  <TranslateIcon iconKey="emergency" size={14} className="shrink-0 mt-0.5 text-red-400" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-300">Error</p>
                    <p className="opacity-90">{depositError}</p>
                  </div>
                  <button type="button" onClick={() => setDepositError(null)} className="opacity-65 hover:opacity-100 transition-opacity">
                    <TranslateIcon iconKey="plus" size={12} className="rotate-45" />
                  </button>
                </div>
              )}

              <form onSubmit={handleDepositSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
                      Cantidad a ahorrar ($)
                    </label>
                    <span className="text-[10px] text-[var(--color-on-dim)] font-semibold">
                      Disponible: ${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={depositAmount}
                    onChange={(e) => {
                      setDepositAmount(e.target.value);
                      setDepositError(null);
                    }}
                    placeholder="0.00"
                    disabled={isPending}
                    className="h-11 w-full rounded-lg bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-11 w-full mt-2 rounded-xl bg-[var(--color-primary-ctr)] text-white font-[var(--font-data)] text-[12px] font-bold tracking-[0.15em] uppercase transition-all disabled:opacity-50"
                >
                  Confirmar Depósito
                </button>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Withdraw Drawer (Vaul) */}
      <Drawer.Root open={isWithdrawOpen} onOpenChange={(open) => {
        if (!open) setWithdrawError(null);
        setIsWithdrawOpen(open);
      }} direction="right">
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
          <Drawer.Content className="
            fixed z-50 text-[var(--color-on-surface)] bg-[var(--color-surface-3)] focus:outline-none
            /* Mobile: bottom-to-top */
            bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl border-t border-white/5 flex flex-col
            /* Desktop: right-to-left side-drawer */
            sm:top-0 sm:right-0 sm:left-auto sm:bottom-0 sm:w-[400px] sm:max-h-full sm:rounded-l-2xl sm:rounded-tr-none sm:border-l sm:border-t-0
          ">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 my-4 sm:hidden" />
            <div className="flex-1 overflow-y-auto px-6 pb-8 sm:py-8 w-full">
              <div className="flex items-center justify-between mb-6">
                <Drawer.Title className="text-lg font-semibold tracking-tight text-red-300">
                  Retirar de {guardadito.name}
                </Drawer.Title>
                <Drawer.Close className="text-[var(--color-on-dim)] hover:text-[var(--color-on-surface)]">
                  <TranslateIcon iconKey="plus" size={20} className="rotate-45" />
                </Drawer.Close>
              </div>

              <div className="bg-red-950/20 border border-red-900/30 p-3 rounded-lg text-xs text-red-200 leading-relaxed mb-4">
                ⚠️ <strong>Advertencia:</strong> Retirar dinero restará saldo de tus ahorros y lo devolverá a tu saldo general disponible.
              </div>

              {withdrawError && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                  <TranslateIcon iconKey="emergency" size={14} className="shrink-0 mt-0.5 text-red-400" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-300">Error</p>
                    <p className="opacity-90">{withdrawError}</p>
                  </div>
                  <button type="button" onClick={() => setWithdrawError(null)} className="opacity-65 hover:opacity-100 transition-opacity">
                    <TranslateIcon iconKey="plus" size={12} className="rotate-45" />
                  </button>
                </div>
              )}

              <form onSubmit={handleWithdrawSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
                      Cantidad a retirar ($)
                    </label>
                    <span className="text-[10px] text-[var(--color-on-dim)] font-semibold">
                      Disponible: ${guardadito.current.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={withdrawAmount}
                    onChange={(e) => {
                      setWithdrawAmount(e.target.value);
                      setWithdrawError(null);
                    }}
                    placeholder="0.00"
                    disabled={isPending}
                    className="h-11 w-full rounded-lg bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-red-500/50 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-11 w-full mt-2 rounded-xl bg-red-900 text-white font-[var(--font-data)] text-[12px] font-bold tracking-[0.15em] uppercase transition-all disabled:opacity-50 hover:bg-red-800"
                >
                  Confirmar Retiro
                </button>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <Drawer.Root open={isDeleteOpen} onOpenChange={setIsDeleteOpen} direction="right">
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
          <Drawer.Content className="
            fixed z-50 text-[var(--color-on-surface)] bg-[var(--color-surface-3)] focus:outline-none
            bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl border-t border-white/5 flex flex-col
            sm:top-0 sm:right-0 sm:left-auto sm:bottom-0 sm:w-[400px] sm:max-h-full sm:rounded-l-2xl sm:rounded-tr-none sm:border-l sm:border-t-0
          ">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 my-4 sm:hidden" />
            <div className="flex-1 overflow-y-auto px-6 pb-8 sm:py-8 w-full">
              <div className="flex items-center justify-between mb-6">
                <Drawer.Title className="text-lg font-semibold tracking-tight text-red-400">
                  Eliminar {guardadito.name}
                </Drawer.Title>
                <Drawer.Close className="text-[var(--color-on-dim)] hover:text-[var(--color-on-surface)]">
                  <TranslateIcon iconKey="plus" size={20} className="rotate-45" />
                </Drawer.Close>
              </div>

              <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-lg text-xs text-red-200 leading-relaxed mb-6 flex flex-col gap-2">
                <span className="font-bold text-red-300">⚠️ ¡Atención! Esta acción no se puede deshacer.</span>
                <span>Se eliminará de forma permanente el guardadito y el saldo ahorrado se devolverá a tu saldo general.</span>
              </div>

              <form onSubmit={handleDeleteSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
                    Para confirmar, escribe <span className="text-white select-all font-mono">eliminar {guardadito.name}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={confirmDeleteText}
                    onChange={(e) => setConfirmDeleteText(e.target.value)}
                    placeholder={`eliminar ${guardadito.name}`}
                    disabled={isPending}
                    className="h-11 w-full rounded-lg bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-red-500/50 transition-all font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending || confirmDeleteText !== `eliminar ${guardadito.name}`}
                  className="h-11 w-full mt-2 rounded-xl bg-red-700 hover:bg-red-600 disabled:bg-red-950/40 text-white font-[var(--font-data)] text-[12px] font-bold tracking-[0.15em] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Eliminar Definitivamente
                </button>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Transaction Modal (for Sidebar FAB) */}
      <TransactionModal
        isOpen={txModalState.isOpen}
        defaultType={txModalState.type}
        guardaditos={guardaditos}
        customCategories={customCategories}
        onClose={closeTxModal}
        onSubmitAction={createTransaction}
        walletBalance={walletBalance}
      />
    </div>
  );
}
