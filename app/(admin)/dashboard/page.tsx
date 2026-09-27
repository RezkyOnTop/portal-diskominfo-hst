import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getStatistikRingkas } from "@/lib/services/visitor";
import { countSubscribers } from "@/lib/services/subscriber";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Admin" };

export default async function DashboardPage() {
  const [stats, subscribers] = await Promise.all([
    getStatistikRingkas(7),
    countSubscribers(),
  ]);

  return (
    <div className="space-y-8">
      <SectionHeading as="h1">Ringkasan</SectionHeading>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total kunjungan" value={stats.total} />
        <StatCard label="Kunjungan hari ini" value={stats.hariIni} />
        <StatCard label="Subscriber radio" value={subscribers} />
      </div>
      <p className="text-sm text-neutral-600">
        Data di halaman ini berasal dari database lokal (VisitorStat,
        RadioSubscriber). Konten berita/pengumuman/hoaks dikelola di Media Center
        HST, bukan di sini.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/statistik"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Lihat Statistik
        </Link>
        <Link
          href="/dashboard/subscriber"
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Kelola Subscriber
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)]">
      <p className="text-sm text-neutral-600">{label}</p>
      <p className="mt-2 font-heading text-3xl font-bold text-neutral-900">
        {value.toLocaleString("id-ID")}
      </p>
    </div>
  );
}
