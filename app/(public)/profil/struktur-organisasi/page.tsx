import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Struktur Organisasi",
  description:
    "Struktur organisasi Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Hulu Sungai Tengah.",
};

/** Struktur organisasi (ringkas). */
const STRUKTUR = [
  { jabatan: "Kepala Dinas", level: 0 },
  { jabatan: "Sekretaris", level: 1 },
  { jabatan: "Bidang Informatika dan Persandian", level: 1 },
  { jabatan: "Bidang Komunikasi dan Informasi Publik", level: 1 },
  { jabatan: "Bidang Data dan Statistik", level: 1 },
  { jabatan: "Kelompok Jabatan Fungsional", level: 1 },
];

export default function StrukturOrganisasiPage() {
  return (
    <>
      <PageHeader
        title="Struktur Organisasi"
        eyebrow="Profil"
        crumbs={[{ label: "Profil" }, { label: "Struktur Organisasi" }]}
      >
        Susunan organisasi {SITE.shortName}.
      </PageHeader>
      <Container className="py-12">
        <ul className="mx-auto max-w-2xl space-y-3">
          {STRUKTUR.map((s) => (
            <li
              key={s.jabatan}
              className={
                s.level === 0
                  ? "rounded-xl bg-primary-600 px-5 py-4 text-center font-heading font-bold text-white"
                  : "ml-6 rounded-xl border border-neutral-200 bg-white px-5 py-3.5 text-sm font-medium text-neutral-800 shadow-[var(--shadow-card)]"
              }
            >
              {s.jabatan}
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
