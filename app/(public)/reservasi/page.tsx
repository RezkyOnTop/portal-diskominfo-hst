import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { ReservasiForm } from "@/components/reservasi/ReservasiForm";
import { SITE, JAM_LAYANAN } from "@/lib/config";
import { LAYANAN_RESERVASI } from "@/lib/validations/local.schema";

export const metadata: Metadata = {
  title: "Reservasi Layanan",
  description:
    "Ajukan permohonan kunjungan/studi tiru, publikasi, penggunaan aula, narasumber, atau peminjaman peralatan multimedia di Diskominfo SP Kabupaten Hulu Sungai Tengah.",
};

/** Keterangan singkat tiap jenis layanan yang bisa direservasi. */
const KETERANGAN_LAYANAN: Record<string, string> = {
  "Kunjungan / Studi Tiru":
    "Kunjungan instansi, sekolah, atau komunitas untuk mempelajari layanan dan tata kelola Diskominfo SP HST.",
  "Permohonan Publikasi & Dokumentasi":
    "Peliputan, publikasi, atau dokumentasi kegiatan instansi di kanal Media Center HST.",
  "Penggunaan Aula / Ruang Rapat":
    "Peminjaman aula atau ruang rapat untuk kegiatan rapat, sosialisasi, atau pelatihan.",
  "Permohonan Narasumber / Pemateri":
    "Permintaan narasumber untuk kegiatan literasi digital, kehumasan, atau bidang TIK.",
  "Peminjaman Peralatan Multimedia":
    "Peminjaman peralatan seperti proyektor, sound system, atau kamera untuk kegiatan resmi.",
};

export default function ReservasiPage() {
  return (
    <>
      <PageHeader
        title="Reservasi Layanan"
        eyebrow="Layanan Publik"
        crumbs={[{ label: "Layanan", href: "/layanan" }, { label: "Reservasi" }]}
      >
        Ajukan permohonan kunjungan, publikasi, penggunaan aula, narasumber, atau
        peminjaman peralatan. Setiap permohonan mendapat <strong>kode lacak</strong>{" "}
        yang bisa dipakai untuk memantau status.
      </PageHeader>

      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
            <h2 className="font-heading text-xl font-bold text-neutral-900 dark:text-slate-50">
              Formulir Permohonan
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-slate-300">
              Isi data berikut. Tanda <span className="text-danger-600">*</span> wajib
              diisi. Ajukan minimal <strong>1 hari sebelum</strong> kegiatan.
            </p>
            <div className="mt-6">
              <ReservasiForm />
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
              <h2 className="font-heading text-base font-bold text-neutral-900 dark:text-slate-50">
                Jenis Layanan
              </h2>
              <ul className="mt-4 space-y-3">
                {LAYANAN_RESERVASI.map((l) => (
                  <li key={l}>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-slate-100">
                      {l}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-600 dark:text-slate-400">
                      {KETERANGAN_LAYANAN[l]}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[var(--radius-card)] border border-primary-200 bg-primary-50 p-6 dark:border-primary-800 dark:bg-primary-950/40">
              <h3 className="font-heading text-sm font-bold text-neutral-900 dark:text-slate-50">
                Sudah mengajukan?
              </h3>
              <p className="mt-2 text-xs text-neutral-700 dark:text-slate-300">
                Cek status permohonan Anda dengan kode lacak yang Anda terima.
              </p>
              <Link
                href="/reservasi/status"
                className="mt-3 inline-block text-sm font-semibold text-primary-700 underline hover:text-primary-800 dark:text-primary-300"
              >
                Cek Status Reservasi →
              </Link>
            </div>

            <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-neutral-50 p-6 dark:border-slate-700 dark:bg-slate-900/50">
              <h3 className="font-heading text-sm font-bold text-neutral-900 dark:text-slate-50">
                Butuh bantuan?
              </h3>
              <ul className="mt-3 space-y-1.5 text-xs text-neutral-600 dark:text-slate-300">
                <li>Telepon: {SITE.phone}</li>
                <li>Email: {SITE.email}</li>
                <li>Jam layanan: {JAM_LAYANAN.lengkap}</li>
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
