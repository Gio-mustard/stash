/**
 * loading.tsx — Profile page Suspense fallback.
 * Shown instantly while profile data fetches from Supabase.
 */
export default function ProfileLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-6 pb-[calc(72px+32px)] lg:pb-12 flex flex-col gap-8">
      {/* Header skeleton */}
      <div>
        <div className="h-7 w-32 rounded-lg bg-surface-2 animate-pulse mb-2" />
        <div className="h-3 w-56 rounded bg-surface-2 animate-pulse" />
      </div>
      {/* Avatar + info skeleton */}
      <div className="flex items-center gap-4">
        <div className="size-20 rounded-full bg-surface-2 animate-pulse shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-5 w-32 rounded bg-surface-2 animate-pulse" />
          <div className="h-3 w-48 rounded bg-surface-2 animate-pulse" />
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-surface-2 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
