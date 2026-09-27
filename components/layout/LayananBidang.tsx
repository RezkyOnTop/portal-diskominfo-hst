import Link from "next/link";
import { BIDANG } from "@/lib/config";

const ICONS: Record<string, string> = {
  code: "M8 6l-5 6 5 6M16 6l5 6-5 6",
  megaphone: "M3 11l14-6v14L3 13v-2zM7 13v4a2 2 0 004 0",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
};

/** Section Layanan Kami — tiga bidang Diskominfo SP HST. */
export function LayananBidang() {
  return (
    <section className="bg-neutral-50 py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
            Layanan Kami
          </p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
            Layanan Bidang
          </h2>
          <p className="mt-3 text-neutral-600">
            Layanan Dinas Komunikasi, Informatika, Statistik dan Persandian
            Kabupaten Hulu Sungai Tengah.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {BIDANG.map((b) => (
            <div
              key={b.name}
              className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-[var(--shadow-card-hover)]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-50 text-primary-600">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={ICONS[b.icon]} />
                </svg>
              </span>
              <h3 className="mt-4 font-heading text-lg font-bold text-neutral-900">
                {b.name}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">
                {b.description}
              </p>
              <Link
                href="/layanan"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:gap-2 hover:text-primary-700"
              >
                Selengkapnya <span aria-hidden="true">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
