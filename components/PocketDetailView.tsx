"use client";

import React, { useState, useTransition } from "react";
import TranslateIcon from "@/components/translateIcon";
import SlidePanel from "./SlidePanel";
import {
  pocketDeposit,
  pocketExpense,
  transferPocketToWallet,
  transferPocketToGuardadito,
  updatePocket,
  deletePocket,
} from "@/app/actions_pockets";
import PocketCard, { PocketData, POCKET_PRESETS, getPocketStyles } from "./PocketCard";
import BackBreadcrumb from "./BackBreadcrumb";
import type { CustomCategory } from "./DashboardView";
import { useBreadcrumbs } from "@/lib/BreadcrumbContext";

type PocketDetailViewProps = {
  pocket: PocketData;
  transactions: {
    id: string;
    amount: number;
    is_positive: boolean;
    created_at: string;
    title: string;
    icon?: string;
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
};

const BUILTIN_CATEGORIES = [
  { label: "Compras", value: "shopping", iconKey: "shopping" },
  { label: "Restaurantes", value: "dining", iconKey: "dining" },
  { label: "Inversión", value: "dividend", iconKey: "dividend" },
  { label: "Viajes", value: "plane", iconKey: "plane" },
  { label: "Auto", value: "car", iconKey: "car" },
  { label: "Emergencia", value: "emergency", iconKey: "emergency" },
] as const;

export default function PocketDetailView({
  pocket,
  transactions,
  guardaditos,
  customCategories,
}: PocketDetailViewProps) {
  useBreadcrumbs({
    parentHref: "/wallet",
    parentLabel: "Billetera",
    last: pocket.name,
  });

  const [isPending, startTransition] = useTransition();

  // Drawers open states
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isTransferWalletOpen, setIsTransferWalletOpen] = useState(false);
  const [isTransferGuardaditoOpen, setIsTransferGuardaditoOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [depositAmount, setDepositAmount] = useState("");
  const [depositCategory, setDepositCategory] = useState("dividend");
  const [depositNote, setDepositNote] = useState("");
  const [depositError, setDepositError] = useState<string | null>(null);

  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("shopping");
  const [expenseNote, setExpenseNote] = useState("");
  const [expenseError, setExpenseError] = useState<string | null>(null);

  const [transferWalletAmount, setTransferWalletAmount] = useState("");
  const [transferWalletError, setTransferWalletError] = useState<string | null>(null);

  const [transferGuardaditoAmount, setTransferGuardaditoAmount] = useState("");
  const [selectedGuardaditoId, setSelectedGuardaditoId] = useState(
    guardaditos[0]?.id || ""
  );
  const [transferGuardaditoError, setTransferGuardaditoError] = useState<string | null>(null);

  // Edit states
  const [editName, setEditName] = useState(pocket.name);
  const [editSubtitle, setEditSubtitle] = useState(pocket.subtitle || "");
  const [editPreset, setEditPreset] = useState(pocket.design_preset);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete option
  const [transferRemaining, setTransferRemaining] = useState(true);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleOpenDeleteChange = (open: boolean) => {
    setIsDeleteOpen(open);
    if (!open) {
      setDeleteConfirmText("");
    }
  };

  const styles = getPocketStyles(pocket);

  // Reconstruct running history for sparkline chart
  let running = Number(pocket.balance);
  const plotPoints = [{ val: running, date: new Date() }];
  for (const tx of transactions) {
    if (tx.is_positive) {
      running -= Number(tx.amount);
    } else {
      running += Number(tx.amount);
    }
    plotPoints.unshift({ val: running, date: new Date(tx.created_at) });
  }

  // Sparkline Chart dimensions
  const width = 500;
  const height = 150;
  const paddingTop = 20;
  const paddingBottom = 25;
  const paddingLeft = 45;
  const paddingRight = 15;

  const maxVal = Math.max(...plotPoints.map((p) => p.val), 10);
  const minVal = Math.min(...plotPoints.map((p) => p.val), 0);
  const valRange = maxVal - minVal || 1;

  const coords = plotPoints.map((p, idx) => {
    const x = paddingLeft + (idx / (plotPoints.length - 1 || 1)) * (width - paddingLeft - paddingRight);
    const y = paddingTop + ((maxVal - p.val) / valRange) * (height - paddingTop - paddingBottom);
    return { x, y, val: p.val, date: p.date };
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
    if (coords.length > 5 && idx === Math.floor(coords.length / 2)) return true;
    return false;
  });

  // Category listing
  const allCategories = [
    ...BUILTIN_CATEGORIES,
    ...customCategories.map((c) => ({
      label: c.label,
      value: c.icon,
      iconKey: c.icon,
    })),
  ];

  // Action handlers
  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError(null);
    const parsed = parseFloat(depositAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setDepositError("Monto inválido");
      return;
    }

    startTransition(async () => {
      try {
        await pocketDeposit(pocket.id, parsed, depositCategory, depositNote);
        setDepositAmount("");
        setDepositNote("");
        setIsDepositOpen(false);
      } catch (err: any) {
        setDepositError(err.message || "Error al depositar");
      }
    });
  };

  const handleExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError(null);
    const parsed = parseFloat(expenseAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setExpenseError("Monto inválido");
      return;
    }

    if (parsed > pocket.balance) {
      setExpenseError("Fondos insuficientes en la tarjeta");
      return;
    }

    startTransition(async () => {
      try {
        await pocketExpense(pocket.id, parsed, expenseCategory, expenseNote);
        setExpenseAmount("");
        setExpenseNote("");
        setIsExpenseOpen(false);
      } catch (err: any) {
        setExpenseError(err.message || "Error al registrar gasto");
      }
    });
  };

  const handleTransferWallet = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferWalletError(null);
    const parsed = parseFloat(transferWalletAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setTransferWalletError("Monto inválido");
      return;
    }

    if (parsed > pocket.balance) {
      setTransferWalletError("Fondos insuficientes en la tarjeta");
      return;
    }

    startTransition(async () => {
      try {
        await transferPocketToWallet(pocket.id, parsed);
        setTransferWalletAmount("");
        setIsTransferWalletOpen(false);
      } catch (err: any) {
        setTransferWalletError(err.message || "Error en la transferencia");
      }
    });
  };

  const handleTransferGuardadito = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferGuardaditoError(null);
    const parsed = parseFloat(transferGuardaditoAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setTransferGuardaditoError("Monto inválido");
      return;
    }

    if (!selectedGuardaditoId) {
      setTransferGuardaditoError("Selecciona un guardadito de destino");
      return;
    }

    if (parsed > pocket.balance) {
      setTransferGuardaditoError("Fondos insuficientes en la tarjeta");
      return;
    }

    startTransition(async () => {
      try {
        await transferPocketToGuardadito(pocket.id, selectedGuardaditoId, parsed);
        setTransferGuardaditoAmount("");
        setIsTransferGuardaditoOpen(false);
      } catch (err: any) {
        setTransferGuardaditoError(err.message || "Error en la transferencia");
      }
    });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    if (!editName.trim()) {
      setEditError("El nombre de la tarjeta es requerido");
      return;
    }

    startTransition(async () => {
      try {
        await updatePocket(
          pocket.id,
          editName,
          editSubtitle,
          editPreset,
          pocket.custom_design // Keep custom design if it was custom
        );
        setIsEditOpen(false);
      } catch (err: any) {
        setEditError(err.message || "Error al actualizar");
      }
    });
  };

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await deletePocket(pocket.id, transferRemaining);
      } catch (err: any) {
        alert(err.message || "Error al eliminar");
      }
    });
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto px-6 py-6 pb-20 flex flex-col gap-8">
          {/* Quick Stats & Card Display */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 w-full max-w-sm mx-auto md:mx-0">
              <PocketCard pocket={pocket} isInteractive={false} />
            </div>

            <div className="md:col-span-7 flex flex-col gap-4 self-stretch justify-center bg-[var(--color-surface-1)] border border-white/5 p-6 rounded-2xl">
              <div>
                <p className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--color-on-dim)]">
                  Balance en Tarjeta
                </p>
                <p className="font-[var(--font-data)] text-3xl font-extrabold text-[var(--color-on-surface)] mt-1">
                  {new Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  }).format(pocket.balance)}
                </p>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <button
                  onClick={() => setIsDepositOpen(true)}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5 text-[var(--color-on-surface)] hover:border-white/10 active:scale-95 transition-all text-center"
                >
                  <TranslateIcon iconKey="plus" size={18} className="text-[var(--color-primary)]" />
                  <span className="text-[10px] font-bold tracking-wide uppercase">Ingresar</span>
                </button>

                <button
                  onClick={() => setIsExpenseOpen(true)}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5 text-[var(--color-on-surface)] hover:border-white/10 active:scale-95 transition-all text-center"
                >
                  <TranslateIcon iconKey="minus" size={18} className="text-red-400" />
                  <span className="text-[10px] font-bold tracking-wide uppercase">Gastar</span>
                </button>

                <button
                  onClick={() => setIsTransferWalletOpen(true)}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5 text-[var(--color-on-surface)] hover:border-white/10 active:scale-95 transition-all text-center"
                >
                  <TranslateIcon iconKey="wallet" size={18} className="text-blue-400" />
                  <span className="text-[10px] font-bold tracking-wide uppercase">A Billetera</span>
                </button>

                <button
                  onClick={() => setIsTransferGuardaditoOpen(true)}
                  disabled={guardaditos.length === 0}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-[var(--color-surface-2)] border border-white/5 text-[var(--color-on-surface)] hover:border-white/10 active:scale-95 transition-all text-center disabled:opacity-40"
                >
                  <TranslateIcon iconKey="piggybank" size={18} className="text-yellow-400" />
                  <span className="text-[10px] font-bold tracking-wide uppercase">A Guardadito</span>
                </button>
              </div>
            </div>
          </div>

          {/* Progression Sparkline */}
          <section className="bg-[var(--color-surface-1)] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--color-on-surface)]">
              Historial de Balance (Tendencia)
            </h2>
            {plotPoints.length > 1 ? (
              <div className="w-full relative" style={{ aspectRatio: "3.5 / 1" }}>
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={styles.accent} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={styles.accent} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal gridlines */}
                  <line
                    x1={paddingLeft}
                    y1={height - paddingBottom}
                    x2={width - paddingRight}
                    y2={height - paddingBottom}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                  />
                  <line
                    x1={paddingLeft}
                    y1={paddingTop + (height - paddingBottom - paddingTop) / 2}
                    x2={width - paddingRight}
                    y2={paddingTop + (height - paddingBottom - paddingTop) / 2}
                    stroke="rgba(255,255,255,0.02)"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  <line
                    x1={paddingLeft}
                    y1={paddingTop}
                    x2={width - paddingRight}
                    y2={paddingTop}
                    stroke="rgba(255,255,255,0.02)"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />

                  {/* Y values labels */}
                  <text
                    x={paddingLeft - 8}
                    y={height - paddingBottom}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    fill="rgba(255,255,255,0.3)"
                    fontSize="9"
                    fontFamily="var(--font-data)"
                  >
                    ${Math.round(minVal)}
                  </text>
                  <text
                    x={paddingLeft - 8}
                    y={paddingTop + (height - paddingBottom - paddingTop) / 2}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    fill="rgba(255,255,255,0.3)"
                    fontSize="9"
                    fontFamily="var(--font-data)"
                  >
                    ${Math.round((maxVal + minVal) / 2)}
                  </text>
                  <text
                    x={paddingLeft - 8}
                    y={paddingTop}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    fill="rgba(255,255,255,0.3)"
                    fontSize="9"
                    fontFamily="var(--font-data)"
                  >
                    ${Math.round(maxVal)}
                  </text>

                  {/* Gradient area */}
                  {areaString && <path d={areaString} fill="url(#chartGradient)" />}

                  {/* Line */}
                  {pointsString && (
                    <polyline
                      fill="none"
                      stroke={styles.accent}
                      strokeWidth="2.5"
                      points={pointsString}
                    />
                  )}

                  {/* Nodes */}
                  {coords.map((c, idx) => (
                    <circle
                      key={`dot-${idx}`}
                      cx={c.x}
                      cy={c.y}
                      r="4.5"
                      fill={styles.accent}
                      stroke="#0a0a0a"
                      strokeWidth="1.5"
                    />
                  ))}

                  {/* Date labels */}
                  {coords.map((c, idx) => {
                    if (!showXLabelList[idx]) return null;
                    let anchor: "start" | "middle" | "end" = "middle";
                    if (idx === 0) anchor = "start";
                    if (idx === coords.length - 1) anchor = "end";
                    return (
                      <text
                        key={`x-lbl-${idx}`}
                        x={c.x}
                        y={height - paddingBottom + 15}
                        textAnchor={anchor}
                        fill="rgba(255,255,255,0.3)"
                        fontSize="9"
                        fontFamily="var(--font-data)"
                      >
                        {c.date.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                      </text>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div className="h-[120px] flex items-center justify-center border border-dashed border-white/5 rounded-xl text-xs text-[var(--color-on-dim)]">
                Agrega transacciones para ver la tendencia de balance en esta tarjeta.
              </div>
            )}
          </section>

          {/* Historical Logs List */}
          <section className="bg-[var(--color-surface-1)] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--color-on-surface)]">
              Movimientos de la Tarjeta
            </h2>
            <div className="flex flex-col gap-3">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-surface-2)]/60 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${styles.accent}12`,
                          color: styles.accent,
                        }}
                      >
                        <TranslateIcon iconKey={tx.icon || "wallet"} size={16} />
                      </div>
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
                    </div>
                    <span
                      className={`text-xs font-bold font-[var(--font-data)] ${
                        tx.is_positive ? "text-[var(--color-primary)]" : "text-red-400"
                      }`}
                    >
                      {tx.is_positive ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-[var(--color-on-dim)]">
                  No hay transacciones registradas para este pocket.
                </div>
              )}
            </div>
          </section>

          {/* Danger zone actions */}
          <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-6">
            <button
              onClick={() => setIsEditOpen(true)}
              className="text-xs font-bold tracking-widest text-[var(--color-primary)] hover:opacity-85 transition-opacity uppercase"
            >
              Editar Tarjeta
            </button>
            <span className="text-white/10 hidden sm:inline">|</span>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="text-xs font-bold tracking-widest text-red-400 hover:text-red-300 transition-colors uppercase"
            >
              Eliminar Tarjeta
            </button>
          </div>
        </div>

      {/* ── MODALS ── */}

      {/* 1. Deposit */}
      <SlidePanel open={isDepositOpen} onClose={() => setIsDepositOpen(false)} title={`Ingresar Dinero a ${pocket.name}`}>
        {depositError && (
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs">
            {depositError}
          </div>
        )}
        <form onSubmit={handleDeposit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
              Monto
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.00"
              disabled={isPending}
              className="h-11 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
              Categoría
            </span>
            <div className="grid grid-cols-3 gap-2">
              {allCategories.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setDepositCategory(c.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                    depositCategory === c.value
                      ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]"
                      : "bg-[var(--color-surface-2)] border-white/5 text-[var(--color-on-dim)]"
                  }`}
                >
                  <TranslateIcon iconKey={c.iconKey} size={16} />
                  <span className="text-[9px] truncate w-full">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
              Concepto / Nota (Opcional)
            </label>
            <input
              type="text"
              value={depositNote}
              onChange={(e) => setDepositNote(e.target.value)}
              placeholder="ej. Transferencia SPEI, Reembolso..."
              disabled={isPending}
              className="h-11 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="h-11 w-full mt-2 rounded-xl bg-[var(--color-primary-ctr)] text-white font-[var(--font-data)] text-[12px] font-bold tracking-[0.15em] uppercase transition-all disabled:opacity-50"
          >
            {isPending ? "Procesando..." : "Confirmar Ingreso"}
          </button>
        </form>
      </SlidePanel>

      {/* 2. Expense */}
      <SlidePanel open={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} title={`Gastar desde ${pocket.name}`} titleClassName="text-red-300">
        {expenseError && (
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs">
            {expenseError}
          </div>
        )}
        <form onSubmit={handleExpense} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
              Monto
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="0.00"
              disabled={isPending}
              className="h-11 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
              Categoría
            </span>
            <div className="grid grid-cols-3 gap-2">
              {allCategories.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setExpenseCategory(c.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                    expenseCategory === c.value
                      ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]"
                      : "bg-[var(--color-surface-2)] border-white/5 text-[var(--color-on-dim)]"
                  }`}
                >
                  <TranslateIcon iconKey={c.iconKey} size={16} />
                  <span className="text-[9px] truncate w-full">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
              Concepto / Nota (Opcional)
            </label>
            <input
              type="text"
              value={expenseNote}
              onChange={(e) => setExpenseNote(e.target.value)}
              placeholder="ej. Súper, Gasolina, Netflix..."
              disabled={isPending}
              className="h-11 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="h-11 w-full mt-2 rounded-xl bg-red-950/40 text-red-200 border border-red-500/20 font-[var(--font-data)] text-[12px] font-bold tracking-[0.15em] uppercase transition-all disabled:opacity-50"
          >
            {isPending ? "Procesando..." : "Confirmar Gasto"}
          </button>
        </form>
      </SlidePanel>

      {/* 3. Transfer to Wallet */}
      <SlidePanel open={isTransferWalletOpen} onClose={() => setIsTransferWalletOpen(false)} title="Retirar a Billetera disponible">
        {transferWalletError && (
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs">
            {transferWalletError}
          </div>
        )}
        <form onSubmit={handleTransferWallet} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
              Monto a Transferir
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={transferWalletAmount}
              onChange={(e) => setTransferWalletAmount(e.target.value)}
              placeholder="0.00"
              disabled={isPending}
              className="h-11 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
            />
          </div>

          <div className="text-xs text-[var(--color-on-dim)] leading-relaxed">
            Esta acción moverá el dinero de tu tarjeta virtual <strong>{pocket.name}</strong> a tu balance general disponible, reduciendo el saldo del Pocket.
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="h-11 w-full mt-2 rounded-xl bg-[var(--color-primary-ctr)] text-white font-[var(--font-data)] text-[12px] font-bold tracking-[0.15em] uppercase transition-all disabled:opacity-50"
          >
            {isPending ? "Transfiriendo..." : "Confirmar Transferencia"}
          </button>
        </form>
      </SlidePanel>

      {/* 4. Transfer to Guardadito */}
      <SlidePanel open={isTransferGuardaditoOpen} onClose={() => setIsTransferGuardaditoOpen(false)} title="Ahorrar en Guardadito">
        {transferGuardaditoError && (
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs">
            {transferGuardaditoError}
          </div>
        )}
        <form onSubmit={handleTransferGuardadito} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
              Monto a Ahorrar
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={transferGuardaditoAmount}
              onChange={(e) => setTransferGuardaditoAmount(e.target.value)}
              placeholder="0.00"
              disabled={isPending}
              className="h-11 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
              Selecciona Guardadito
            </label>
            <select
              value={selectedGuardaditoId}
              onChange={(e) => setSelectedGuardaditoId(e.target.value)}
              className="h-11 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
            >
              {guardaditos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.formattedAmount})
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-[var(--color-on-dim)] leading-relaxed">
            Esta acción transferirá fondos directamente desde tu pocket <strong>{pocket.name}</strong> a la meta de ahorro seleccionada, aumentando su balance sin afectar la billetera general disponible.
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="h-11 w-full mt-2 rounded-xl bg-[var(--color-primary-ctr)] text-white font-[var(--font-data)] text-[12px] font-bold tracking-[0.15em] uppercase transition-all disabled:opacity-50"
          >
            {isPending ? "Ahorrando..." : "Confirmar Ahorro"}
          </button>
        </form>
      </SlidePanel>

      {/* 5. Edit Card */}
      <SlidePanel open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Tarjeta">
        {editError && (
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs">
            {editError}
          </div>
        )}
        <form onSubmit={handleEdit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
              Nombre
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={isPending}
              className="h-11 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
              Subtítulo / Nota corta
            </label>
            <input
              type="text"
              value={editSubtitle}
              onChange={(e) => setEditSubtitle(e.target.value)}
              disabled={isPending}
              className="h-11 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
            />
          </div>

          {!pocket.custom_design && (
            <div className="flex flex-col gap-2">
              <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
                Diseño / Preset
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(POCKET_PRESETS) as Array<keyof typeof POCKET_PRESETS>).map((key) => {
                  const preset = POCKET_PRESETS[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditPreset(key)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold truncate transition-all text-left ${
                        editPreset === key
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                          : "border-white/5"
                      }`}
                      style={{ background: preset.bg }}
                    >
                      {key.replace("-", " ")}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="h-11 w-full mt-2 rounded-xl bg-[var(--color-primary-ctr)] text-white font-[var(--font-data)] text-[12px] font-bold tracking-[0.15em] uppercase transition-all disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Guardar Cambios"}
          </button>
        </form>
      </SlidePanel>

      {/* 6. Delete Confirmation */}
      <SlidePanel open={isDeleteOpen} onClose={() => handleOpenDeleteChange(false)} title="¿Eliminar Tarjeta?" titleClassName="text-red-300">
        <div className="bg-red-950/20 border border-red-900/30 p-3 rounded-lg text-xs text-red-200 leading-relaxed">
          ⚠️ <strong>Esta acción es irreversible.</strong> Se eliminará la tarjeta <strong>{pocket.name}</strong> y su historial de transacciones.
        </div>

        <form onSubmit={handleDelete} className="flex flex-col gap-5">
          {pocket.balance > 0 && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-white/5">
              <input
                type="checkbox"
                id="transfer-remaining"
                checked={transferRemaining}
                onChange={(e) => setTransferRemaining(e.target.checked)}
                className="mt-0.5"
              />
              <div className="flex flex-col">
                <label htmlFor="transfer-remaining" className="text-xs font-semibold text-[var(--color-on-surface)] select-none cursor-pointer">
                  Transferir saldo restante a Billetera
                </label>
                <span className="text-[10px] text-[var(--color-on-dim)] mt-0.5 leading-normal">
                  Mueve ${pocket.balance.toFixed(2)} de saldo a tu balance disponible general antes de borrar la tarjeta.
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="delete-confirm" className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
              Escribe <span className="text-red-400 font-bold select-all">"{pocket.name}"</span> para confirmar
            </label>
            <input
              id="delete-confirm"
              type="text"
              required
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Nombre de la tarjeta..."
              className="h-11 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-red-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || deleteConfirmText.trim().toLowerCase() !== pocket.name.trim().toLowerCase()}
            className="h-11 w-full rounded-xl text-white font-[var(--font-data)] text-[12px] font-bold tracking-[0.15em] uppercase transition-all disabled:opacity-30"
            style={{ backgroundColor: "rgb(185, 28, 28)" }}
          >
            {isPending ? "Eliminando..." : "Eliminar Definitivamente"}
          </button>
        </form>
      </SlidePanel>
    </>
  );
}


