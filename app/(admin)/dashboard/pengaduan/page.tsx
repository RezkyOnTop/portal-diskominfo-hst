import { SectionHeading } from "@/components/ui/SectionHeading";
import { listPengaduan, countPengaduan } from "@/lib/services/pengaduan";
import { formatDateTime } from "@/lib/utils/format";
import {
  LABEL_STATUS_PENGADUAN,
  STATUS_PENGADUAN,
  type StatusPengaduan,
} from "@/lib/validations/local.schema";
import { TanggapiForm } from "./TanggapiForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaduan & Aspirasi" };

/** Warna badge per status. */
function warnaStatus(status: string): string {
  switch (status) {
    case "DIPROSES":
      return "bg-warning-600/15 text-warning-700 dark:text-warning-300";
    case "SELESAI":
      return "bg-secondary-600/10 text-secondary-700 dark:text-secondary-300";
    default:
      return "bg-danger-600/10 text-danger-700 dark:text-danger-300";
  }
}

export default async function PengaduanAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter =
    typeof sp.status === "string" && (STATUS_PENGADUAN as readonly string[]).includes(sp.status)
      ? sp.status
      : undefined;

  const [rows, counts] = await Promise.all([
    listPengaduan(statusFilter),
    countPengaduan(),
  ]);

  const jumlah: Record<string, number> = {
    BARU: counts.baru,
    DIPROSES: counts.diproses,
    SELESAI: counts.selesai,
  };

  return (
    <div className="space-y-6">
      <SectionHeading as="h1">Pengaduan &amp; Aspirasi</SectionHeading>
      <p className="text-sm text-neutral-600 dark:text-slate-400">
        Data lokal (Pengaduan). Warga mengirim melalui form di halaman{" "}
        <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
          /kontak
        </code>
        . Tanggapan Anda tampil ke pengadu lewat cek status.
      </p>

      {/* Kartu ringkasan */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kartu label="Total" nilai={counts.total} />
        <Kartu label="Baru" nilai={counts.baru} />
        <Kartu label="Diproses" nilai={counts.diproses} />
        <Kartu label="Selesai" nilai={counts.selesai} />
      </div>

      {/* Filter status */}
      <nav aria-label="Filter status" className="flex flex-wrap gap-2">
        <FilterChip label={`Semua (${counts.total})`} href="/dashboard/pengaduan" aktif={!statusFilter} />
        {STATUS_PENGADUAN.map((s) => (
          <FilterChip
            key={s}
            label={`${LABEL_STATUS_PENGADUAN[s as StatusPengaduan]} (${jumlah[s] ?? 0})`}
            href={`/dashboard/pengaduan?status=${s}`}
            aktif={statusFilter === s}
          />
        ))}
      </nav>

      <div className="flex flex-wrap gap-3">
        <a
          href="/api/admin/ekspor?jenis=pengaduan"
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ⬇ Ekspor CSV
        </a>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-neutral-200 bg-white p-6 text-sm text-neutral-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Belum ada pengaduan{statusFilter ? " dengan status ini" : ""}.
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-bold tracking-wider text-neutral-900 dark:text-slate-50">
                    {r.kode}
                  </p>
                  <p className="mt-1 font-medium text-neutral-900 dark:text-slate-100">
                    {r.nama}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-600 dark:text-slate-400">
                    {r.kontak} · {formatDateTime(r.createdAt)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${warnaStatus(r.status)}`}
                >
                  {LABEL_STATUS_PENGADUAN[r.status as StatusPengaduan] ?? r.status}
                </span>
              </div>

              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <Field label="Kategori" value={r.kategori} />
                <Field label="Diajukan" value={formatDateTime(r.createdAt)} />
              </dl>

              <div className="mt-3 rounded-lg bg-neutral-50 p-3 dark:bg-slate-800/60">
                <p className="text-xs font-semibold text-neutral-600 dark:text-slate-400">
                  Isi pengaduan
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700 dark:text-slate-300">
                  {r.isi}
                </p>
              </div>

              <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-slate-800">
                <TanggapiForm id={r.id} status={r.status} tanggapan={r.tanggapan} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Kartu({ label, nilai }: { label: string; nilai: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs text-neutral-600 dark:text-slate-400">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-neutral-900 dark:text-slate-50">
        {nilai.toLocaleString("id-ID")}
      </p>
    </div>
  );
}

function FilterChip({
  label,
  href,
  aktif,
}: {
  label: string;
  href: string;
  aktif: boolean;
}) {
  return (
    <a
      href={href}
      aria-current={aktif ? "page" : undefined}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
        aktif
          ? "bg-primary-600 text-white"
          : "border border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {label}
    </a>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-neutral-500 dark:text-slate-400">{label}</dt>
      <dd className="font-medium text-neutral-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}
