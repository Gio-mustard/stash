/**
 * BackBreadcrumb — Generic breadcrumb / back-button component.
 *
 * Reads the current pathname and builds a breadcrumb trail automatically.
 * The last segment is the current page (dimmed). Everything before is
 * clickable and points to the corresponding parent route.
 *
 * Usage:
 *   <BackBreadcrumb />
 *   <BackBreadcrumb labels={{ wallet: "Wallet / Tarjetas" }} />
 *   <BackBreadcrumb last="DiDi" />
 *   <BackBreadcrumb parentHref="/wallet" parentLabel="Wallet / Tarjetas" last="Mi Diseño" />
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Human-readable overrides for well-known path segments. */
const DEFAULT_LABELS: Record<string, string> = {
  "":              "Inicio",
  wallet:          "Wallet / Tarjetas",
  guardaditos:     "Guardaditos",
  profile:         "Perfil",
  settings:        "Configuración",
  support:         "Soporte",
  login:           "Login",
  "custom-design": "Personalizar",
};

type BackBreadcrumbProps = {
  /**
   * Override the label for any specific URL segment.
   * Key is the raw segment string (e.g. "wallet"), value is the display label.
   */
  labels?: Record<string, string>;
  /**
   * Override the label for the last (current) segment only.
   * Useful for dynamic segments like a pocket name fetched server-side.
   */
  last?: string;
  /**
   * Fully override the back-button href.
   * Useful when the logical parent route doesn't exist as a real page
   * (e.g. /guardaditos/[id] → back to "/").
   */
  parentHref?: string;
  /**
   * Label for the overridden parent link.
   * Required when parentHref is set.
   */
  parentLabel?: string;
  /** Extra className for the outer wrapper. */
  className?: string;
};

export default function BackBreadcrumb({
  labels = {},
  last,
  parentHref,
  parentLabel,
  className = "",
}: BackBreadcrumbProps) {
  const pathname = usePathname();

  // If fully overriding the parent link, render a simple 2-part breadcrumb
  if (parentHref !== undefined) {
    const currentLabel = last ?? pathname.split("/").filter(Boolean).pop() ?? "Detalle";
    const pLabel = parentLabel ?? "Atrás";
    return (
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center gap-2 flex-wrap ${className}`}
      >
        <Link
          href={parentHref}
          className="
            font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em]
            text-primary uppercase
            hover:opacity-75 transition-opacity
            flex items-center gap-1.5
          "
          aria-label={`Volver a ${pLabel}`}
        >
          <span aria-hidden="true">←</span>
          {pLabel}
        </Link>
        <span className="text-on-surface opacity-20 text-xs" aria-hidden="true">/</span>
        <span
          className="text-xs text-on-dim font-medium"
          aria-current="page"
        >
          {currentLabel}
        </span>
      </nav>
    );
  }

  // Auto-build from pathname
  const rawSegments = pathname.split("/").filter(Boolean);

  const segments = rawSegments.map((seg, idx) => {
    const href = "/" + rawSegments.slice(0, idx + 1).join("/");
    const merged = { ...DEFAULT_LABELS, ...labels };
    const label =
      merged[seg] ??
      seg.charAt(0).toUpperCase() + seg.slice(1);
    return { label, href };
  });

  const homeLabel = { ...DEFAULT_LABELS, ...labels }[""] ?? "Inicio";
  const crumbs = [{ label: homeLabel, href: "/" }, ...segments];

  if (last && crumbs.length > 0) {
    crumbs[crumbs.length - 1] = {
      ...crumbs[crumbs.length - 1],
      label: last,
    };
  }

  if (crumbs.length <= 1) return null;

  const parentCrumbs = crumbs.slice(0, -1);
  const currentCrumb = crumbs[crumbs.length - 1];
  const backHref = parentCrumbs[parentCrumbs.length - 1].href;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-2 flex-wrap ${className}`}
    >
      <Link
        href={backHref}
        className="
          font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em]
          text-primary uppercase
          hover:opacity-75 transition-opacity
          flex items-center gap-1.5
          
        "
        aria-label={`Volver a ${parentCrumbs[parentCrumbs.length - 1].label}`}
      >
        <span aria-hidden="true">←</span>
        {parentCrumbs.map((crumb, idx) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {crumb.label}
            {idx < parentCrumbs.length - 1 && (
              <span className="text-on-surface opacity-20 font-normal">/</span>
            )}
          </span>
        ))}
      </Link>

      <span className="text-on-surface opacity-20 text-xs" aria-hidden="true">/</span>

      <span
        className="text-xs text-on-dim font-medium"
        aria-current="page"
      >
        {currentCrumb.label}
      </span>
    </nav>
  );
}
