import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { RadioControls } from "@/components/layout/RadioControls";
import { SubscriberForm } from "@/components/news/SubscriberForm";
import { RADIO_NAME, SITE } from "@/lib/config";

export const metadata = {
  title: "Radio Swara Murakata",
  description:
    "Streaming Radio Swara Murakata — radio pemerintah daerah Kabupaten Hulu Sungai Tengah.",
};

export default function RadioPage() {
  return (
    <>
      <PageHeader
        title={RADIO_NAME}
        eyebrow="Layanan"
        crumbs={[{ label: "Radio" }]}
      >
        Siaran radio pemerintah daerah. Pemutar tetap berjalan saat Anda berpindah
        halaman.
      </PageHeader>
      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-[var(--radius-card)] border border-neutral-200 bg-gradient-to-br from-primary-700 to-primary-800 p-6 text-white shadow-[var(--shadow-card)]">
            <h2 className="font-heading text-xl font-bold">Pemutar Siaran</h2>
            <p className="mt-1 text-sm text-white/80">Sumber: {SITE.shortName}</p>
            <div className="mt-6">
              <RadioControls />
            </div>
          </section>

          <section className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="font-heading text-xl font-bold text-neutral-900">
              Berlangganan Info Siaran
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Dapatkan informasi program dan agenda siaran {RADIO_NAME}.
            </p>
            <div className="mt-5">
              <SubscriberForm />
            </div>
          </section>
        </div>
      </Container>
    </>
  );
}
