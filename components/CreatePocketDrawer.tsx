"use client";

import React, { useState, useTransition, useEffect } from "react";
import { Drawer } from "vaul";
import TranslateIcon from "./translateIcon";
import { createPocket, getPocketDesigns } from "@/app/actions_pockets";
import PocketCard, { POCKET_PRESETS, PocketPresetKey } from "./PocketCard";
import Link from "next/link";

type CreatePocketDrawerProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CreatePocketDrawer({ isOpen, onOpenChange }: CreatePocketDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [customDesigns, setCustomDesigns] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("emerald-dark");
  const [error, setError] = useState<string | null>(null);

  // Load custom designs on mount
  useEffect(() => {
    const load = async () => {
      try {
        const designs = await getPocketDesigns();
        setCustomDesigns(designs);
      } catch (e) {
        console.error("Failed to load custom designs", e);
      }
    };
    load();
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedPreset("emerald-dark");
      setError(null);
    }
    onOpenChange(open);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const customDesign = customDesigns.find(d => d.id === selectedPreset);
    if (customDesign) {
      formData.set("design_preset", "emerald-dark");
      formData.set("custom_design", JSON.stringify(customDesign.design || {}));
    } else {
      formData.set("design_preset", selectedPreset);
    }
    startTransition(async () => {
      try {
        await createPocket(formData);
        handleOpenChange(false);
      } catch (err: any) {
        setError(err.message || "Error al crear la tarjeta");
      }
    });
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={handleOpenChange} direction="right">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-overlay backdrop-blur-xs z-50 animate-in fade-in duration-200" />
        <Drawer.Content className="fixed z-50 text-on-surface bg-surface-3 focus:outline-none bottom-0 left-0 right-0 max-h-[90vh] rounded-t-2xl border-t border-border flex flex-col sm:top-0 sm:right-0 sm:left-auto sm:bottom-0 sm:w-[420px] sm:max-h-full sm:rounded-l-2xl sm:rounded-tr-none sm:border-l sm:border-t-0">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 my-4 sm:hidden" />
          <div className="flex-1 overflow-y-auto px-6 pb-8 sm:py-8 w-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <Drawer.Title className="text-lg font-semibold tracking-tight text-on-surface">Nueva Tarjeta / Pocket</Drawer.Title>
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
                <label htmlFor="pocket-name" className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-on-muted">Nombre de la Tarjeta</label>
                <input id="pocket-name" name="name" type="text" required disabled={isPending} placeholder="ej. Didi Card, BBVA Débito, Efectivo…" className="h-11 w-full rounded-xl bg-surface-2 border border-border px-4 text-sm text-on-surface focus:outline-none focus:border-primary transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pocket-subtitle" className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-on-muted">Subtítulo / Nota corta</label>
                <input id="pocket-subtitle" name="subtitle" type="text" disabled={isPending} placeholder="ej. Cuenta *4521, Efectivo en mano…" className="h-11 w-full rounded-xl bg-surface-2 border border-border px-4 text-sm text-on-surface focus:outline-none focus:border-primary transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pocket-balance" className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-on-muted">Saldo Inicial</label>
                <input id="pocket-balance" name="balance" type="number" step="0.01" min="0" disabled={isPending} placeholder="0.00" className="h-11 w-full rounded-xl bg-surface-2 border border-border px-4 text-sm text-on-surface focus:outline-none focus:border-primary transition-all" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-on-muted">Estilo / Preset</span>
                  <Link href="/wallet/custom-design" onClick={() => handleOpenChange(false)} className="text-[10px] text-primary font-semibold hover:opacity-75 transition-opacity">Diseño personalizado →</Link>
                </div>
                {/* Unified design list: custom designs + presets */}
            {(() => {
              const combined = [
                ...customDesigns.map((design) => ({
                  type: 'custom' as const,
                  id: design.id,
                  name: design.name,
                  custom_design: design.design,
                })),
                ...Object.entries(POCKET_PRESETS).map(([key, preset]) => ({
                  type: 'preset' as const,
                  id: key,
                  name: key.replace('-', ' '),
                  preset,
                })),
              ];
              return (
                <div className="grid grid-cols-2 gap-3 max-h-2xl overflow-y-auto pr-1 mb-2">
                  {combined.map((item) => {
                    const isSelected = selectedPreset === item.id;
                    if (item.type === 'custom') {
                      const cd = item.custom_design;
                      const bg = cd?.bg_type === 'solid'
                        ? cd?.bg_from
                        : `linear-gradient(135deg, ${cd?.bg_from || '#000'} 0%, ${cd?.bg_to || '#000'} 100%)`;
                      const textColor = cd?.text_color === 'dark' ? '#131313' : '#e5e2e1';
                      const accentColor = cd?.accent || '#ffffff';
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedPreset(item.id)}
                          className={`relative flex flex-col justify-between p-3 rounded-xl border text-left min-h-[80px] overflow-hidden transition-all duration-200 ${isSelected ? 'border-primary ring-1 ring-[var(--color-primary)]' : 'border-border hover:border-white/15'}`}
                          style={{ background: bg, color: textColor }}
                        >
                          <span className="text-[11px] font-semibold z-10">{item.name}</span>
                          <div className="flex justify-between items-center mt-2 z-10 w-full">
                            <span className="text-[9px] opacity-75" style={{ color: accentColor }}>● Custom</span>
                            <TranslateIcon iconKey={cd?.icon || 'wallet'} size={14} style={{ color: accentColor }} />
                          </div>
                        </button>
                      );
                    } else {
                      const { preset } = item;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedPreset(item.id)}
                          className={`relative flex flex-col justify-between p-3 rounded-xl border text-left min-h-[80px] overflow-hidden transition-all duration-200 ${isSelected ? 'border-primary ring-1 ring-[var(--color-primary)]' : 'border-border hover:border-white/15'}`}
                          style={{ background: preset.bg, color: preset.text }}
                        >
                          <span className="text-[11px] font-semibold z-10">{item.name}</span>
                          <div className="flex justify-between items-center mt-2 z-10 w-full">
                            <span className="text-[9px] opacity-75" style={{ color: preset.accent }}>● Preset</span>
                            <TranslateIcon iconKey={preset.icon} size={14} style={{ color: preset.accent }} />
                          </div>
                        </button>
                      );
                    }
                  })}
                </div>
              );
            })()}
              </div>
              <button type="submit" disabled={isPending} className="h-12 w-full mt-2 rounded-xl bg-primary-ctr text-on-primary font-[var(--font-data)] text-[12px] font-bold tracking-[0.15em] uppercase shadow-[var(--shadow-fab)] transition-all hover:-translate-y-0.5 hover:bg-primary-mid active:translate-y-0 disabled:opacity-50">
                {isPending ? "Creando..." : "Crear Tarjeta"}
              </button>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
