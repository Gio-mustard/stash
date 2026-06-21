"use client";

import React, { useEffect, useRef } from "react";
import TranslateIcon from "./translateIcon";

type SlidePanelProps = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  titleClassName?: string;
};

/**
 * SlidePanel — Custom modal that replaces Vaul Drawers.
 * - On mobile: slides up from the bottom (sheet-style).
 * - On desktop: slides in from the right (side panel).
 * - Only closes via the explicit close button — no click-outside dismiss.
 */
export default function SlidePanel({
  open,
  onClose,
  title,
  children,
  titleClassName = "",
}: SlidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop — non-interactive */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={[
          "absolute z-10",
          "text-on-surface bg-surface-3",
          "border-border flex flex-col",
          // Mobile: bottom sheet
          "bottom-0 left-0 right-0 max-h-[88dvh] rounded-t-2xl border-t",
          "animate-in slide-in-from-bottom duration-300",
          // Desktop: right panel
          "sm:top-0 sm:right-0 sm:left-auto sm:bottom-0",
          "sm:w-[420px] sm:max-h-full sm:rounded-l-2xl sm:rounded-tr-none",
          "sm:border-l sm:border-t-0",
          "sm:animate-in sm:slide-in-from-right sm:duration-300",
        ].join(" ")}
      >
        {/* Handle bar for mobile */}
        <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-white/10 my-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 sm:pt-7 sm:pb-4 shrink-0">
          <h2 className={`text-lg font-semibold tracking-tight ${titleClassName}`}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-on-dim hover:text-on-surface hover:bg-white/5 active:scale-90 transition-all"
          >
            <TranslateIcon iconKey="plus" size={18} className="rotate-45" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col gap-5">
          {children}
        </div>
      </div>
    </div>
  );
}
