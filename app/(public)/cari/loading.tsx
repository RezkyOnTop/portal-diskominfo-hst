import { Container } from "@/components/layout/Container";
import { SkeletonLoader } from "@/components/news/SkeletonLoader";

/**
 * Loading UI untuk /cari.
 *
 * Pencarian menyaring seluruh feed berita di adapter; saat cache dingin
 * permintaan pertama menunggu unduhan feed. Skeleton ini memberi umpan balik
 * seketika setelah menekan Enter, bukan layar kosong yang menggantung.
 */
export default function Loading() {
  return (
    <Container className="py-10">
      <div className="mb-6 h-8 w-56 animate-pulse rounded bg-neutral-200/70" />
      <div className="h-12 w-full animate-pulse rounded-[var(--radius-card)] bg-neutral-200/60" />
      <div className="mt-8">
        <SkeletonLoader count={6} />
      </div>
    </Container>
  );
}
