/**
 * TopBar — Responsive application header.
 * Mobile: STASH wordmark centred.
 * Desktop: user avatar with welcome greeting.
 */
import Image from "next/image";
import BackBreadcrumb from "./BackBreadcrumb";

type TopBarProps = {
  userName?: string;
  avatarUrl?: string | null;
  breadcrumbOptions?: {
    last?: string;
    parentHref?: string;
    parentLabel?: string;
    labels?: Record<string, string>;
  };
};

/**
 * @param props - Optional user name and avatar URL.
 */
export default function TopBar({
  userName = "S",
  avatarUrl,
  breadcrumbOptions,
}: TopBarProps) {
  const initial = userName.charAt(0).toUpperCase();
  return (
    <header
      role="banner"
      className="
        sticky top-0 z-50
        flex items-center justify-between gap-4
        px-6 py-5
        bg-[var(--color-bg)]/80 
        backdrop-blur-md 
        border-b border-border lg:border-none
        w-full max-w-6xl mx-auto

      "

    >
      <BackBreadcrumb {...breadcrumbOptions} />
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <div className="size-9 shrink-0 rounded-full overflow-hidden border-[1.5px] border-primary">
            <Image
              src={avatarUrl}
              alt={`Avatar de ${userName}`}
              width={36}
              height={36}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div
            aria-label={`Sesión iniciada como ${userName}`}
            className="
              size-9 shrink-0 rounded-full
              bg-primary-ctr
              border-[1.5px] border-primary
              flex items-center justify-center
            "
          >
            <span
              aria-hidden="true"
              className="text-[14px] font-semibold text-primary tracking-wide"
            >
              {initial}
            </span>
          </div>
        )}
        <span className="hidden lg:inline text-[14px] font-medium text-on-surface">
          Bienvenido de nuevo,{" "}
          <span className="font-semibold text-primary">{userName}</span>
        </span>
      </div>

    </header>
  );
}
