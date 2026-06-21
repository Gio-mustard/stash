"use client";

import React, { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { login, signup } from "./actions";
import TranslateIcon from "@/components/translateIcon";

/**
 * LoginForm — Interactive email/password authentication form.
 * Handles both sign-in and sign-up states, dispatching the appropriate Server Action.
 */
export default function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPending, startTransition] = useTransition();

  /**
   * Dispatches the form submission to the correct Server Action.
   *
   * @param event - The native form submission event.
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      if (isSignUp) {
        await signup(formData);
      } else {
        await login(formData);
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--color-bg)] px-6">
      <div className="w-full max-w-[400px] bg-surface-1 border border-border rounded-2xl p-8 shadow-[var(--shadow-card)]">
        <div className="flex flex-col items-center mb-8">
          <div className="size-12 rounded-xl bg-primary-ctr flex items-center justify-center mb-4">
            <TranslateIcon iconKey="wallet" size={24} className="text-on-primary" />
          </div>
          <h1 className="font-[var(--font-data)] text-2xl font-bold tracking-[0.2em] uppercase text-primary">
            STASH
          </h1>
          <p className="text-[12px] text-on-dim mt-2 font-medium tracking-wide">
            {isSignUp ? "CREAR UNA CUENTA ELITE" : "PORTAL DE BANCA PRIVADA"}
          </p>
        </div>

        {errorParam && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[13px] text-error leading-relaxed">
            {errorParam}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="username"
                className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-on-muted"
              >
                Nombre de Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                disabled={isPending}
                className="h-12 w-full rounded-lg bg-surface-2 border border-border px-4 text-sm text-on-surface transition-all duration-200 focus:outline-none focus:border-primary"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-on-muted"
            >
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              disabled={isPending}
              className="h-12 w-full rounded-lg bg-surface-2 border border-border px-4 text-sm text-on-surface transition-all duration-200 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="font-[var(--font-data)] text-[10px] font-bold tracking-[0.1em] uppercase text-on-muted"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              disabled={isPending}
              className="h-12 w-full rounded-lg bg-surface-2 border border-border px-4 text-sm text-on-surface transition-all duration-200 focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="h-12 w-full mt-2 rounded-xl bg-primary-ctr text-on-primary font-[var(--font-data)] text-[12px] font-bold tracking-[0.15em] uppercase shadow-[var(--shadow-fab)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-mid hover:shadow-[0_0_24px_rgba(10,77,46,0.5)] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? "PROCESANDO..." : isSignUp ? "REGISTRARSE" : "INGRESAR"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            disabled={isPending}
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[12px] text-on-dim hover:text-primary transition-colors duration-150 underline underline-offset-4"
          >
            {isSignUp
              ? "¿Ya tienes una cuenta? Iniciar Sesión"
              : "¿No tienes una cuenta? Registrarse"}
          </button>
        </div>
      </div>
    </div>
  );
}
