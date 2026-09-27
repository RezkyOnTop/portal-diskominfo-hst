import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const CEPAT = [
  { href: "https://ppid.hstkab.go.id/", label: "PPID HST — Informasi Publik", external: true },
  { href: "https://opendata.hstkab.go.id/", label: "Open Data + ONE DATA HST", external: true },
  { href: "/pengumuman", label: "Pengumuman Resmi", external: false },
  { href: "/hoaks", label: "Cek Klarifikasi Hoaks", external: false },
];

export function Hero() {
  return (
    <section className="border-b border-neutral-200 bg-gradient-to-b from-primary-700 to-primary-600 text-white">
      <Container className="grid gap-8 py-14 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:py-20">
        <div className="space-y-5">
          <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Media Center &amp; Portal Informasi Publik
          </p>
          <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Dinas Komunikasi, Informatika, Statistik, dan Persandian
            <span className="block text-accent-500">Kabupaten Hulu Sungai Tengah</span>
          </h1>
          <p className="max-w-xl text-base text-white/90">
            Sumber informasi resmi daerah: berita, pengumuman, klarifikasi hoaks,
            layanan digital, dan siaran radio pemerintah daerah.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/berita"
              className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-primary-700 hover:bg-neutral-100"
            >
              Lihat Berita
            </Link>
            <Link
              href="/radio"
              className="rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Dengarkan Radio
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur">
          <SectionHeading as="h2" className="text-white">
            Layanan Cepat
          </SectionHeading>
          <ul className="mt-4 space-y-3 text-sm">
            {CEPAT.map((item) => (
              <li key={item.href}>
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3 font-medium hover:bg-white/20"
                  >
                    <span>{item.label}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3 font-medium hover:bg-white/20"
                  >
                    <span>{item.label}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
