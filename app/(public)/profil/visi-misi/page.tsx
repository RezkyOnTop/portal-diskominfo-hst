import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Visi & Misi",
  description:
    "Visi dan Misi Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Hulu Sungai Tengah.",
};

const MISI = [
  "Mewujudkan perubahan sosial masyarakat menuju masyarakat adaptif, berdaya saing dan berkualitas hidup tinggi yang religius berbudaya.",
  "Mewujudkan perubahan perekonomian daerah secara merata dengan pengembangan menyeluruh dari hulu dan hilirisasi pertanian serta sektor potensial pendukung dengan prinsip kerakyatan yang memperhatikan kesinambungan.",
  "Meningkatkan infrastruktur pelayanan publik yang merata dengan prinsip berkelanjutan dalam mendukung pengembangan sektor potensial perekonomian daerah dan pelayanan masyarakat.",
  "Mewujudkan pemerintahan yang tanggap dan santun dengan tata kelola profesional.",
];

export default function VisiMisiPage() {
  return (
    <>
      <PageHeader
        title="Visi & Misi"
        eyebrow="Profil"
        crumbs={[{ label: "Profil" }, { label: "Visi & Misi" }]}
      />
      <Container className="py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-xl font-bold text-neutral-900">Visi</h2>
          <blockquote className="mt-4 rounded-2xl border-l-4 border-primary-600 bg-primary-50 p-6 font-heading text-lg font-semibold text-primary-900">
            &ldquo;Terwujudnya Hulu Sungai Tengah yang Religius, Sejahtera,
            Bermartabat, Rahmatan Lil &lsquo;Alamin.&rdquo;
          </blockquote>

          <h2 className="mt-10 font-heading text-xl font-bold text-neutral-900">Misi</h2>
          <ol className="mt-4 space-y-4">
            {MISI.map((m, i) => (
              <li key={i} className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-neutral-700">{m}</p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </>
  );
}
