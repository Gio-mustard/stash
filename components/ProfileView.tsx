"use client";

import React, { useTransition, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Drawer } from "vaul";
import { updateProfile, logout, deleteAccount, uploadAvatar } from "@/app/actions_extended";
import TranslateIcon from "@/components/translateIcon";

type Pocket = {
  id: string;
  name: string;
  balance: number;
};

type ProfileViewProps = {
  initialUsername: string;
  email: string;
  avatarUrl?: string | null;
  balance: string;
  guardaditosCount: number;
  pockets?: Pocket[];
};

const SETTINGS_ROWS = [
  { href: "/settings/personal",     label: "Información Personal",    iconKey: "profile" },
  { href: "/settings/security",     label: "Seguridad y Biometría",   iconKey: "lock" },
  { href: "/settings/payments",     label: "Métodos de Pago",         iconKey: "creditCard" },
  { href: "/settings/preferences",  label: "Preferencias",             iconKey: "settings" },
] as const;

/**
 * ProfileView renders the full profile dashboard with avatar upload, account settings navigation,
 * savings statistics, and the danger zone for account lifecycle management.
 */
export default function ProfileView({
  initialUsername,
  email,
  avatarUrl,
  balance,
  guardaditosCount,
  pockets = [],
}: ProfileViewProps) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = React.useState("");
  const [localAvatar, setLocalAvatar] = React.useState<string | null>(avatarUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initial = initialUsername.charAt(0).toUpperCase();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateProfile(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  };

  const handleLogout = () => {
    if (!window.confirm("¿Estás seguro que deseas cerrar tu sesión?")) return;
    startTransition(async () => { await logout(); });
  };

  const handleDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmDeleteText !== "eliminar mi cuenta") return;
    startTransition(async () => { await deleteAccount(); });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setLocalAvatar(preview);
    const formData = new FormData();
    formData.set("avatar_file", file);
    startTransition(async () => { await uploadAvatar(formData); });
  };
  return (
    <div className="flex flex-col gap-5 w-full max-w-md">

      {/* Hero Card */}
      <section className="bg-[var(--color-surface-2)] border border-white/5 rounded-2xl overflow-hidden">
        <div
          className="h-20 w-full"
          style={{ background: "linear-gradient(135deg, #0a0a0a 0%, rgba(10,77,46,0.3) 100%)" }}
          aria-hidden="true"
        />
        <div className="px-6 pb-6 -mt-9 flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Cambiar foto de perfil"
                className="relative group"
              >
                {localAvatar ? (
                  <div className="size-[72px] rounded-2xl overflow-hidden border-2 border-[var(--color-primary)] ring-2 ring-[var(--color-bg)]">
                    <Image
                      src={localAvatar}
                      alt="Avatar"
                      width={72}
                      height={72}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="size-[72px] rounded-2xl bg-[var(--color-primary-ctr)] border-2 border-[var(--color-primary)] ring-2 ring-[var(--color-bg)] flex items-center justify-center">
                    <span className="font-[var(--font-data)] text-2xl font-bold text-[var(--color-primary)]">
                      {initial}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1.5 -right-1.5 size-6 rounded-full bg-[var(--color-primary-ctr)] border-2 border-[var(--color-bg)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <TranslateIcon iconKey="camera" size={11} className="text-white" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-on-surface)]">
              {initialUsername}
            </h1>
            <p className="text-xs text-[var(--color-on-dim)] mt-0.5">{email}</p>
          </div>

          <div className="flex flex-col gap-0.5">
            <p className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--color-on-dim)]">
              Saldo Total
            </p>
            <p className="font-[var(--font-data)] text-[28px] font-bold tracking-tight text-[var(--color-primary)]">
              {balance}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface-3)] border border-white/5 relative overflow-hidden opacity-50">
              <TranslateIcon iconKey="wallet" size={12} className="text-[var(--color-on-dim)]" />
              <span className="text-[11px] text-[var(--color-on-dim)] font-semibold">
                Bancos vinculados
              </span>
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-3)]/80">
                <span className="text-[9px] font-bold text-[var(--color-on-dim)] tracking-wider">PRÓXIMAMENTE</span>
              </div>
            </div>

            {guardaditosCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
                <TranslateIcon iconKey="piggybank" size={12} className="text-[var(--color-primary)]" />
                <span className="text-[11px] text-[var(--color-primary)] font-semibold">
                  {guardaditosCount} {guardaditosCount === 1 ? "Guardadito" : "Guardaditos"}
                </span>
              </div>
            )}

            {pockets.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface-3)] border border-white/5">
                <TranslateIcon iconKey="creditCard" size={12} className="text-[var(--color-on-dim)]" />
                <span className="text-[11px] text-[var(--color-on-dim)] font-semibold">
                  {pockets.length} {pockets.length === 1 ? "Pocket" : "Pockets"}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Edit username */}
      <section className="bg-[var(--color-surface-2)] border border-white/5 rounded-2xl p-5">
        <h2 className="text-xs font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)] mb-4">
          Editar Nombre de Usuario
        </h2>
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            id="username"
            name="username"
            type="text"
            required
            defaultValue={initialUsername}
            disabled={isPending}
            placeholder="Nombre de usuario"
            className="flex-1 h-10 rounded-xl bg-[var(--color-surface-3)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
          />
          <button
            type="submit"
            disabled={isPending}
            className="h-10 px-4 rounded-xl bg-[var(--color-primary-ctr)] text-white text-xs font-bold tracking-widest uppercase transition-all disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
          >
            {isPending ? "..." : success ? "✓ Guardado" : "Guardar"}
          </button>
        </form>
      </section>

      {/* Account Settings */}
      <section className="bg-[var(--color-surface-2)] border border-white/5 rounded-2xl overflow-hidden">
        <h2 className="px-5 pt-5 pb-3 text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--color-on-muted)]">
          Configuración de Cuenta
        </h2>
        <div className="divide-y divide-white/5">
          {SETTINGS_ROWS.map(({ href, label, iconKey }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3.5 px-5 py-4 hover:bg-white/[0.02] transition-colors duration-150"
            >
              <div className="size-8 rounded-xl bg-[var(--color-surface-3)] flex items-center justify-center text-[var(--color-on-dim)] shrink-0">
                <TranslateIcon iconKey={iconKey} size={16} className="text-current" />
              </div>
              <span className="flex-1 text-sm text-[var(--color-on-surface)]">{label}</span>
              <TranslateIcon iconKey="chevronRight" size={16} className="text-[var(--color-on-dim)]" />
            </Link>
          ))}
        </div>
      </section>

      {/* Support */}
      <section className="bg-[var(--color-surface-2)] border border-white/5 rounded-2xl overflow-hidden">
        <h2 className="px-5 pt-5 pb-3 text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--color-on-muted)]">
          Soporte
        </h2>
        <Link
          href="/support"
          className="flex items-center gap-3.5 px-5 py-4 hover:bg-white/[0.02] transition-colors duration-150"
        >
          <div className="size-8 rounded-xl bg-[var(--color-surface-3)] flex items-center justify-center text-[var(--color-on-dim)] shrink-0">
            <TranslateIcon iconKey="helpCircle" size={16} className="text-current" />
          </div>
          <span className="flex-1 text-sm text-[var(--color-on-surface)]">Centro de Ayuda</span>
          <TranslateIcon iconKey="chevronRight" size={16} className="text-[var(--color-on-dim)]" />
        </Link>
      </section>

      {/* Danger Zone */}
      <section className="bg-[var(--color-surface-2)] border border-red-900/30 rounded-2xl overflow-hidden">
        <h2 className="px-5 pt-5 pb-3 text-[10px] font-bold tracking-[0.12em] uppercase text-red-400">
          Zona de Peligro
        </h2>
        <div className="divide-y divide-white/5">
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-white/[0.02] transition-colors duration-150"
          >
            <div className="size-8 rounded-xl bg-[var(--color-surface-3)] flex items-center justify-center text-[var(--color-on-dim)] shrink-0">
              <TranslateIcon iconKey="plus" size={16} className="text-current rotate-45" />
            </div>
            <span className="flex-1 text-sm text-left text-[var(--color-on-surface)]">Cerrar Sesión</span>
          </button>

          <button
            onClick={() => setIsDeleteOpen(true)}
            disabled={isPending}
            className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-red-950/20 transition-colors duration-150"
          >
            <div className="size-8 rounded-xl bg-red-950/30 flex items-center justify-center text-red-400 shrink-0">
              <TranslateIcon iconKey="emergency" size={16} className="text-current" />
            </div>
            <span className="flex-1 text-sm text-left text-red-300">Eliminar Cuenta</span>
            <TranslateIcon iconKey="chevronRight" size={16} className="text-red-400/50" />
          </button>
        </div>
      </section>

      {/* Delete Account Drawer */}
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
                  Eliminar Cuenta
                </Drawer.Title>
                <Drawer.Close className="text-[var(--color-on-dim)] hover:text-[var(--color-on-surface)]">
                  <TranslateIcon iconKey="plus" size={20} className="rotate-45" />
                </Drawer.Close>
              </div>
              <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-lg text-xs text-red-200 leading-relaxed mb-6 flex flex-col gap-2">
                <span className="font-bold text-red-300">⚠️ ¡Esta acción es irreversible y permanente!</span>
                <span>Se eliminarán todos tus datos financieros, balances, guardaditos y transacciones de Stash.</span>
              </div>
              <form onSubmit={handleDeleteAccount} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-on-muted)]">
                    Para confirmar, escribe <span className="text-white font-mono">eliminar mi cuenta</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={confirmDeleteText}
                    onChange={(e) => setConfirmDeleteText(e.target.value)}
                    placeholder="eliminar mi cuenta"
                    disabled={isPending}
                    className="h-11 w-full rounded-lg bg-[var(--color-surface-2)] border border-white/5 px-4 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-red-500/50 transition-all font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending || confirmDeleteText !== "eliminar mi cuenta"}
                  className="h-11 w-full mt-2 rounded-xl bg-red-700 hover:bg-red-600 disabled:bg-red-950/40 text-white font-[var(--font-data)] text-[12px] font-bold tracking-[0.15em] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Eliminar Mi Cuenta Permanentemente
                </button>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
