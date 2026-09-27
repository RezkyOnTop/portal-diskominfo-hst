import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { SITE, SOSIAL, googleMapsEmbedUrl } from "@/lib/config";

export const metadata: Metadata = {
  title: "Kontak",
  description:
    "Kontak resmi Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Hulu Sungai Tengah.",
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
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="font-heading text-base font-bold text-neutral-900">
                Alamat
              </h2>
              <address className="mt-2 text-sm not-italic leading-relaxed text-neutral-600">
                {SITE.address}
              </address>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)]">
                <h2 className="font-heading text-base font-bold text-neutral-900">
                  Email
                </h2>
                <a
                  href={`mailto:${SITE.email}`}
                  className="mt-2 block text-sm font-medium text-primary-700 hover:underline"
                >
                  {SITE.email}
                </a>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)]">
                <h2 className="font-heading text-base font-bold text-neutral-900">
                  Telepon
                </h2>
                <p className="mt-2 text-sm text-neutral-600">{SITE.phone}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="font-heading text-base font-bold text-neutral-900">
                Ikuti Kami
              </h2>
              <ul className="mt-3 flex flex-wrap gap-3 text-sm">
                {SOSIAL.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-primary-50 px-3 py-1.5 font-medium text-primary-700 hover:bg-primary-100"
                    >
                      {s.name} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="min-h-[320px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[var(--shadow-card)]">
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
      </Container>
    </>
  );
}
