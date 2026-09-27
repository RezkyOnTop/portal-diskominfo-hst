import Image from "next/image";
import Link from "next/link";
import { LAYANAN, LINK_TERKAIT, NAV_MENU, SITE, SOSIAL } from "@/lib/config";
import { SocialIcon } from "@/components/ui/SocialIcon";

export function Footer() {
  return (
    <footer className="mt-auto bg-neutral-900 text-neutral-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
        {/* Identitas */}
        <div className="space-y-4">
          <Image
            src="/brand/logo-putih.png"
            alt={`Logo ${SITE.shortName}`}
            width={185}
            height={54}
            className="h-10 w-auto"
          />
          <p className="text-sm leading-relaxed text-neutral-400">
            {SITE.fullName}. Media center, layanan informasi publik, dan radio
            pemerintah daerah.
          </p>
          <ul className="flex gap-2">
            {SOSIAL.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  title={s.name}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                  <SocialIcon name={s.name} brand />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Navigasi */}
        <nav aria-labelledby="footer-nav" className="space-y-3">
          <h2 id="footer-nav" className="font-heading text-sm font-bold text-white">
            Navigasi
          </h2>
          <ul className="space-y-2 text-sm">
            {NAV_MENU.map((l) => (
              <li key={l.label}>
                {l.href ? (
                  <Link href={l.href} className="text-neutral-400 hover:text-white">
                    {l.label}
                  </Link>
                ) : (
                  <span className="text-neutral-400">{l.label}</span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Layanan digital */}
        <nav aria-labelledby="footer-layanan" className="space-y-3">
          <h2 id="footer-layanan" className="font-heading text-sm font-bold text-white">
            Layanan Digital
          </h2>
          <ul className="space-y-2 text-sm">
            {LAYANAN.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-white"
                >
                  {l.name} ↗
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Kontak + tautan terkait */}
        <div className="space-y-3">
          <h2 className="font-heading text-sm font-bold text-white">Kontak</h2>
          <address className="space-y-2 text-sm not-italic text-neutral-400">
            <p>{SITE.address}</p>
            <p>
              <a href={`mailto:${SITE.email}`} className="hover:text-white">
                {SITE.email}
              </a>
            </p>
            <p>Telp. {SITE.phone}</p>
          </address>
          <h2 className="pt-2 font-heading text-sm font-bold text-white">
            Link Terkait
          </h2>
          <ul className="space-y-1.5 text-sm">
            {LINK_TERKAIT.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-white"
                >
                  {l.name} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <p className="mx-auto max-w-7xl px-4 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} {SITE.shortName}. Hak Cipta Dilindungi.
        </p>
      </div>
    </footer>
  );
}
