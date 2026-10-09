import { SectionHeading } from "@/components/ui/SectionHeading";
import { countStaff, listStaffAdmin } from "@/lib/services/staff";
import { UNIT_PEGAWAI } from "@/lib/validations/local.schema";
import { StaffCreateForm, StaffDirectory } from "./StaffForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Data Pegawai" };

export default async function PegawaiAdminPage() {
  const [rows, counts] = await Promise.all([listStaffAdmin(), countStaff()]);
  const tersembunyi = rows.length - counts.total;

  return (
    <div className="space-y-6">
      <SectionHeading as="h1">Data Pegawai</SectionHeading>
      <p className="text-sm text-neutral-600 dark:text-slate-400">
        Data lokal (Staff). Tampil di halaman publik{" "}
        <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
          /profil/data-pegawai
        </code>
        . Foto yang belum diunggah memakai avatar inisial sebagai gambar default.
      </p>

      {/* Kartu ringkasan */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kartu label="Tampil di publik" nilai={counts.total} />
        {UNIT_PEGAWAI.slice(0, 2).map((u) => (
          <Kartu key={u} label={u} nilai={counts.perUnit[u] ?? 0} />
        ))}
        <Kartu label="Disembunyikan" nilai={tersembunyi} />
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href="/api/admin/ekspor?jenis=pegawai"
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ⬇ Ekspor CSV
        </a>
      </div>

      <StaffCreateForm />

      {/* Direktori: pencarian + daftar ringkas + dialog ubah per baris.
          Satu form per pegawai hanya dirender saat dialog dibuka, jadi
          halaman tetap ringan walau jumlah pegawai bertambah banyak. */}
      {rows.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-neutral-200 bg-white p-6 text-sm text-neutral-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Belum ada data pegawai. Tambahkan lewat formulir di atas.
        </p>
      ) : (
        <section aria-label="Daftar pegawai">
          <StaffDirectory rows={rows} />
        </section>
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
