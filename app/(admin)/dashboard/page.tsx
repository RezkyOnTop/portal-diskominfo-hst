import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { auth } from "@/lib/auth";
import { getStatistikRingkas } from "@/lib/services/visitor";
import { countSubscribers } from "@/lib/services/subscriber";
import { countReservations } from "@/lib/services/reservation";
import { countSurveys, getRingkasanSurvei } from "@/lib/services/survey";
import { countPengaduan } from "@/lib/services/pengaduan";
import { countUsers } from "@/lib/services/user";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Admin" };

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const [stats, subscribers, reservasi, surveiCount, survei, pengaduan, pengguna] =
    await Promise.all([
      getStatistikRingkas(7),
      countSubscribers(),
      countReservations(),
      countSurveys(),
      getRingkasanSurvei(),
      countPengaduan(),
      // Statistik user hanya untuk Administrator (Editor tidak boleh tahu).
      isAdmin ? countUsers() : Promise.resolve(null),
    ]);

  return (
    <div className="space-y-8">
      <SectionHeading as="h1">Ringkasan</SectionHeading>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total kunjungan" value={stats.total} />
        <StatCard label="Kunjungan hari ini" value={stats.hariIni} />
        <StatCard label="Subscriber radio" value={subscribers} />
        <StatCard label="Reservasi menunggu" value={reservasi.menunggu} />
        <StatCard label="Reservasi total" value={reservasi.total} />
        <StatCard label="Pengaduan baru" value={pengaduan.baru} />
        <StatCard label="Jawaban survei IKM" value={surveiCount} />
        {pengguna ? <StatCard label="Akun user" value={pengguna.total} /> : null}
      </div>

      <p className="text-sm text-neutral-600 dark:text-slate-400">
        Data di halaman ini berasal dari database lokal (VisitorStat,
        RadioSubscriber, ServiceReservation, ServiceSurvey, Pengaduan). Konten
        berita/pengumuman dikelola di Media Center HST, bukan di sini.
      </p>

      {/* Nilai IKM rata-rata, bila sudah ada responden. */}
      {survei && survei.responden > 0 ? (
        <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-neutral-600 dark:text-slate-400">
            Nilai Indeks Kepuasan Masyarakat (IKM)
          </p>
          <p className="mt-1 font-heading text-3xl font-bold text-neutral-900 dark:text-slate-50">
            {survei.ikm.toFixed(2)}{" "}
            <span className="text-base font-semibold text-neutral-600 dark:text-slate-400">
              · Mutu {survei.mutu}
            </span>
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-slate-400">
            dari {survei.responden.toLocaleString("id-ID")} responden
          </p>
        </div>
      ) : null}

      {/* Halaman terpopuler — menutup celah klaim "analitik kunjungan". */}
      {stats.halamanPopuler.length > 0 ? (
        <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
          <h2 className="font-heading text-base font-bold text-neutral-900 dark:text-slate-50">
            Halaman terpopuler (7 hari)
          </h2>
          <ul className="mt-3 space-y-1.5">
            {stats.halamanPopuler.slice(0, 5).map((h) => (
              <li key={h.path} className="flex items-center justify-between text-sm">
                <code className="text-neutral-700 dark:text-slate-300">{h.path}</code>
                <span className="font-semibold text-neutral-900 dark:text-slate-100">
                  {h.jumlah.toLocaleString("id-ID")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/statistik"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Lihat Statistik
        </Link>
        <Link
          href="/dashboard/reservasi"
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Kelola Reservasi
        </Link>
        <Link
          href="/dashboard/subscriber"
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Kelola Subscriber
        </Link>
        <Link
          href="/dashboard/survei"
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Lihat Survei IKM
        </Link>
        {isAdmin ? (
          <Link
            href="/dashboard/pengguna"
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Kelola User
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-neutral-200 pt-6 dark:border-slate-700">
        <span className="text-sm font-semibold text-neutral-700 dark:text-slate-300">
          Ekspor CSV:
        </span>
        <a
          href="/api/admin/ekspor?jenis=subscriber"
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ⬇ Subscriber
        </a>
        <a
          href="/api/admin/ekspor?jenis=reservasi"
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ⬇ Reservasi
        </a>
        <a
          href="/api/admin/ekspor?jenis=survei"
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ⬇ Survei IKM
        </a>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm text-neutral-600 dark:text-slate-400">{label}</p>
      <p className="mt-2 font-heading text-3xl font-bold text-neutral-900 dark:text-slate-50">
        {value.toLocaleString("id-ID")}
      </p>
    </div>
  );
}
