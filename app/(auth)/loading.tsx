/**
 * loading.tsx — Root-level Suspense fallback (skeleton) for the dashboard.
 * Next.js wraps page.tsx in a <Suspense> boundary and shows this instantly
 * while the server fetches data. Also enables prefetching of the layout shell
 * for all child `<Link>` elements pointing to "/".
 */
export default function Loading() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-6 pb-[calc(72px+32px)] lg:pb-12 flex flex-col gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* BalanceCard skeleton */}
          <div className="h-44 rounded-2xl bg-surface-2 animate-pulse" />
          {/* ActionButtons skeleton */}
          <div className="h-14 rounded-2xl bg-surface-2 animate-pulse" />
          {/* GuardaditosSection skeleton */}
          <div className="h-40 rounded-2xl bg-surface-2 animate-pulse" />
        </div>
        {/* Transactions skeleton */}
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-surface-2 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
