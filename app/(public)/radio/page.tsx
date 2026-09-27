import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RadioControls } from "@/components/layout/RadioControls";
import { SubscriberForm } from "@/components/news/SubscriberForm";
import { SITE } from "@/lib/config";

export const metadata = {
  title: "Radio HST",
  description:
    "Streaming radio pemerintah daerah Kabupaten Hulu Sungai Tengah (Radio HST).",
};

export default function RadioPage() {
  return (
    <Container className="py-10">
      <SectionHeading as="h1">Radio HST</SectionHeading>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">
        Siaran radio pemerintah daerah. Pemutar tetap berjalan saat Anda berpindah
        halaman.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-[var(--radius-card)] border border-neutral-200 bg-gradient-to-br from-primary-700 to-primary-800 p-6 text-white shadow-[var(--shadow-card)]">
          <h2 className="font-heading text-xl font-bold">Pemutar Siaran</h2>
          <p className="mt-1 text-sm text-white/80">
            Sumber: {SITE.name}
          </p>
          <div className="mt-6">
            <RadioControls />
          </div>
        </section>

        <section className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-heading text-xl font-bold text-neutral-900">
            Berlangganan Info Siaran
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Dapatkan informasi program dan agenda siaran Radio HST.
          </p>
          <div className="mt-5">
            <SubscriberForm />
          </div>
        </section>
      </div>
    </Container>
  );
}
