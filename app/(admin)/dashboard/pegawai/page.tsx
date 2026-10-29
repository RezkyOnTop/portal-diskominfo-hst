import { SectionHeading } from "@/components/ui/SectionHeading";
import { countStaff, listStaffAdmin } from "@/lib/services/staff";
import { UNIT_PEGAWAI } from "@/lib/validations/local.schema";
import { StaffCreateForm, StaffDirectory } from "./StaffForms";
import { ExportLink } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Data Pegawai" };

export default async function PegawaiAdminPage() {
  const [rows, counts] = await Promise.all([listStaffAdmin(), countStaff()]);
  const tersembunyi = rows.length - counts.total;

  return (
    <div className="space-y-6">
      <SectionHeading as="h1">Data Pegawai</SectionHeading>
      <p className="text-sm text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
        Data lokal (Staff). Tampil di halaman publik{" "}
        <code className="rounded bg-[var(--adm-surface-2)] px-1.5 py-0.5 text-xs bg-[var(--adm-surface-2)]">
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
        <ExportLink href="/api/admin/ekspor?jenis=pegawai">Ekspor CSV</ExportLink>
      </div>

      <StaffCreateForm />

      {/* Direktori: pencarian + daftar ringkas + dialog ubah per baris.
          Satu form per pegawai hanya dirender saat dialog dibuka, jadi
          halaman tetap ringan walau jumlah pegawai bertambah banyak. */}
      {rows.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-[var(--adm-rule)] bg-[var(--adm-surface)] p-6 text-sm text-[var(--adm-ink-2)] border-[var(--adm-rule)] bg-[var(--adm-surface)] text-[var(--adm-muted)]">
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
    <div className="rounded-[var(--radius-card)] border border-[var(--adm-rule)] bg-[var(--adm-surface)] p-4 shadow-[var(--shadow-card)] border-[var(--adm-rule)] bg-[var(--adm-surface)]">
      <p className="text-xs text-[var(--adm-ink-2)] text-[var(--adm-muted)]">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-[var(--adm-ink)]">
        {nilai.toLocaleString("id-ID")}
      </p>
    </div>
  );
}
