"use client";

import React, { useState, useTransition, useRef } from "react";
import { Drawer } from "vaul";
import TranslateIcon from "./translateIcon";
import { createGuardadito } from "@/app/actions_extended";

const ICON_OPTIONS = [
  { key: "piggybank",  label: "Alcancía" },
  { key: "plane",      label: "Viaje" },
  { key: "car",        label: "Auto" },
  { key: "emergency",  label: "Emergencia" },
  { key: "shopping",   label: "Compras" },
  { key: "briefcase",  label: "Trabajo" },
  { key: "creditCard", label: "Tarjeta" },
  { key: "wallet",     label: "Wallet" },
  { key: "dividend",   label: "Inversión" },
  { key: "home",       label: "Casa" },
] as const;

type CreateGuardaditoDrawerProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  walletBalance: number;
};

/**
 * CreateGuardaditoDrawer renders a Vaul Drawer for creating a new savings goal.
 * Bottom sheet on mobile, right-side panel on desktop.
 *
 * @param props - Open state and change handler.
 */
export default function CreateGuardaditoDrawer({
  isOpen,
  onOpenChange,
  walletBalance,
}: CreateGuardaditoDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedIcon, setSelectedIcon] = useState<string>("piggybank");
  const [hasTarget, setHasTarget] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedIcon("piggybank");
      setHasTarget(true);
      setError(null);
      setCoverFile(null);
      setCoverPreview(null);
    }
    onOpenChange(open);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("icon", selectedIcon);
    if (coverFile) {
      formData.set("cover_file", coverFile);
    }

    const initialAmountStr = formData.get("initialAmount") as string | null;
    const initialAmount = initialAmountStr && initialAmountStr !== "" ? parseFloat(initialAmountStr) : 0;

    if (!isNaN(initialAmount) && initialAmount > walletBalance) {
      setError(`Fondos insuficientes en tu billetera. Tienes $${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} disponible.`);
      return;
    }

    startTransition(async () => {
      try {
        await createGuardadito(formData);
        handleOpenChange(false);
      } catch (err: any) {
        setError(err.message || "Error al crear el guardadito");
      }
    });
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={handleOpenChange} direction="right">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-overlay backdrop-blur-xs z-50 animate-in fade-in duration-200" />
        <Drawer.Content className="
          fixed z-50 text-on-surface bg-surface-3 focus:outline-none
          bottom-0 left-0 right-0 max-h-[90vh] rounded-t-2xl border-t border-border flex flex-col
          sm:top-0 sm:right-0 sm:left-auto sm:bottom-0 sm:w-[420px] sm:max-h-full sm:rounded-l-2xl sm:rounded-tr-none sm:border-l sm:border-t-0
        ">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 my-4 sm:hidden" />

          <div className="flex-1 overflow-y-auto px-6 pb-8 sm:py-8 w-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <Drawer.Title className="text-lg font-semibold tracking-tight text-on-surface">
                Nuevo Guardadito
              </Drawer.Title>
              <Drawer.Close className="text-on-dim hover:text-on-surface transition-colors">
                <TranslateIcon iconKey="plus" size={20} className="rotate-45" />
              </Drawer.Close>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-error-subtle border border-error-border text-error-text text-xs flex items-start gap-2 animate-in fade-in duration-200">
                <TranslateIcon iconKey="emergency" size={14} className="shrink-0 mt-0.5 text-error-icon" />
                <div className="flex-1">
                  <p className="font-semibold text-error-text">Error</p>
                  <p className="opacity-90">{error}</p>
                </div>
                <button type="button" onClick={() => setError(null)} className="opacity-65 hover:opacity-100 transition-opacity">
                  <TranslateIcon iconKey="plus" size={12} className="rotate-45" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="guardadito-name" className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-on-muted">
                  Nombre
                </label>
                <input
                  id="guardadito-name"
                  name="name"
                  type="text"
                  required
                  disabled={isPending}
                  placeholder="ej. Viaje a Japón, Nuevo iPhone…"
                  className="h-11 w-full rounded-xl bg-surface-2 border border-border px-4 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-on-muted">
                  Ícono
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {ICON_OPTIONS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedIcon(key)}
                      aria-label={label}
                      className={`
                        flex flex-col items-center gap-1 p-2 rounded-xl border transition-all duration-200
                        ${selectedIcon === key
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-surface-2 border-border text-on-dim hover:border-white/15 hover:text-on-surface"
                        }
                      `}
                    >
                      <TranslateIcon iconKey={key} size={20} className="text-current" />
                      <span className="text-[9px] font-semibold tracking-wide uppercase truncate w-full text-center">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-on-muted">
                    Meta de Ahorro (opcional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setHasTarget((p) => !p)}
                    className="text-[10px] text-primary font-semibold hover:opacity-75 transition-opacity"
                  >
                    {hasTarget ? "Sin meta" : "Agregar meta"}
                  </button>
                </div>
                {hasTarget && (
                  <input
                    name="target"
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={isPending}
                    placeholder="0.00"
                    className="h-11 w-full rounded-xl bg-surface-2 border border-border px-4 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                  />
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="guardadito-initial" className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-on-muted">
                  Monto inicial (opcional)
                </label>
                <input
                  id="guardadito-initial"
                  name="initialAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={isPending}
                  placeholder="0.00"
                  className="h-11 w-full rounded-xl bg-surface-2 border border-border px-4 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              {/* Optional Cover Image */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-on-muted">
                    Imagen de portada (opcional)
                  </span>
                  {coverPreview && (
                    <button
                      type="button"
                      onClick={() => { setCoverFile(null); setCoverPreview(null); if (coverInputRef.current) coverInputRef.current.value = ""; }}
                      className="text-[10px] text-error-text opacity-60 hover:opacity-100 transition-opacity font-bold uppercase tracking-widest"
                    >
                      Quitar
                    </button>
                  )}
                </div>

                <input
                  ref={coverInputRef}
                  id="drawer-cover-image-input"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setCoverFile(file);
                    setCoverPreview(URL.createObjectURL(file));
                  }}
                />

                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="relative w-full overflow-hidden rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors group"
                  style={{ aspectRatio: "16 / 7" }}
                  aria-label="Seleccionar imagen de portada"
                >
                  {coverPreview ? (
                    <>
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `url(${coverPreview})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[11px] font-bold tracking-widest text-white uppercase">Cambiar</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-on-dim group-hover:text-on-surface transition-colors">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="text-[11px] font-semibold tracking-wide">Agregar imagen</span>
                    </div>
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="h-12 w-full mt-2 rounded-xl bg-primary-ctr text-on-primary font-[var(--font-data)] text-[12px] font-bold tracking-[0.15em] uppercase shadow-[var(--shadow-fab)] transition-all hover:-translate-y-0.5 hover:bg-primary-mid active:translate-y-0 disabled:opacity-50"
              >
                {isPending ? "Creando..." : "Crear Guardadito"}
              </button>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
