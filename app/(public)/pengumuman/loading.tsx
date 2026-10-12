import { Container } from "@/components/layout/Container";
import { SkeletonLoader } from "@/components/news/SkeletonLoader";

/**
 * Loading UI untuk /pengumuman.
 *
 * Server masih perlu mengambil feed Media Center saat cache dingin, jadi
 * navigasi ke halaman ini bisa terasa menunggu. Dengan `loading.tsx`, Next
 * menampilkan kerangka ini SEKETIKA saat link diklik — halaman terasa pindah
 * langsung, bukan menggantung. (Beranda juga sudah memakai Suspense.)
 */
export default function Loading() {
  return (
    <Container className="py-10">
      <div className="mb-8 h-8 w-64 animate-pulse rounded bg-neutral-200/70" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-[var(--radius-card)] bg-neutral-200/60"
          />
        ))}
      </div>
      <div className="mt-8">
        <SkeletonLoader count={3} />
      </div>
    </Container>
  );
}
