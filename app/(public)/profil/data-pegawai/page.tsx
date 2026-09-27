import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Data Pegawai",
  description:
    "Data pegawai Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Hulu Sungai Tengah.",
};

export default function DataPegawaiPage() {
  return (
    <>
      <PageHeader
        title="Data Pegawai"
        eyebrow="Profil"
        crumbs={[{ label: "Profil" }, { label: "Data Pegawai" }]}
      />
      <Container className="py-12">
        <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="text-sm text-neutral-600">
            Data pegawai dikelola secara internal. Untuk kebutuhan informasi
            kepegawaian, silakan hubungi Sekretariat Diskominfo SP HST.
          </p>
        </div>
      </Container>
    </>
  );
}
