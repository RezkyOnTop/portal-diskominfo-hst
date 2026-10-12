import { Container } from "@/components/layout/Container";

/**
 * Loading UI untuk /berita/[slug].
 *
 * Detail berita perlu mengambil feed Media Center (adapter meng-cache-nya,
 * tetapi saat cache dingin permintaan pertama tetap menunggu). Skeleton ini
 * muncul seketika sehingga klik dari daftar berita terasa langsung pindah.
 */
export default function Loading() {
  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl">
        <div className="h-4 w-40 animate-pulse rounded bg-neutral-200/70" />
        <div className="mt-4 h-9 w-full animate-pulse rounded bg-neutral-200/70" />
        <div className="mt-2 h-9 w-3/4 animate-pulse rounded bg-neutral-200/70" />
        <div className="mt-6 h-4 w-56 animate-pulse rounded bg-neutral-200/60" />
        <div className="mt-8 aspect-[16/9] w-full animate-pulse rounded-[var(--radius-card)] bg-neutral-200/60" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-neutral-200/50" />
          ))}
        </div>
      </div>
    </Container>
  );
}
