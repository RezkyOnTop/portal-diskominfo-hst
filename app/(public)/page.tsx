import { Suspense } from "react";
import Link from "next/link";
import { Hero } from "@/components/layout/Hero";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { NewsCard } from "@/components/news/NewsCard";
import { SkeletonLoader } from "@/components/news/SkeletonLoader";
import { ApiErrorFallback } from "@/components/news/ApiErrorFallback";
import { SocialFeed } from "@/components/layout/SocialFeed";
import { getBerita, getPengumuman } from "@/lib/api/media-center";
import { LAYANAN } from "@/lib/config";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Container className="py-12">
        <SectionHeading
          action={
            <Link
              href="/berita"
              className="text-sm font-semibold text-primary-700 hover:underline"
            >
              Semua berita →
            </Link>
          }
        >
          Berita Terbaru
        </SectionHeading>
        <p className="mt-1 text-sm text-neutral-600">
          Bersumber dari Media Center HST (mediacenter.hstkab.go.id).
        </p>
        <div className="mt-6">
          <Suspense fallback={<SkeletonLoader count={6} />}>
            <LatestBerita />
          </Suspense>
        </div>
      </Container>

      <Container className="py-4">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <section>
            <SectionHeading
              action={
                <Link
                  href="/pengumuman"
                  className="text-sm font-semibold text-primary-700 hover:underline"
                >
                  Semua pengumuman →
                </Link>
              }
            >
              Pengumuman Resmi
            </SectionHeading>
            <div className="mt-6">
              <Suspense fallback={<SkeletonLoader count={2} />}>
                <LatestPengumuman />
              </Suspense>
            </div>
          </section>

          <section>
            <SectionHeading>Layanan Digital</SectionHeading>
            <ul className="mt-6 space-y-3">
              {LAYANAN.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-[var(--radius-card)] border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)] hover:border-primary-600"
                  >
                    <span className="flex items-center justify-between font-semibold text-neutral-900">
                      {l.name} <span aria-hidden="true">↗</span>
                    </span>
                    <span className="mt-1 block text-sm text-neutral-600">
                      {l.description}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Container>

      <Container className="py-8">
        <SocialFeed />
      </Container>
    </>
  );
}

async function LatestBerita() {
  // Fetch (dan error-nya) di dalam try/catch; JSX dirender di luar try/catch
  // agar tidak melanggar aturan react-hooks/error-boundaries.
  let data;
  try {
    ({ data } = await getBerita({ limit: 6 }));
  } catch {
    return <ApiErrorFallback />;
  }
  if (data.length === 0) {
    return <EmptyState label="Belum ada berita untuk ditampilkan." />;
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((b, i) => (
        <NewsCard key={b.id} berita={b} priority={i < 3} />
      ))}
    </div>
  );
}

async function LatestPengumuman() {
  let data;
  try {
    ({ data } = await getPengumuman({ limit: 4 }));
  } catch {
    return <ApiErrorFallback />;
  }
  if (data.length === 0) return <EmptyState label="Belum ada pengumuman." />;
  return (
    <ul className="divide-y divide-neutral-200 rounded-[var(--radius-card)] border border-neutral-200 bg-white">
      {data.map((p) => (
        <li key={p.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <Link
              href={`/pengumuman#${p.slug}`}
              className="font-medium text-neutral-900 hover:text-primary-700"
            >
              {p.title}
            </Link>
            <Badge tone="accent">{formatDate(p.publishedAt)}</Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="rounded-[var(--radius-card)] border border-dashed border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600">
      {label}
    </p>
  );
}
