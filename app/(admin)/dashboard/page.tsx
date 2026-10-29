import {
  ActionLink,
  ExportLink,
  ListRow,
  Panel,
  PanelHeader,
  StatCard,
} from "@/components/admin/ui";
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

  const maxHalaman = Math.max(1, ...stats.halamanPopuler.map((h) => h.jumlah));
  const ikm = survei && survei.responden > 0 ? Math.min(100, Math.max(0, survei.ikm)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-heading text-[20px] font-semibold text-[var(--adm-ink)]">Ringkasan</h1>
        <p className="text-[12px] text-[var(--adm-muted)]">7 hari terakhir</p>
      </div>

      {/* Angka kunci: label tenang, angka tabular, tanpa ikon. */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total kunjungan" value={stats.total} hint="Seluruh waktu" />
        <StatCard label="Kunjungan hari ini" value={stats.hariIni} />
        <StatCard label="Subscriber radio" value={subscribers} />
        <StatCard
          label="Reservasi menunggu"
          value={reservasi.menunggu}
          hint={`dari ${reservasi.total.toLocaleString("id-ID")} permohonan`}
        />
        <StatCard label="Pengaduan baru" value={pengaduan.baru} />
        <StatCard label="Jawaban survei IKM" value={surveiCount} />
        {pengguna ? <StatCard label="Akun user" value={pengguna.total} /> : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* IKM */}
        {survei && survei.responden > 0 ? (
          <Panel className="p-5">
            <PanelHeader
              title="Indeks kepuasan masyarakat"
              desc={`dari ${survei.responden.toLocaleString("id-ID")} responden · skala 0-100`}
              action={
                <span className="inline-flex h-6 items-center rounded-[var(--adm-radius-sm)] bg-[var(--adm-accent-soft)] px-2 text-[12px] font-medium text-[var(--adm-accent)]">
                  Mutu {survei.mutu}
                </span>
              }
            />
            <div className="mt-4 flex items-baseline gap-1.5">
              <p className="font-heading text-[2.25rem] font-semibold leading-none tracking-tight tabular-nums text-[var(--adm-ink)]">
                {survei.ikm.toFixed(2)}
              </p>
              <span className="text-[13px] text-[var(--adm-muted)]">/ 100</span>
            </div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-[var(--adm-surface-2)]" aria-hidden>
              <div
                className="h-full origin-left rounded-full bg-[var(--adm-accent)]"
                style={{ transform: `scaleX(${(ikm / 100).toFixed(4)})` }}
              />
            </div>
            <p className="mt-3 text-[12px] text-[var(--adm-muted)]">
              Semakin tinggi nilainya, semakin baik persepsi layanan.
            </p>
          </Panel>
        ) : null}

        {/* Halaman terpopuler: baris bergaris, bukan kartu di dalam kartu. */}
        <Panel className="p-5">
          <PanelHeader
            title="Halaman terpopuler"
            desc="7 hari terakhir"
            action={
              <ActionLink href="/dashboard/statistik" variant="ghost" withArrow>
                Detail
              </ActionLink>
            }
          />
          {stats.halamanPopuler.length === 0 ? (
            <p className="mt-5 border-t border-dashed border-[var(--adm-rule)] pt-4 text-[13px] text-[var(--adm-muted)]">
              Belum ada kunjungan tercatat.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--adm-rule)]">
              {stats.halamanPopuler.slice(0, 5).map((h, i) => (
                <ListRow key={h.path}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-4 shrink-0 text-right text-[12px] tabular-nums text-[var(--adm-muted)]">
                      {i + 1}
                    </span>
                    <code className="truncate font-mono text-[12px] text-[var(--adm-ink-2)]">{h.path}</code>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      aria-hidden
                      className="hidden h-1 w-16 overflow-hidden rounded-full bg-[var(--adm-surface-2)] sm:block"
                    >
                      <span
                        className="block h-full origin-left rounded-full bg-[var(--adm-accent)] opacity-70"
                        style={{
                          transform: `scaleX(${Math.max(0.06, h.jumlah / maxHalaman).toFixed(4)})`,
                        }}
                      />
                    </span>
                    <span className="w-10 text-right text-[13px] tabular-nums text-[var(--adm-ink)]">
                      {h.jumlah.toLocaleString("id-ID")}
                    </span>
                  </div>
                </ListRow>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Aksi: satu tombol terisi, sisanya bergaris. */}
      <Panel className="p-5">
        <PanelHeader title="Aksi cepat" desc="Pengelolaan yang paling sering dipakai" />
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionLink href="/dashboard/statistik" variant="primary">
            Lihat Statistik
          </ActionLink>
          <ActionLink href="/dashboard/reservasi">Kelola Reservasi</ActionLink>
          <ActionLink href="/dashboard/subscriber">Kelola Subscriber</ActionLink>
          <ActionLink href="/dashboard/survei">Lihat Survei IKM</ActionLink>
          {isAdmin ? <ActionLink href="/dashboard/pengguna">Kelola User</ActionLink> : null}
        </div>
      </Panel>

      {/* Ekspor: tautan, bukan rentetan tombol. */}
      <Panel className="p-5">
        <PanelHeader title="Ekspor CSV" desc="Data mentah untuk diolah di spreadsheet" />
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <ExportLink href="/api/admin/ekspor?jenis=subscriber">Subscriber</ExportLink>
          <ExportLink href="/api/admin/ekspor?jenis=reservasi">Reservasi</ExportLink>
          <ExportLink href="/api/admin/ekspor?jenis=survei">Survei IKM</ExportLink>
        </div>
      </Panel>

      <p className="text-[12px] leading-relaxed text-[var(--adm-muted)]">
        Angka di halaman ini berasal dari database lokal (VisitorStat, RadioSubscriber,
        ServiceReservation, ServiceSurvey, Pengaduan). Konten berita dan pengumuman dikelola di
        Media Center HST, bukan di sini.
      </p>
    </div>
  );
}
