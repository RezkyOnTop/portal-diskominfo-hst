import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { BIDANG, LAYANAN } from "@/lib/config";

export const metadata: Metadata = {
  title: "Daftar Layanan",
  description:
    "Daftar layanan Diskominfo SP Kabupaten Hulu Sungai Tengah dan layanan digital terkait.",
};

export default function LayananPage() {
  return (
    <>
      <PageHeader
        title="Daftar Layanan"
        eyebrow="Layanan"
        crumbs={[{ label: "Layanan" }, { label: "Daftar Layanan" }]}
      >
        Layanan bidang dan layanan digital Diskominfo SP HST.
      </PageHeader>

      <Container className="py-12">
        <h2 className="font-heading text-xl font-bold text-neutral-900">
          Layanan Bidang
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BIDANG.map((b) => (
            <div
              key={b.name}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)]"
            >
              <h3 className="font-heading text-base font-bold text-neutral-900">
                {b.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {b.description}
              </p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 font-heading text-xl font-bold text-neutral-900">
          Layanan Digital Terkait
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {LAYANAN.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary-300"
            >
              <span>
                <span className="font-semibold text-neutral-900">{l.name}</span>
                <span className="mt-1 block text-sm text-neutral-600">
                  {l.description}
                </span>
              </span>
              <span aria-hidden="true" className="text-primary-600">
                ↗
              </span>
            </a>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/reservasi"
            className="inline-flex rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Ajukan Reservasi Layanan
          </Link>
          <Link
            href="/reservasi/status"
            className="inline-flex rounded-lg border border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Cek Status Reservasi
          </Link>
          <Link
            href="/radio"
            className="inline-flex rounded-lg border border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Dengarkan Radio Swara Murakata
          </Link>
        </div>
      </Container>
    </>
  );
}
