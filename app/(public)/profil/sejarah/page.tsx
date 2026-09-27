import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Sejarah",
  description:
    "Sejarah Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Hulu Sungai Tengah.",
};

export default function SejarahPage() {
  return (
    <>
      <PageHeader
        title="Sejarah"
        eyebrow="Profil"
        crumbs={[{ label: "Profil" }, { label: "Sejarah" }]}
      />
      <Container className="py-12">
        <div className="prose-berita mx-auto max-w-3xl">
          <p>
            Dinas Komunikasi, Informatika, Statistik dan Persandian (Diskominfo SP)
            Kabupaten Hulu Sungai Tengah merupakan perangkat daerah yang
            dibentuk untuk menyelenggarakan urusan pemerintahan di bidang
            komunikasi dan informatika, statistik, serta persandian.
          </p>
          <p>
            Seiring perkembangan kebutuhan tata kelola pemerintahan digital,
            peran Diskominfo SP semakin strategis sebagai penggerak transformasi
            digital daerah, pengelola informasi publik, serta penyedia data
            statistik yang akurat dan akuntabel.
          </p>
          <p>
            Melalui Media Center HST, portal Open Data, PPID, dan Radio Swara
            Murakata, Diskominfo SP HST berkomitmen menghadirkan layanan
            informasi yang cepat, transparan, dan mudah diakses oleh seluruh
            masyarakat.
          </p>
        </div>
      </Container>
    </>
  );
}
