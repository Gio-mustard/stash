/**
 * loading.tsx — Pocket detail page Suspense fallback.
 * Matches the layout of PocketDetailView to prevent CLS.
 */
export default function PocketLoading() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-[var(--color-bg)]">
      {/* TopBar skeleton */}
      <div className="h-16 border-b border-white/5 bg-[var(--color-surface-1)] px-6 flex items-center justify-between shrink-0">
        <div className="h-4 w-24 rounded bg-[var(--color-surface-3)] animate-pulse" />
        <div className="size-8 rounded-full bg-[var(--color-surface-3)] animate-pulse" />
      </div>
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-6 pb-[calc(72px+32px)] flex flex-col gap-6">
        {/* Header card */}
        <div className="h-48 rounded-2xl bg-[var(--color-surface-2)] animate-pulse" />
        {/* Transactions list */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-[var(--color-surface-2)] animate-pulse" />
        ))}
      </main>
      <div className="fixed bottom-0 left-0 right-0 h-[72px] lg:hidden bg-[var(--color-surface-1)] border-t border-white/5" />
    </div>
  );
}
