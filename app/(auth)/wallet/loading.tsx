/**
 * loading.tsx — Wallet page Suspense fallback.
 * Shown instantly while wallet data fetches from Supabase.
 * Enables Next.js to prefetch the layout shell via <Link prefetch>.
 */
export default function WalletLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-6 pb-[calc(72px+32px)] lg:pb-12 flex flex-col gap-8">
      {/* Balance summary skeleton */}
      <div className="h-32 rounded-2xl bg-[var(--color-surface-2)] animate-pulse" />
      {/* Pockets grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-[var(--color-surface-2)] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
