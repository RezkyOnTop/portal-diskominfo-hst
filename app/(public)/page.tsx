import { Suspense } from "react";
import Link from "next/link";
import { Hero } from "@/components/layout/Hero";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { SkeletonLoader } from "@/components/news/SkeletonLoader";
import { ApiErrorFallback } from "@/components/news/ApiErrorFallback";
import { BentoBerita } from "@/components/news/BentoBerita";
import { NewsTicker } from "@/components/news/NewsTicker";
import { SocialFeed } from "@/components/layout/SocialFeed";
import { ProfilSection } from "@/components/layout/ProfilSection";
import { LayananBidang } from "@/components/layout/LayananBidang";
import { RadioSection } from "@/components/layout/RadioSection";
import { KontakSection } from "@/components/layout/KontakSection";
import { StatsBar } from "@/components/layout/StatsBar";
import { getBerita, getPengumuman } from "@/lib/api/media-center";
import { LAYANAN } from "@/lib/config";
import { formatDate } from "@/lib/utils/format";

// Beranda: data berita/pengumuman sudah di-cache 1 jam di adapter, jadi aman
// memakai ISR. Halaman disajikan dari cache statis (TTFB rendah) dan
// diperbarui di latar tiap 5 menit. Sesi/tema tetap ditangani di klien.
export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      <Hero />

      <Suspense fallback={null}>
        <Ticker />
      </Suspense>

      {/* Bento berita */}
      <Container className="py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
              Media Center HST
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
              Sorotan &amp; Berita Terbaru
            </h2>
          </div>
          <Link
            href="/berita"
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800 transition-colors hover:border-primary-300 hover:text-primary-700"
          >
            Semua berita →
          </Link>
        </div>
        <div className="mt-8">
          <Suspense fallback={<SkeletonLoader count={5} />}>
            <BeritaBento />
          </Suspense>
        </div>
      </Container>

      <ProfilSection />

      <StatsBar />

      <RadioSection />

      <LayananBidang />

      {/* Pengumuman + Layanan Digital */}
      <Container className="py-16">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
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
                    className="block rounded-[var(--radius-card)] border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)] transition-colors hover:border-primary-300"
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

      <Container className="pb-16">
        <SocialFeed />
      </Container>

      <KontakSection />
    </>
  );
}

async function Ticker() {
  let data;
  try {
    ({ data } = await getBerita({ limit: 8 }));
  } catch {
    return null;
  }
  return <NewsTicker items={data} />;
}

async function BeritaBento() {
  let data;
  try {
    ({ data } = await getBerita({ limit: 5 }));
  } catch {
    return <ApiErrorFallback />;
  }
  if (data.length === 0) {
    return <EmptyState label="Belum ada berita untuk ditampilkan." />;
  }
  return <BentoBerita items={data} />;
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
