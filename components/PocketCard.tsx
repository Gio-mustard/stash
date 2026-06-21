import TranslateIcon from "./translateIcon";
import Link from "next/link";

export type PocketPresetKey =
  | "emerald-dark"
  | "midnight-gold"
  | "slate-blue"
  | "forest-pinstripe"
  | "obsidian-minimal"
  | "crimson-edge";

export type CustomDesignData = {
  bg_type?: "solid" | "gradient";
  bg_from: string;
  bg_to: string;
  bg_image?: string | null;
  bg_image_pos?: string;
  bg_image_opacity?: number; // 0 to 1
  border_selection?: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  border_widths?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  accent: string;
  texture: "none" | "pinstripe";
  icon: string;
  text_color: "light" | "dark";
};

export type PocketData = {
  id: string;
  name: string;
  subtitle?: string | null;
  balance: number;
  design_preset: PocketPresetKey;
  custom_design?: CustomDesignData | null;
};

type PocketCardProps = {
  pocket: PocketData;
  isInteractive?: boolean;
};

export const POCKET_PRESETS: Record<
  PocketPresetKey,
  {
    bg: string;
    accent: string;
    text: string;
    muted: string;
    border: string;
    texture: "none" | "pinstripe";
    icon: string;
    bg_image?: string | null;
    bg_image_pos?: string;
    bg_image_opacity?: number;
    border_selection?: {
      top: boolean;
      right: boolean;
      bottom: boolean;
      left: boolean;
    };
    border_widths?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  }
> = {
  "emerald-dark": {
    bg: "linear-gradient(135deg, #0b1510 0%, #032313 100%)",
    accent: "#96d4ab",
    text: "#e5e2e1",
    muted: "#8a938b",
    border: "rgba(150, 212, 171, 0.15)",
    texture: "pinstripe",
    icon: "wallet",
  },
  "midnight-gold": {
    bg: "linear-gradient(135deg, #090909 0%, #201a10 100%)",
    accent: "#e9a23a",
    text: "#e5e2e1",
    muted: "#a1998f",
    border: "rgba(233, 162, 58, 0.15)",
    texture: "pinstripe",
    icon: "creditCard",
  },
  "slate-blue": {
    bg: "linear-gradient(135deg, #0b0f19 0%, #0c2045 100%)",
    accent: "#60a5fa",
    text: "#e5e2e1",
    muted: "#8fa5c5",
    border: "rgba(96, 165, 250, 0.15)",
    texture: "pinstripe",
    icon: "creditCard",
  },
  "forest-pinstripe": {
    bg: "linear-gradient(135deg, #021a11 0%, #073822 100%)",
    accent: "#34d399",
    text: "#e5e2e1",
    muted: "#8fa89b",
    border: "rgba(52, 211, 153, 0.15)",
    texture: "pinstripe",
    icon: "banknote",
  },
  "obsidian-minimal": {
    bg: "linear-gradient(135deg, #080808 0%, #151515 100%)",
    accent: "#ffffff",
    text: "#e5e2e1",
    muted: "#8e8e8e",
    border: "rgba(255, 255, 255, 0.1)",
    texture: "none",
    icon: "wallet",
  },
  "crimson-edge": {
    bg: "linear-gradient(135deg, #150606 0%, #3b0505 100%)",
    accent: "#ffb4ab",
    text: "#e5e2e1",
    muted: "#c0a8a5",
    border: "rgba(255, 180, 171, 0.15)",
    texture: "pinstripe",
    icon: "creditCard",
  },
};

export function getPocketStyles(pocket: PocketData) {
  if (pocket.custom_design) {
    const cd = pocket.custom_design;
    const isLight = cd.text_color === "light";
    const bgVal = cd.bg_type === "solid" ? cd.bg_from : `linear-gradient(135deg, ${cd.bg_from} 0%, ${cd.bg_to} 100%)`;
    return {
      bg: bgVal,
      accent: cd.accent,
      text: isLight ? "#e5e2e1" : "#131313",
      muted: isLight ? "rgba(229, 226, 225, 0.65)" : "rgba(19, 19, 19, 0.65)",
      border: `rgba(${parseInt(cd.accent.slice(1,3), 16) || 255}, ${parseInt(cd.accent.slice(3,5), 16) || 255}, ${parseInt(cd.accent.slice(5,7), 16) || 255}, 0.15)`,
      texture: cd.texture || "none",
      icon: cd.icon || "wallet",
      bg_image: cd.bg_image,
      bg_image_pos: cd.bg_image_pos,
      bg_image_opacity: cd.bg_image_opacity,
      border_selection: cd.border_selection,
      border_widths: cd.border_widths,
    };
  }

  const preset = POCKET_PRESETS[pocket.design_preset] || POCKET_PRESETS["emerald-dark"];
  return preset;
}

export default function PocketCard({ pocket, isInteractive = true }: PocketCardProps) {
  const styles = getPocketStyles(pocket);
  const formattedBalance = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(pocket.balance);

  const tW = styles.border_widths?.top ?? 1;
  const rW = styles.border_widths?.right ?? 1;
  const bW = styles.border_widths?.bottom ?? 1;
  const lW = styles.border_widths?.left ?? 1;

  const borderTop = styles.border_selection ? (styles.border_selection.top ? `${tW}px solid ${styles.border}` : "none") : "1px solid ${styles.border}";
  const borderRight = styles.border_selection ? (styles.border_selection.right ? `${rW}px solid ${styles.border}` : "none") : "1px solid ${styles.border}";
  const borderBottom = styles.border_selection ? (styles.border_selection.bottom ? `${bW}px solid ${styles.border}` : "none") : "1px solid ${styles.border}";
  const borderLeft = styles.border_selection ? (styles.border_selection.left ? `${lW}px solid ${styles.border}` : "none") : "1px solid ${styles.border}";

  const cardContent = (
    <article
      aria-label={`Tarjeta pocket ${pocket.name}`}
      style={{
        background: styles.bg,
        borderTop,
        borderRight,
        borderBottom,
        borderLeft,
      }}
      className={`
        relative overflow-hidden
        flex flex-col justify-between
        min-h-[170px] w-full rounded-2xl p-6
        transition-all duration-300
        ${styles.texture === "pinstripe" ? "pinstripe" : ""}
        ${isInteractive ? "cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]" : ""}
      `}
    >
      {/* Decorative top-right circle glow */}
      <div
        className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{ backgroundColor: styles.accent }}
      />

      {/* Custom Background Image Layer */}
      {styles.bg_image && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url(${styles.bg_image})`,
            backgroundPosition: styles.bg_image_pos || "center",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            opacity: styles.bg_image_opacity ?? 0.5,
          }}
        />
      )}

      {/* Header Info */}
      <div className="flex justify-between items-start z-10">
        <div>
          <h3
            className="font-semibold text-lg tracking-tight transition-colors duration-200"
            style={{ color: styles.text }}
          >
            {pocket.name}
          </h3>
          {pocket.subtitle && (
            <p className="text-xs font-medium tracking-wide mt-0.5" style={{ color: styles.muted }}>
              {pocket.subtitle}
            </p>
          )}
        </div>
        <div style={{ color: styles.accent }} className="opacity-90">
          <TranslateIcon iconKey={styles.icon} size={24} className="text-current" />
        </div>
      </div>

      {/* Balance Section */}
      <div className="mt-8 z-10">
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: styles.muted }}>
          Saldo Disponible
        </p>
        <p
          className="font-[var(--font-data)] text-2xl lg:text-3xl font-extrabold tracking-tight mt-1 leading-none"
          style={{ color: styles.text }}
        >
          {formattedBalance}
        </p>
      </div>
    </article>
  );

  if (isInteractive) {
    return (
      <Link href={`/wallet/${pocket.id}`} className="block w-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
