import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/config";
import { MobileNav } from "@/components/layout/MobileNav";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="bg-primary-700 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs">
          <span className="font-medium">Portal Resmi Pemerintah Kabupaten Hulu Sungai Tengah</span>
          <a
            href={`mailto:${SITE.email}`}
            className="hover:underline"
          >
            {SITE.email}
          </a>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3" aria-label={`${SITE.name} — Beranda`}>
          <span
            aria-hidden="true"
            className="grid h-10 w-10 place-items-center rounded-lg bg-primary-600 text-sm font-bold text-white"
          >
            HST
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-heading text-sm font-bold text-neutral-900">
              Diskominfo SP
            </span>
            <span className="text-xs text-neutral-600">Hulu Sungai Tengah</span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
