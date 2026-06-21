"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import TranslateIcon from "./translateIcon";
import { createPocket, createPocketDesign, updatePocketDesign, uploadPocketBackground } from "@/app/actions_pockets";
import PocketCard, { PocketData } from "./PocketCard";

const COLOR_PRESETS = [
  { hex: "#0b1510", name: "Deep Emerald" },
  { hex: "#032313", name: "Forest Green" },
  { hex: "#090909", name: "Midnight Black" },
  { hex: "#1c1917", name: "Stone Dark" },
  { hex: "#0b0f19", name: "Navy Blue" },
  { hex: "#0c2045", name: "Slate Blue" },
  { hex: "#150606", name: "Crimson Maroon" },
  { hex: "#3b0505", name: "Ruby Red" },
  { hex: "#2e1065", name: "Violet Dark" },
  { hex: "#1e1b4b", name: "Indigo Dark" },
  { hex: "#072146", name: "BBVA Blue" },
  { hex: "#171717", name: "Obsidian" },
];

const ACCENT_PRESETS = [
  { hex: "#96d4ab", name: "Emerald" },
  { hex: "#e9a23a", name: "Amber" },
  { hex: "#60a5fa", name: "Sky" },
  { hex: "#34d399", name: "Teal" },
  { hex: "#ffffff", name: "White" },
  { hex: "#ffb4ab", name: "Crimson" },
  { hex: "#a855f7", name: "Amethyst" },
  { hex: "#ec4899", name: "Pink" },
];

const ICON_OPTIONS = [
  { key: "wallet", label: "Billetera" },
  { key: "creditCard", label: "Tarjeta" },
  { key: "banknote", label: "Billete" },
  { key: "dividend", label: "Inversión" },
  { key: "piggybank", label: "Alcancía" },
  { key: "coins", label: "Monedas" },
  { key: "briefcase", label: "Negocio" },
  { key: "shopping", label: "Compras" },
  { key: "home", label: "Hogar" },
];

interface PocketDesignEditorProps {
  initialDesigns?: any[];
}

export default function PocketDesignEditor({ initialDesigns = [] }: PocketDesignEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Load Saved Design select
  const [selectedDesignId, setSelectedDesignId] = useState<string>("");

  // Flow options
  const [styleName, setStyleName] = useState("Mi Estilo Nu");
  const [saveStyleEnabled, setSaveStyleEnabled] = useState(true);
  const [createCardEnabled, setCreateCardEnabled] = useState(true);

  // Card specific info
  const [name, setName] = useState("Mi Tarjeta");
  const [subtitle, setSubtitle] = useState("Mi banco / Cuenta");
  const [balance, setBalance] = useState("0");

  // Custom design states
  const [bgType, setBgType] = useState<"solid" | "gradient">("gradient");
  const [bgFrom, setBgFrom] = useState("#0b0f19");
  const [bgTo, setBgTo] = useState("#0c2045");
  const [bgImage, setBgImage] = useState<string>("");
  const [bgImagePos, setBgImagePos] = useState<string>("center");
  const [bgImageOpacity, setBgImageOpacity] = useState<number>(50); // 0 to 100
  const [borderSelection, setBorderSelection] = useState({
    top: true,
    right: true,
    bottom: true,
    left: true,
  });
  const [borderWidths, setBorderWidths] = useState({
    top: 1,
    right: 1,
    bottom: 1,
    left: 1,
  });

  const [accent, setAccent] = useState("#60a5fa");
  const [texture, setTexture] = useState<"none" | "pinstripe">("pinstripe");
  const [icon, setIcon] = useState("creditCard");
  const [textColor, setTextColor] = useState<"light" | "dark">("light");

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("bg_file", file);
      const publicUrl = await uploadPocketBackground(formData);
      setBgImage(publicUrl);
    } catch (err: any) {
      setError(err.message || "Error al subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  // Load selected saved style details
  const handleLoadSavedStyle = (designId: string) => {
    setSelectedDesignId(designId);
    if (!designId) return;

    const found = initialDesigns.find((d) => d.id === designId);
    if (found && found.design) {
      const design = found.design;
      setStyleName(found.name);
      setBgType(design.bg_type || "gradient");
      setBgFrom(design.bg_from || "#0b0f19");
      setBgTo(design.bg_to || "#0c2045");
      setBgImage(design.bg_image || "");
      setBgImagePos(design.bg_image_pos || "center");
      setBgImageOpacity(design.bg_image_opacity ? Math.round(design.bg_image_opacity * 100) : 50);
      setBorderSelection(design.border_selection || { top: true, right: true, bottom: true, left: true });
      setBorderWidths(design.border_widths || { top: 1, right: 1, bottom: 1, left: 1 });
      setAccent(design.accent || "#60a5fa");
      setTexture(design.texture || "pinstripe");
      setIcon(design.icon || "creditCard");
      setTextColor(design.text_color || "light");
    }
  };

  // Mock PocketData for the live preview card
  const previewPocket: PocketData = {
    id: "preview",
    name: createCardEnabled ? (name || "Nombre de Tarjeta") : "Vista Previa de Estilo",
    subtitle: createCardEnabled ? subtitle : styleName,
    balance: parseFloat(balance) || 0,
    design_preset: "emerald-dark",
    custom_design: {
      bg_type: bgType,
      bg_from: bgFrom,
      bg_to: bgTo,
      bg_image: bgImage || null,
      bg_image_pos: bgImagePos,
      bg_image_opacity: bgImageOpacity / 100,
      border_selection: borderSelection,
      border_widths: borderWidths,
      accent,
      texture,
      icon,
      text_color: textColor,
    },
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!saveStyleEnabled && !createCardEnabled) {
      setError("Debes seleccionar al menos Guardar Estilo o Crear Tarjeta");
      return;
    }

    if (saveStyleEnabled && !styleName.trim()) {
      setError("El nombre del estilo es requerido");
      return;
    }

    if (createCardEnabled && !name.trim()) {
      setError("El nombre de la tarjeta es requerido");
      return;
    }

    const customDesign = {
      bg_type: bgType,
      bg_from: bgFrom,
      bg_to: bgTo,
      bg_image: bgImage || null,
      bg_image_pos: bgImagePos,
      bg_image_opacity: bgImageOpacity / 100,
      border_selection: borderSelection,
      border_widths: borderWidths,
      accent,
      texture,
      icon,
      text_color: textColor,
    };

    startTransition(async () => {
      try {
        // 1. Save or update style in library
        if (saveStyleEnabled) {
          if (selectedDesignId) {
            await updatePocketDesign(selectedDesignId, styleName, customDesign);
          } else {
            await createPocketDesign(styleName, customDesign);
          }
        }

        // 2. Create actual pocket card
        if (createCardEnabled) {
          const formData = new FormData();
          formData.set("name", name);
          formData.set("subtitle", subtitle);
          formData.set("balance", balance);
          formData.set("design_preset", "emerald-dark");
          formData.set("custom_design", JSON.stringify(customDesign));
          await createPocket(formData);
        }

        router.push("/wallet");
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Error al guardar el estilo o crear la tarjeta");
      }
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 items-start pb-12">
      {/* Left Column: Preview */}
      <div className="w-full lg:w-5/12 flex flex-col gap-6 lg:sticky lg:top-24">
        <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-[var(--color-on-dim)] font-[var(--font-data)]">
          Vista Previa en Tiempo Real
        </h2>
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          <PocketCard pocket={previewPocket} isInteractive={false} />
        </div>

        <div className="p-4 rounded-xl bg-[var(--color-surface-1)] border border-white/5 text-xs text-[var(--color-on-dim)] flex flex-col gap-2">
          <p className="font-semibold text-[var(--color-on-surface)]">💡 Tips de Diseño:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Usa colores oscuros de fondo para hacer resaltar los textos claros.</li>
            <li>El color de acento define la línea decorativa inferior y el color del ícono.</li>
            <li>La textura "Pinstripe" agrega líneas diagonales sutiles de estilo premium.</li>
          </ul>
        </div>
      </div>

      {/* Right Column: Customization Controls */}
      <form onSubmit={handleSave} className="w-full lg:w-7/12 bg-[var(--color-surface-1)] border border-white/5 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-on-surface)]">
            Diseñador de Pockets Personalizados
          </h1>
          <p className="text-xs text-[var(--color-on-dim)] mt-1">
            Personaliza el fondo, colores, bordes y texturas para tus tarjetas.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs flex items-start gap-2">
            <TranslateIcon iconKey="emergency" size={14} className="shrink-0 mt-0.5 text-red-400" />
            <div className="flex-1">
              <p className="font-semibold text-red-300">Error</p>
              <p className="opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Load Saved Designs (Dropdown) */}
        {initialDesigns.length > 0 && (
          <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-blue-950/20 border border-blue-500/20">
            <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-blue-300">
              📂 Cargar Estilo Existente
            </label>
            <select
              value={selectedDesignId}
              onChange={(e) => handleLoadSavedStyle(e.target.value)}
              className="h-10 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/10 px-3 text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
            >
              <option value="">-- Elige un estilo guardado --</option>
              {initialDesigns.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--color-surface-2)] border border-white/5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={saveStyleEnabled}
              onChange={(e) => setSaveStyleEnabled(e.target.checked)}
              className="w-4 h-4 rounded bg-[var(--color-surface-1)] border-white/10 text-[var(--color-primary)] focus:ring-0"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[var(--color-on-surface)]">Guardar Estilo en Biblioteca</span>
              <span className="text-[9px] text-[var(--color-on-dim)]">Guarda el diseño para reusarlo después</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={createCardEnabled}
              onChange={(e) => setCreateCardEnabled(e.target.checked)}
              className="w-4 h-4 rounded bg-[var(--color-surface-1)] border-white/10 text-[var(--color-primary)] focus:ring-0"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[var(--color-on-surface)]">Crear Tarjeta en mi Wallet</span>
              <span className="text-[9px] text-[var(--color-on-dim)]">Crea un Pocket real usando este diseño</span>
            </div>
          </label>
        </div>

        {/* Style Name Field (Only if saveStyleEnabled) */}
        {saveStyleEnabled && (
          <div className="flex flex-col gap-1.5">
            <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
              Nombre del Estilo / Diseño
            </label>
            <input
              type="text"
              required={saveStyleEnabled}
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              placeholder="ej. Nu México Morada, BBVA Gold..."
              className="h-11 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
            />
          </div>
        )}

        {/* Card Fields (Only if createCardEnabled) */}
        {createCardEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
                Nombre de la Tarjeta
              </label>
              <input
                type="text"
                required={createCardEnabled}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Nu México, Mi Cartera..."
                className="h-11 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
                Subtítulo / Nota corta
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="ej. Tarjeta de Crédito, Cuenta *1245..."
                className="h-11 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
                Saldo Inicial (Dinero Externo)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="h-11 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
              />
            </div>
          </div>
        )}

        <hr className="border-white/5 my-1" />

        {/* Background Config Type */}
        <div className="flex flex-col gap-2">
          <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
            Tipo de Fondo
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBgType("solid")}
              className={`h-10 rounded-xl border text-xs font-medium transition-all ${
                bgType === "solid"
                  ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "bg-[var(--color-surface-2)] border-white/5 text-[var(--color-on-dim)]"
              }`}
            >
              Color Sólido
            </button>
            <button
              type="button"
              onClick={() => setBgType("gradient")}
              className={`h-10 rounded-xl border text-xs font-medium transition-all ${
                bgType === "gradient"
                  ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "bg-[var(--color-surface-2)] border-white/5 text-[var(--color-on-dim)]"
              }`}
            >
              Gradiente
            </button>
          </div>
        </div>

        {/* Background Gradients/Colors */}
        <div className="flex flex-col gap-4">
          <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
            {bgType === "solid" ? "Color de Fondo" : "Colores de Fondo (Gradiente)"}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 col-span-1">
              <span className="text-[11px] text-[var(--color-on-dim)]">
                {bgType === "solid" ? "Color Principal" : "Color de Inicio"}
              </span>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={bgFrom}
                  onChange={(e) => setBgFrom(e.target.value)}
                  className="w-11 h-11 rounded-xl bg-transparent border border-white/5 p-1 cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={bgFrom}
                  onChange={(e) => setBgFrom(e.target.value)}
                  className="h-11 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/5 px-3 text-xs uppercase"
                />
              </div>
            </div>

            {bgType === "gradient" && (
              <div className="flex flex-col gap-2 col-span-1">
                <span className="text-[11px] text-[var(--color-on-dim)]">Color de Fin</span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={bgTo}
                    onChange={(e) => setBgTo(e.target.value)}
                    className="w-11 h-11 rounded-xl bg-transparent border border-white/5 p-1 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={bgTo}
                    onChange={(e) => setBgTo(e.target.value)}
                    className="h-11 w-full rounded-xl bg-[var(--color-surface-2)] border border-white/5 px-3 text-xs uppercase"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Background Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-[var(--color-on-dim)]">Predefinidos rápidos:</span>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => {
                    setBgFrom(color.hex);
                    if (bgType === "gradient") {
                      setBgTo(color.hex === "#090909" ? "#1e1e1e" : `${color.hex}22`);
                    }
                  }}
                  className="h-6 px-2.5 rounded-full border border-white/5 text-[9px] font-semibold text-[var(--color-on-surface)] transition-all hover:border-white/20"
                  style={{ backgroundColor: color.hex }}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Background Image Layer */}
        <div className="flex flex-col gap-4 p-4 rounded-xl bg-[var(--color-surface-2)] border border-white/5">
          <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
            Imagen de Fondo (Opcional)
          </span>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] text-[var(--color-on-dim)]">Subir Archivo o pegar URL</span>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                  id="bg-file-input"
                />
                <label
                  htmlFor="bg-file-input"
                  className={`h-10 px-4 rounded-xl border border-dashed border-white/10 flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold text-[var(--color-on-surface)] transition-all hover:bg-white/5 active:scale-95 select-none ${
                    isUploading ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <TranslateIcon iconKey="briefcase" size={14} className={isUploading ? "animate-spin" : ""} />
                  {isUploading ? "Subiendo..." : "Seleccionar Imagen"}
                </label>
                <input
                  type="text"
                  value={bgImage}
                  onChange={(e) => setBgImage(e.target.value)}
                  placeholder="https://... o sube un archivo"
                  className="h-10 flex-1 rounded-xl bg-[var(--color-surface-1)] border border-white/5 px-3 text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
                />
                {bgImage && (
                  <button
                    type="button"
                    onClick={() => setBgImage("")}
                    className="h-10 px-3 rounded-xl border border-red-500/20 bg-red-950/20 text-red-400 text-xs font-semibold hover:bg-red-950/40 transition-all"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>

            {bgImage && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-[var(--color-on-dim)]">Posición</span>
                  <select
                    value={bgImagePos}
                    onChange={(e) => setBgImagePos(e.target.value)}
                    className="h-10 w-full rounded-xl bg-[var(--color-surface-1)] border border-white/5 px-3 text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
                  >
                    <option value="center">Centro</option>
                    <option value="top">Arriba</option>
                    <option value="bottom">Abajo</option>
                    <option value="left">Izquierda</option>
                    <option value="right">Derecha</option>
                    <option value="top left">Arriba Izquierda</option>
                    <option value="top right">Arriba Derecha</option>
                    <option value="bottom left">Abajo Izquierda</option>
                    <option value="bottom right">Abajo Derecha</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[11px] text-[var(--color-on-dim)]">
                    <span>Opacidad de la Imagen</span>
                    <span className="font-semibold text-[var(--color-primary)]">{bgImageOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={bgImageOpacity}
                    onChange={(e) => setBgImageOpacity(parseInt(e.target.value))}
                    className="w-full h-2 bg-[var(--color-surface-1)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)] mt-3"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Accent Color */}
        <div className="flex flex-col gap-3">
          <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
            Color de Acento (Detalles)
          </span>
          <div className="flex gap-2">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-11 h-11 rounded-xl bg-transparent border border-white/5 p-1 cursor-pointer shrink-0"
            />
            <div className="flex flex-wrap gap-1.5 items-center">
              {ACCENT_PRESETS.map((acc) => (
                <button
                  key={acc.hex}
                  type="button"
                  onClick={() => setAccent(acc.hex)}
                  className="w-7 h-7 rounded-full border border-white/10 transition-all hover:scale-105"
                  style={{ backgroundColor: acc.hex }}
                  title={acc.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Border Selection Control */}
        <div className="flex flex-col gap-4">
          <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
            Bordes Activos y Grosor (Haz clic en los lados para activar y ajusta su grosor)
          </span>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-1">
            <div className="relative w-28 h-20 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center p-2 shrink-0">
              {/* Top Border Indicator/Button */}
              <button
                type="button"
                onClick={() => setBorderSelection((prev) => ({ ...prev, top: !prev.top }))}
                className={`absolute top-0 left-3 right-3 h-2 transition-all rounded-b-md ${
                  borderSelection.top ? "bg-[var(--color-primary)] opacity-100 shadow-[0_0_8px_var(--color-primary)]" : "bg-white/10 opacity-30 hover:opacity-60"
                }`}
                title="Borde Superior"
              />
              {/* Right Border Indicator/Button */}
              <button
                type="button"
                onClick={() => setBorderSelection((prev) => ({ ...prev, right: !prev.right }))}
                className={`absolute top-3 bottom-3 right-0 w-2 transition-all rounded-l-md ${
                  borderSelection.right ? "bg-[var(--color-primary)] opacity-100 shadow-[0_0_8px_var(--color-primary)]" : "bg-white/10 opacity-30 hover:opacity-60"
                }`}
                title="Borde Derecho"
              />
              {/* Bottom Border Indicator/Button */}
              <button
                type="button"
                onClick={() => setBorderSelection((prev) => ({ ...prev, bottom: !prev.bottom }))}
                className={`absolute bottom-0 left-3 right-3 h-2 transition-all rounded-t-md ${
                  borderSelection.bottom ? "bg-[var(--color-primary)] opacity-100 shadow-[0_0_8px_var(--color-primary)]" : "bg-white/10 opacity-30 hover:opacity-60"
                }`}
                title="Borde Inferior"
              />
              {/* Left Border Indicator/Button */}
              <button
                type="button"
                onClick={() => setBorderSelection((prev) => ({ ...prev, left: !prev.left }))}
                className={`absolute top-3 bottom-3 left-0 w-2 transition-all rounded-r-md ${
                  borderSelection.left ? "bg-[var(--color-primary)] opacity-100 shadow-[0_0_8px_var(--color-primary)]" : "bg-white/10 opacity-30 hover:opacity-60"
                }`}
                title="Borde Izquierdo"
              />
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider select-none font-[var(--font-data)]">
                Tarjeta
              </div>
            </div>

            {/* Individual border thickness controls */}
            <div className="flex flex-col gap-2 w-full max-w-[240px]">
              {borderSelection.top && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[var(--color-on-dim)] w-20">Arriba:</span>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={borderWidths.top}
                    onChange={(e) => setBorderWidths(prev => ({ ...prev, top: parseInt(e.target.value) }))}
                    className="flex-1 h-1.5 bg-[var(--color-surface-2)] rounded cursor-pointer accent-[var(--color-primary)]"
                  />
                  <span className="font-mono text-[10px] text-[var(--color-primary)] font-bold w-8 text-right">{borderWidths.top}px</span>
                </div>
              )}
              {borderSelection.right && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[var(--color-on-dim)] w-20">Derecha:</span>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={borderWidths.right}
                    onChange={(e) => setBorderWidths(prev => ({ ...prev, right: parseInt(e.target.value) }))}
                    className="flex-1 h-1.5 bg-[var(--color-surface-2)] rounded cursor-pointer accent-[var(--color-primary)]"
                  />
                  <span className="font-mono text-[10px] text-[var(--color-primary)] font-bold w-8 text-right">{borderWidths.right}px</span>
                </div>
              )}
              {borderSelection.bottom && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[var(--color-on-dim)] w-20">Abajo:</span>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={borderWidths.bottom}
                    onChange={(e) => setBorderWidths(prev => ({ ...prev, bottom: parseInt(e.target.value) }))}
                    className="flex-1 h-1.5 bg-[var(--color-surface-2)] rounded cursor-pointer accent-[var(--color-primary)]"
                  />
                  <span className="font-mono text-[10px] text-[var(--color-primary)] font-bold w-8 text-right">{borderWidths.bottom}px</span>
                </div>
              )}
              {borderSelection.left && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[var(--color-on-dim)] w-20">Izquierda:</span>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={borderWidths.left}
                    onChange={(e) => setBorderWidths(prev => ({ ...prev, left: parseInt(e.target.value) }))}
                    className="flex-1 h-1.5 bg-[var(--color-surface-2)] rounded cursor-pointer accent-[var(--color-primary)]"
                  />
                  <span className="font-mono text-[10px] text-[var(--color-primary)] font-bold w-8 text-right">{borderWidths.left}px</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Text Color, Texture, and Icon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Text Color Theme */}
          <div className="flex flex-col gap-2">
            <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
              Color de Texto
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTextColor("light")}
                className={`h-11 rounded-xl border text-xs font-medium transition-all ${
                  textColor === "light"
                    ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "bg-[var(--color-surface-2)] border-white/5 text-[var(--color-on-dim)]"
                }`}
              >
                Claro
              </button>
              <button
                type="button"
                onClick={() => setTextColor("dark")}
                className={`h-11 rounded-xl border text-xs font-medium transition-all ${
                  textColor === "dark"
                    ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "bg-[var(--color-surface-2)] border-white/5 text-[var(--color-on-dim)]"
                }`}
              >
                Oscuro
              </button>
            </div>
          </div>

          {/* Texture Toggle */}
          <div className="flex flex-col gap-2">
            <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
              Textura
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTexture("none")}
                className={`h-11 rounded-xl border text-xs font-medium transition-all ${
                  texture === "none"
                    ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "bg-[var(--color-surface-2)] border-white/5 text-[var(--color-on-dim)]"
                }`}
              >
                Liso
              </button>
              <button
                type="button"
                onClick={() => setTexture("pinstripe")}
                className={`h-11 rounded-xl border text-xs font-medium transition-all ${
                  texture === "pinstripe"
                    ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "bg-[var(--color-surface-2)] border-white/5 text-[var(--color-on-dim)]"
                }`}
              >
                Líneas
              </button>
            </div>
          </div>

          {/* Selected Icon */}
          <div className="flex flex-col gap-2">
            <span className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
              Ícono Tarjeta
            </span>
            <div className="flex items-center gap-3 h-11 px-4 rounded-xl bg-[var(--color-surface-2)] border border-white/5 text-[var(--color-on-surface)]">
              <TranslateIcon iconKey={icon} size={18} style={{ color: accent }} />
              <span className="text-xs font-medium truncate capitalize">
                {ICON_OPTIONS.find((o) => o.key === icon)?.label || icon}
              </span>
            </div>
          </div>
        </div>

        {/* Icon Picker options list */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-[var(--color-on-dim)]">Selecciona el ícono:</span>
          <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
            {ICON_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setIcon(opt.key)}
                className={`h-9 flex items-center justify-center rounded-lg border transition-all ${
                  icon === opt.key
                    ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "bg-[var(--color-surface-2)] border-white/5 text-[var(--color-on-dim)] hover:border-white/10"
                }`}
                title={opt.label}
              >
                <TranslateIcon iconKey={opt.key} size={16} />
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="h-12 w-full mt-4 rounded-xl bg-[var(--color-primary-ctr)] text-white font-[var(--font-data)] text-[12px] font-bold tracking-[0.15em] uppercase shadow-[var(--shadow-fab)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-primary-mid)] active:translate-y-0 disabled:opacity-50"
        >
          {isPending
            ? "Procesando..."
            : saveStyleEnabled && createCardEnabled
            ? (selectedDesignId ? "Actualizar Estilo y Crear Tarjeta" : "Guardar Estilo y Crear Tarjeta")
            : saveStyleEnabled
            ? (selectedDesignId ? "Actualizar Estilo en Biblioteca" : "Guardar Estilo en Biblioteca")
            : "Crear Tarjeta Personalizada"}
        </button>
      </form>
    </div>
  );
}
