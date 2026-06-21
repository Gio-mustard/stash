"use client";

import React, { useState, useTransition, useRef, useCallback } from "react";
import { Drawer } from "vaul";
import TranslateIcon from "./translateIcon";
import { ICON_MAP } from "./translateIcon";
import type { GuardaditoData } from "./GuardaditosSection";
import type { CustomCategory } from "./DashboardView";
import { createCustomCategory } from "@/app/actions_extended";

const BUILTIN_CATEGORIES = [
  { label: "Compras",      value: "shopping",  iconKey: "shopping" },
  { label: "Restaurantes",  value: "dining",    iconKey: "dining" },
  { label: "Inversión",     value: "dividend",  iconKey: "dividend" },
  { label: "Viajes",       value: "plane",     iconKey: "plane" },
  { label: "Auto",         value: "car",       iconKey: "car" },
  { label: "Emergencia",   value: "emergency", iconKey: "emergency" },
] as const;

const CUSTOM_ICON_OPTIONS = [
  "briefcase", "wallet", "creditCard", "banknote",
  "piggybank", "home", "settings", "stickyNote",
  "shopping", "dining", "dividend", "plane", "car", "emergency",
] as (keyof typeof ICON_MAP)[];

import type { PocketData } from "./PocketCard";

type TransactionModalProps = {
  isOpen: boolean;
  defaultType: "EXPENSE" | "INCOME";
  guardaditos: GuardaditoData[];
  pockets?: PocketData[];
  customCategories: CustomCategory[];
  onClose: () => void;
  onSubmitAction: (formData: FormData) => Promise<void>;
  walletBalance: number;
};

/**
 * TransactionModal renders a full-screen Vaul Drawer to create a new income or expense.
 * Features: type toggle, large amount input, category icon chips, date picker,
 * guardadito selector, note field, receipt upload, and custom category creation.
 *
 * @param props - The modal controller properties.
 */
export default function TransactionModal({
  isOpen,
  defaultType,
  guardaditos,
  pockets = [],
  customCategories,
  onClose,
  onSubmitAction,
  walletBalance,
}: TransactionModalProps) {
  const [txType, setTxType] = useState<"EXPENSE" | "INCOME">(defaultType);
  const [selectedCategory, setSelectedCategory] = useState<string>("shopping");
  const [selectedGuardadito, setSelectedGuardadito] = useState<string>("");
  const [selectedPocket, setSelectedPocket] = useState<string>("");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatIcon, setNewCatIcon] = useState<string>("briefcase");
  const [localCustomCategories, setLocalCustomCategories] = useState<CustomCategory[]>(customCategories);
  const [amountVal, setAmountVal] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isSavingCat, startCatTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setTxType(defaultType);
      setSelectedCategory("shopping");
      setSelectedGuardadito("");
      setSelectedPocket("");
      setReceiptPreview(null);
      setReceiptFile(null);
      setShowNewCategory(false);
      setNewCatLabel("");
      setAmountVal("");
      setErrorMessage(null);
      onClose();
    }
  }, [defaultType, onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveNewCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCatLabel.trim()) return;
    const tempId = `local-${Date.now()}`;
    const newCat: CustomCategory = { id: tempId, label: newCatLabel.trim(), icon: newCatIcon };
    setLocalCustomCategories((prev) => [...prev, newCat]);
    setSelectedCategory(newCatIcon);

    startCatTransition(async () => {
      const fd = new FormData();
      fd.append("label", newCatLabel.trim());
      fd.append("icon", newCatIcon);
      await createCustomCategory(fd);
    });

    setShowNewCategory(false);
    setNewCatLabel("");
    setNewCatIcon("briefcase");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(event.currentTarget);
    formData.set("type", txType);
    formData.set("category", selectedCategory);
    if (selectedGuardadito) {
      formData.set("guardadito_id", selectedGuardadito);
    }
    if (selectedPocket) {
      formData.set("pocket_id", selectedPocket);
    }
    if (receiptFile) {
      formData.set("receipt_file", receiptFile);
    }

    const amountStr = formData.get("amount") as string;
    const amount = Math.abs(parseFloat(amountStr));
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage("Por favor, ingresa un monto válido.");
      return;
    }

    // Client-side balance check for Expenses
    if (txType === "EXPENSE") {
      if (selectedPocket) {
        const pocket = pockets.find(p => p.id === selectedPocket);
        const pocketBalance = pocket ? pocket.balance : 0;
        if (amount > pocketBalance) {
          setErrorMessage(`Fondos insuficientes en la tarjeta "${pocket?.name}". Saldo disponible: $${pocketBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}.`);
          return;
        }
      } else if (selectedGuardadito) {
        const guard = guardaditos.find(g => g.id === selectedGuardadito);
        const guardBalance = guard ? guard.current : 0;
        if (amount > guardBalance) {
          setErrorMessage(`Fondos insuficientes en el guardadito "${guard?.name}". Saldo disponible: $${guardBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}.`);
          return;
        }
      } else {
        if (amount > walletBalance) {
          setErrorMessage(`Fondos insuficientes en tu billetera. Saldo disponible: $${walletBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}.`);
          return;
        }
      }
    }

    startTransition(async () => {
      try {
        await onSubmitAction(formData);
        setSelectedCategory("shopping");
        setSelectedGuardadito("");
        setSelectedPocket("");
        setReceiptPreview(null);
        setReceiptFile(null);
        setAmountVal("");
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message || "Error al registrar la transacción.");
      }
    });
  };

  const allCategories = [
    ...BUILTIN_CATEGORIES.map((c) => ({ label: c.label, value: c.value, iconKey: c.iconKey as string })),
    ...localCustomCategories.map((c) => ({ label: c.label, value: c.icon, iconKey: c.icon })),
  ];

  return (
    <Drawer.Root open={isOpen} onOpenChange={handleOpenChange} direction="bottom">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 animate-in fade-in duration-200 bottom-0 right-0" />
        <Drawer.Content className="
          fixed z-50 bg-[var(--color-surface-3)] text-[var(--color-on-surface)] focus:outline-none
          bottom-0 left-0 right-0 h-[95dvh] rounded-t-2xl border-t border-white/5 flex flex-row
          sm:top-0 sm:right-0 sm:left-auto sm:bottom-0 sm:w-[420px] sm:h-full sm:rounded-l-2xl sm:rounded-tr-none sm:border-l sm:border-t-0
          ml-2 rounded-r-none
        ">
          <div className=" w-1.5 h-12 flex-shrink-0 rounded-full bg-white/10 my-4 sm:hidden self-center ml-2" />

          <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col py-6 overflow-y-auto">
            
              <Drawer.Close
                aria-label="Cerrar"
                className="absolute top-2 right-2 size-8 z-50 min-h-8 flex items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-on-dim)] hover:text-[var(--color-on-surface)] transition-colors"
              >
                <TranslateIcon iconKey="plus" size={16} className="rotate-45" />
              </Drawer.Close>
            

            {errorMessage && (
              <div className="mx-6 mb-4 p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                <TranslateIcon iconKey="emergency" size={14} className="shrink-0 mt-0.5 text-red-400" />
                <div className="flex-1">
                  <p className="font-semibold text-red-300">Error</p>
                  <p className="opacity-90">{errorMessage}</p>
                </div>
                <button type="button" onClick={() => setErrorMessage(null)} className="opacity-65 hover:opacity-100 transition-opacity">
                  <TranslateIcon iconKey="plus" size={12} className="rotate-45" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-center mb-6 px-6 sticky top-0">
              <div className="flex rounded-full bg-[var(--color-surface-2)] p-1 gap-1 w-full max-w-[240px]">
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTxType(t);
                      setErrorMessage(null);
                    }}
                    className={`
                      flex-1 h-9 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all duration-200
                      ${txType === t
                        ? "bg-[var(--color-primary-ctr)] text-white shadow-sm"
                        : "text-[var(--color-on-dim)] hover:text-[var(--color-on-surface)]"
                      }
                    `}
                  >
                    {t === "EXPENSE" ? "Gasto" : "Ingreso"}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 mb-6 text-center">
              <p className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--color-on-dim)] mb-2">
                Monto
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-[var(--font-data)] text-[36px] font-bold text-[var(--color-primary)]">$</span>
                <input
                  name="amount"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  required
                  value={amountVal}
                  onChange={(e) => {
                    setAmountVal(e.target.value);
                    setErrorMessage(null);
                  }}
                  disabled={isPending}
                  placeholder="0"
                  className="font-[var(--font-data)] text-3xl tracking-tight text-[var(--color-on-surface)] bg-transparent border-none outline-none w-56 text-center placeholder:text-white/20"
                />
              </div>
              {txType === "EXPENSE" && (() => {
                const parsed = parseFloat(amountVal);
                if (selectedPocket) {
                  const pocket = pockets.find(p => p.id === selectedPocket);
                  const pocketBalance = pocket ? pocket.balance : 0;
                  const isOver = !isNaN(parsed) && parsed > pocketBalance;
                  return (
                    <p className={`text-[11px] font-semibold mt-2 transition-colors ${isOver ? "text-red-400 font-bold" : "text-[var(--color-on-dim)]"}`}>
                      {isOver ? "⚠️ Excede el saldo de la tarjeta" : `Disponible en tarjeta: $${pocketBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                    </p>
                  );
                } else if (selectedGuardadito) {
                  const guard = guardaditos.find(g => g.id === selectedGuardadito);
                  const guardBalance = guard ? guard.current : 0;
                  const isOver = !isNaN(parsed) && parsed > guardBalance;
                  return (
                    <p className={`text-[11px] font-semibold mt-2 transition-colors ${isOver ? "text-red-400 font-bold" : "text-[var(--color-on-dim)]"}`}>
                      {isOver ? "⚠️ Excede el saldo del guardadito" : `Disponible en guardadito: $${guardBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                    </p>
                  );
                } else {
                  const isOver = !isNaN(parsed) && parsed > walletBalance;
                  return (
                    <p className={`text-[11px] font-semibold mt-2 transition-colors ${isOver ? "text-red-400 font-bold" : "text-[var(--color-on-dim)]"}`}>
                      {isOver ? "⚠️ Excede el saldo disponible" : `Disponible en billetera: $${walletBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                    </p>
                  );
                }
              })()}
            </div>

            <div className="px-6 mb-5">
              <p className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)] mb-3">
                CATEGORÍA
              </p>
              <div className="flex flex-wrap gap-3 h-fit">
                {allCategories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedCategory(cat.value)}
                    aria-label={cat.label}
                    className={`
                      flex flex-col items-center gap-1.5 w-[64px] py-2.5 rounded-2xl border transition-all duration-200
                      ${selectedCategory === cat.value
                        ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]"
                        : "bg-[var(--color-surface-2)] border-white/5 text-[var(--color-on-dim)] hover:border-white/15 hover:text-[var(--color-on-surface)]"
                      }
                    `}
                  >
                    <div className={`size-9 rounded-full flex items-center justify-center ${selectedCategory === cat.value ? "bg-[var(--color-primary)]/15" : "bg-white/5"}`}>
                      <TranslateIcon iconKey={cat.iconKey as keyof typeof ICON_MAP} size={18} className="text-current" />
                    </div>
                    <span className="text-[9px] font-semibold tracking-wide uppercase leading-tight text-center w-full truncate px-1">
                      {cat.label}
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  aria-label="Nueva categoría"
                  className="flex flex-col items-center gap-1.5 w-[64px] py-2.5 rounded-2xl border border-dashed border-white/15 bg-transparent text-[var(--color-on-dim)] hover:border-white/30 hover:text-[var(--color-on-surface)] transition-all duration-200"
                >
                  <div className="size-9 rounded-full flex items-center justify-center bg-white/5">
                    <TranslateIcon iconKey="plus" size={18} className="text-current" />
                  </div>
                  <span className="text-[9px] font-semibold tracking-wide uppercase">Nueva</span>
                </button>
              </div>
            </div>

            {showNewCategory && (
              <div className="mx-6 mb-4 p-4 rounded-xl  bg-[var(--color-surface-2)] border border-white/5 flex flex-col gap-3">
                <p className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
                  Nueva Categoría
                </p>
                <input
                  type="text"
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  placeholder="Nombre de la categoría"
                  required
                  className="h-9 w-full rounded-lg bg-[var(--color-surface-3)] border border-white/5 px-3 text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
                />
                <div className="flex flex-wrap gap-2">
                  {CUSTOM_ICON_OPTIONS.map((iconKey) => (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setNewCatIcon(iconKey)}
                      className={`size-8 rounded-lg flex items-center justify-center border transition-all ${newCatIcon === iconKey ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]" : "bg-[var(--color-surface-3)] border-white/5 text-[var(--color-on-dim)]"}`}
                    >
                      <TranslateIcon iconKey={iconKey} size={15} className="text-current" />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowNewCategory(false); setNewCatLabel(""); }}
                    className="flex-1 h-8 rounded-lg border border-white/10 text-xs text-[var(--color-on-dim)] hover:text-[var(--color-on-surface)] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveNewCategory()}
                    disabled={isSavingCat || !newCatLabel.trim()}
                    className="flex-1 h-8 rounded-lg bg-[var(--color-primary-ctr)] text-white text-xs font-bold tracking-wider disabled:opacity-50"
                  >
                    {isSavingCat ? "..." : "Guardar"}
                  </button>
                </div>
              </div>
            )}

            <div className="mx-6 mb-16 bg-[var(--color-surface-2)] rounded-2xl  divide-y divide-white/5">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <TranslateIcon iconKey="calendar" size={16} className="text-[var(--color-on-dim)] shrink-0" />
                <span className="text-sm text-[var(--color-on-dim)] flex-1">Fecha</span>
                <input
                  name="date"
                  type="date"
                  defaultValue={today}
                  disabled={isPending}
                  className="text-sm font-semibold text-[var(--color-primary)] bg-transparent border-none outline-none text-right"
                />
              </div>

              <div className="flex items-center gap-3 px-4 py-3.5">
                <TranslateIcon iconKey="piggybank" size={16} className="text-[var(--color-on-dim)] shrink-0" />
                <span className="text-sm text-[var(--color-on-dim)] flex-1">Guardadito</span>
                <select
                  value={selectedGuardadito}
                  onChange={(e) => {
                    setSelectedGuardadito(e.target.value);
                    if (e.target.value !== "") {
                      setSelectedPocket("");
                    }
                  }}
                  disabled={isPending}
                  className="text-sm font-semibold text-[var(--color-primary)] bg-transparent border-none outline-none text-right max-w-[140px] truncate"
                >
                  <option value="">Ninguno</option>
                  {guardaditos.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 px-4 py-3.5">
                <TranslateIcon iconKey="creditCard" size={16} className="text-[var(--color-on-dim)] shrink-0" />
                <span className="text-sm text-[var(--color-on-dim)] flex-1">Pocket / Tarjeta</span>
                <select
                  value={selectedPocket}
                  onChange={(e) => {
                    setSelectedPocket(e.target.value);
                    if (e.target.value !== "") {
                      setSelectedGuardadito("");
                    }
                  }}
                  disabled={isPending}
                  className="text-sm font-semibold text-[var(--color-primary)] bg-transparent border-none outline-none text-right max-w-[140px] truncate"
                >
                  <option value="">Ninguno (Billetera)</option>
                  {pockets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {txType === "EXPENSE" && selectedGuardadito && (
                <div className="px-4 py-2.5 bg-orange-950/30 text-[11px] text-orange-200 leading-relaxed">
                  ⚠️ Retirar de tu guardadito afectará tu meta de ahorro.
                </div>
              )}

              <div className="flex items-start gap-3 px-4 py-3.5">
                <TranslateIcon iconKey="stickyNote" size={16} className="text-[var(--color-on-dim)] shrink-0 mt-0.5" />
                <input
                  name="note"
                  type="text"
                  disabled={isPending}
                  placeholder="¿Para qué fue esto?"
                  className="flex-1 text-sm text-[var(--color-on-surface)] bg-transparent border-none outline-none placeholder:text-[var(--color-on-dim)]/50"
                />
              </div>
            </div>

            {txType === "EXPENSE" && (
              <div className="mx-6 mb-16">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {receiptPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                    <img src={receiptPreview} alt="Vista previa del recibo" className="w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setReceiptPreview(null); setReceiptFile(null); }}
                      className="absolute top-2 right-2 size-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    >
                      <TranslateIcon iconKey="plus" size={14} className="rotate-45" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-20 rounded-xl border border-dashed border-white/15 bg-[var(--color-surface-2)]/50 flex flex-col items-center justify-center gap-1.5 hover:border-white/30 hover:bg-[var(--color-surface-2)] transition-all duration-200 text-[var(--color-on-dim)] hover:text-[var(--color-on-surface)]"
                  >
                    <TranslateIcon iconKey="camera" size={18} className="text-current" />
                    <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.12em] uppercase">
                      Adjuntar Recibo
                    </span>
                  </button>
                )}
              </div>
            )}

            <div className="px-6 mt-auto pt-4 pb-[env(safe-area-inset-bottom,8px)]">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 h-13 w-full rounded-2xl bg-[var(--color-primary-ctr)] text-white font-[var(--font-data)] text-[13px] font-bold tracking-[0.15em] uppercase shadow-[var(--shadow-fab)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-primary-mid)] active:translate-y-0 disabled:opacity-50"
              >
                {isPending ? "Guardando..." : "Agregar Transacción"}
              </button>
            </div>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
