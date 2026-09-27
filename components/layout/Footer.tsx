import Link from "next/link";
import { LAYANAN, NAV_LINKS, SITE } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-lg bg-primary-600 text-sm font-bold text-white"
            >
              HST
            </span>
            <span className="font-heading text-sm font-bold text-neutral-900">
              Diskominfo SP HST
            </span>
          </div>
          <p className="text-sm text-neutral-600">
            Dinas Komunikasi, Informatika, Statistik, dan Persandian Kabupaten Hulu
            Sungai Tengah.
          </p>
        </div>

        <nav aria-labelledby="footer-nav" className="space-y-3">
          <h2 id="footer-nav" className="font-heading text-sm font-bold text-neutral-900">
            Navigasi
          </h2>
          <ul className="space-y-2 text-sm text-neutral-600">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-primary-700">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-layanan" className="space-y-3">
          <h2 id="footer-layanan" className="font-heading text-sm font-bold text-neutral-900">
            Layanan Digital
          </h2>
          <ul className="space-y-2 text-sm text-neutral-600">
            {LAYANAN.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-700"
                >
                  {l.name} ↗
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3">
          <h2 className="font-heading text-sm font-bold text-neutral-900">Kontak</h2>
          <address className="space-y-2 text-sm not-italic text-neutral-600">
            <p>{SITE.address}</p>
            <p>
              <a href={`mailto:${SITE.email}`} className="hover:text-primary-700">
                {SITE.email}
              </a>
            </p>
            <p>Telp. {SITE.phone}</p>
          </address>
        </div>
      </div>
      <div className="border-t border-neutral-200 py-4">
        <p className="mx-auto max-w-6xl px-4 text-center text-xs text-neutral-600">
          © {new Date().getFullYear()} {SITE.name}. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}
