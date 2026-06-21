/**
 * loading.tsx — Guardadito detail page Suspense fallback.
 * Matches GuardaditosDetailView layout to prevent CLS on navigation.
 */
export default function GuardaditoLoading() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-[var(--color-bg)]">
      {/* TopBar skeleton */}
      <div className="h-16 border-b border-border bg-surface-1 px-6 flex items-center justify-between shrink-0">
        <div className="h-4 w-24 rounded bg-surface-3 animate-pulse" />
        <div className="size-8 rounded-full bg-surface-3 animate-pulse" />
      </div>
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-6 pb-[calc(72px+32px)] flex flex-col gap-6">
        {/* Hero card */}
        <div className="h-52 rounded-2xl bg-surface-2 animate-pulse" />
        {/* Progress bar area */}
        <div className="h-4 rounded-full bg-surface-2 animate-pulse" />
        {/* Transactions */}
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-surface-2 animate-pulse" />
        ))}
      </main>
      <div className="fixed bottom-0 left-0 right-0 h-[72px] lg:hidden bg-surface-1 border-t border-border" />
    </div>
  );
}
