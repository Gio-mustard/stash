/**
 * loading.tsx — Profile page Suspense fallback.
 * Shown instantly while profile data fetches from Supabase.
 */
export default function ProfileLoading() {
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

        <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-6 pb-[calc(72px+32px)] lg:pb-12 flex flex-col gap-8">
          {/* Header skeleton */}
          <div>
            <div className="h-7 w-32 rounded-lg bg-[var(--color-surface-2)] animate-pulse mb-2" />
            <div className="h-3 w-56 rounded bg-[var(--color-surface-2)] animate-pulse" />
          </div>
          {/* Avatar + info skeleton */}
          <div className="flex items-center gap-4">
            <div className="size-20 rounded-full bg-[var(--color-surface-2)] animate-pulse shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-5 w-32 rounded bg-[var(--color-surface-2)] animate-pulse" />
              <div className="h-3 w-48 rounded bg-[var(--color-surface-2)] animate-pulse" />
            </div>
          </div>
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-[var(--color-surface-2)] animate-pulse" />
            ))}
          </div>
        </main>
      </div>

      {/* BottomNav skeleton (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 h-[72px] lg:hidden bg-[var(--color-surface-1)] border-t border-white/5" />
    </div>
  );
}
