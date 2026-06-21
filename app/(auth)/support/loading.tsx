/**
 * loading.tsx — Support page Suspense fallback.
 */
export default function SupportLoading() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[var(--color-bg)]">
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
        <div className="h-16 border-b border-white/5 bg-[var(--color-surface-1)] px-6 flex items-center justify-between shrink-0">
          <div className="h-4 w-24 rounded bg-[var(--color-surface-3)] animate-pulse" />
          <div className="size-8 rounded-full bg-[var(--color-surface-3)] animate-pulse" />
        </div>
        <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-6">
          <div className="h-64 rounded-2xl bg-[var(--color-surface-2)] animate-pulse" />
        </main>
      </div>
    </div>
  );
}
