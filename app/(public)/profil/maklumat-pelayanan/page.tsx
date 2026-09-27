import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Maklumat Pelayanan",
  description:
    "Maklumat pelayanan Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Hulu Sungai Tengah.",
};

const JANJI = [
  "Memberikan pelayanan yang cepat, tepat, dan akurat.",
  "Memberikan pelayanan dengan sikap ramah, sopan, dan tidak diskriminatif.",
  "Menyelenggarakan pelayanan sesuai standar operasional prosedur yang berlaku.",
  "Menerima dan menindaklanjuti keluhan, saran, dan masukan masyarakat.",
  "Tidak memungut biaya di luar ketentuan yang berlaku.",
];

export default function MaklumatPelayananPage() {
  return (
    <>
      <PageHeader
        title="Maklumat Pelayanan"
        eyebrow="Profil"
        crumbs={[{ label: "Profil" }, { label: "Maklumat Pelayanan" }]}
      />
      <Container className="py-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm leading-relaxed text-neutral-700">
            Dengan ini kami menyatakan sanggup menyelenggarakan pelayanan sesuai
            standar pelayanan yang telah ditetapkan dan apabila tidak menepati
            janji ini, kami siap menerima sanksi sesuai peraturan
            perundang-undangan.
          </p>
          <ul className="mt-6 space-y-3">
            {JANJI.map((j, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700"
              >
                <span aria-hidden="true" className="text-primary-600">
                  ✓
                </span>
                {j}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-neutral-600">
            Keluhan dapat disampaikan melalui email{" "}
            <a
              href={`mailto:${SITE.email}`}
              className="font-medium text-primary-700 hover:underline"
            >
              {SITE.email}
            </a>{" "}
            atau telepon {SITE.phone}.
          </p>
        </div>
      </Container>
    </>
  );
}
