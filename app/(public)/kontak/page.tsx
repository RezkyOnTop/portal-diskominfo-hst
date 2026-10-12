import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { WeatherWidget } from "@/components/cuaca/WeatherWidget";
import { PengaduanForm } from "@/components/pengaduan/PengaduanForm";
import { CekStatusPengaduan } from "@/components/pengaduan/CekStatusPengaduan";
import { SITE, SOSIAL, googleMapsEmbedUrl, whatsappUrl } from "@/lib/config";

export const metadata: Metadata = {
  title: "Kontak",
  description:
    "Kontak resmi Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Hulu Sungai Tengah. Kirim pengaduan atau aspirasi lewat form daring.",
};

export default function KontakPage() {
  return (
    <>
      <PageHeader
        title="Kontak Kami"
        eyebrow="Hubungi"
        crumbs={[{ label: "Kontak" }]}
      />
      <Container className="py-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
              <h2 className="font-heading text-base font-bold text-neutral-900 dark:text-slate-50">
                Alamat
              </h2>
              <address className="mt-2 text-sm not-italic leading-relaxed text-neutral-600 dark:text-slate-400">
                {SITE.address}
              </address>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
                <h2 className="font-heading text-base font-bold text-neutral-900 dark:text-slate-50">
                  Email
                </h2>
                <a
                  href={`mailto:${SITE.email}`}
                  className="mt-2 block break-all text-sm font-medium text-primary-700 hover:underline dark:text-primary-300"
                >
                  {SITE.email}
                </a>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
                <h2 className="font-heading text-base font-bold text-neutral-900 dark:text-slate-50">
                  Telepon / WhatsApp
                </h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-slate-400">{SITE.phone}</p>
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-secondary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-secondary-700"
                >
                  💬 Chat WhatsApp
                </a>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
              <h2 className="font-heading text-base font-bold text-neutral-900 dark:text-slate-50">
                Ikuti Kami
              </h2>
              <ul className="mt-3 flex flex-wrap gap-3 text-sm">
                {SOSIAL.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-primary-50 px-3 py-1.5 font-medium text-primary-700 hover:bg-primary-100 dark:bg-primary-950/40 dark:text-primary-300"
                    >
                      {s.name} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="min-h-[320px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
            <iframe
              title="Peta lokasi Diskominfo SP HST"
              src={googleMapsEmbedUrl()}
              className="h-full min-h-[320px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

        {/* Pengaduan & aspirasi — warga tanpa email aktif tetap bisa menghubungi. */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
            <h2 className="font-heading text-xl font-bold text-neutral-900 dark:text-slate-50">
              Pengaduan &amp; Aspirasi
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-slate-400">
              Sampaikan keluhan, laporan, atau saran Anda. Tanda{" "}
              <span className="text-danger-600">*</span> wajib diisi. Setiap
              pengaduan mendapat <strong>kode lacak</strong> untuk memantau
              tanggapan petugas.
            </p>
            <div className="mt-6">
              <PengaduanForm />
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
              <h2 className="font-heading text-base font-bold text-neutral-900 dark:text-slate-50">
                Cek Status Pengaduan
              </h2>
              <p className="mt-1 mb-4 text-xs text-neutral-600 dark:text-slate-400">
                Masukkan kode lacak yang Anda terima saat mengirim pengaduan.
              </p>
              <CekStatusPengaduan />
            </div>

            <div className="rounded-2xl border border-primary-200 bg-primary-50 p-6 dark:border-primary-800 dark:bg-primary-950/40">
              <h3 className="font-heading text-sm font-bold text-neutral-900 dark:text-slate-50">
                Butuh respons cepat?
              </h3>
              <p className="mt-2 text-xs text-neutral-700 dark:text-slate-300">
                Hubungi petugas langsung lewat WhatsApp atau telepon pada jam
                kerja (Senin–Jumat, 08.00–16.00 WITA).
              </p>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-primary-700 underline hover:text-primary-800 dark:text-primary-300"
              >
                Chat WhatsApp →
              </a>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 dark:border-slate-700 dark:bg-slate-900/50">
              <h3 className="font-heading text-sm font-bold text-neutral-900 dark:text-slate-50">
                Kanal pengaduan lain
              </h3>
              <ul className="mt-3 space-y-1.5 text-xs text-neutral-600 dark:text-slate-300">
                <li>
                  <a
                    href="https://www.lapor.go.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary-700 underline dark:text-primary-300"
                  >
                    SP4N LAPOR!
                  </a>{" "}
                  — pengaduan lintas instansi
                </li>
                <li>
                  <a
                    href="https://ppid.hstkab.go.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary-700 underline dark:text-primary-300"
                  >
                    PPID HST
                  </a>{" "}
                  — permohonan informasi publik
                </li>
              </ul>
            </div>
          </aside>
        </div>

        {/* Cuaca wilayah kantor — sumber resmi BMKG */}
        <div className="mt-12">
          <h2 className="font-heading text-lg font-bold text-neutral-900 dark:text-slate-50">
            Cuaca Sekitar Kantor
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-slate-400">
            Prakiraan resmi BMKG untuk Kecamatan Barabai, Kabupaten Hulu Sungai
            Tengah.
          </p>
          <WeatherWidget className="mt-4" />
        </div>
      </Container>
    </>
  );
}
