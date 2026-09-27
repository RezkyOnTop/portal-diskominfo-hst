import { cn } from "@/lib/utils/cn";

/** Placeholder shimmer untuk state loading. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-neutral-200/70", className)}
    />
  );
}

/**
 * SkeletonLoader — placeholder daftar kartu saat memuat data dari API Media Center.
 * Menandai area sebagai sibuk untuk screen reader.
 */
export function SkeletonLoader({ count = 6 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      aria-label="Memuat konten"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[var(--radius-card)] border border-neutral-200 bg-white"
        >
          <Skeleton className="h-44 w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
