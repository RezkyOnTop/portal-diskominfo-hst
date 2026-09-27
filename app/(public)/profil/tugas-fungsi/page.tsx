import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Tugas & Fungsi",
  description:
    "Tugas dan fungsi Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Hulu Sungai Tengah.",
};

const TUGAS = [
  {
    title: "Bidang Informatika dan Persandian",
    items: [
      "Pengembangan sistem informasi dan aplikasi internal yang terintegrasi.",
      "Pengelolaan infrastruktur jaringan dan keamanan informasi.",
      "Penyelenggaraan persandian daerah.",
    ],
  },
  {
    title: "Bidang Komunikasi dan Informasi Publik",
    items: [
      "Pelayanan reservasi kegiatan dan permohonan publikasi.",
      "Pengelolaan media center dan kanal informasi publik.",
      "Kemitraan dengan media dan pengelolaan opini publik.",
    ],
  },
  {
    title: "Bidang Data dan Statistik",
    items: [
      "Pengelolaan, analisis, dan penyajian data statistik daerah.",
      "Pengembangan portal data terbuka (Open Data).",
      "Dukungan data untuk pengambilan kebijakan.",
    ],
  },
];

export default function TugasFungsiPage() {
  return (
    <>
      <PageHeader
        title="Tugas & Fungsi"
        eyebrow="Profil"
        crumbs={[{ label: "Profil" }, { label: "Tugas & Fungsi" }]}
      >
        Diskominfo SP HST menyelenggarakan urusan pemerintahan di bidang
        komunikasi dan informatika, statistik, serta persandian.
      </PageHeader>
      <Container className="py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {TUGAS.map((t) => (
            <div
              key={t.title}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)]"
            >
              <h2 className="font-heading text-base font-bold text-neutral-900">
                {t.title}
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                {t.items.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden="true" className="text-primary-600">
                      •
                    </span>
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
