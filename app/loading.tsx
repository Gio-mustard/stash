/**
 * loading.tsx — Root-level Suspense fallback (skeleton) for the dashboard.
 * Next.js wraps page.tsx in a <Suspense> boundary and shows this instantly
 * while the server fetches data. Also enables prefetching of the layout shell
 * for all child `<Link>` elements pointing to "/".
 */
export default function Loading() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[var(--color-bg)]">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 max-h-svh bg-[var(--color-surface-1)] border-r border-white/5 p-6">
        <div className="mb-10 px-3 py-2">
          <div className="h-5 w-16 rounded bg-[var(--color-surface-3)] animate-pulse" />
        </div>
        <nav className="flex-1 flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-11 rounded-xl bg-[var(--color-surface-2)] animate-pulse" />
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        {/* TopBar skeleton */}
        <div className="h-16 border-b border-white/5 bg-[var(--color-surface-1)] px-6 flex items-center justify-between shrink-0">
          <div className="h-4 w-24 rounded bg-[var(--color-surface-3)] animate-pulse" />
          <div className="size-8 rounded-full bg-[var(--color-surface-3)] animate-pulse" />
        </div>

        <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-6 pb-[calc(72px+32px)] lg:pb-12 flex flex-col gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* BalanceCard skeleton */}
              <div className="h-44 rounded-2xl bg-[var(--color-surface-2)] animate-pulse" />
              {/* ActionButtons skeleton */}
              <div className="h-14 rounded-2xl bg-[var(--color-surface-2)] animate-pulse" />
              {/* GuardaditosSection skeleton */}
              <div className="h-40 rounded-2xl bg-[var(--color-surface-2)] animate-pulse" />
            </div>
            {/* Transactions skeleton */}
            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-[var(--color-surface-2)] animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* BottomNav skeleton (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 h-[72px] lg:hidden bg-[var(--color-surface-1)] border-t border-white/5" />
    </div>
  );
}
