"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_MENU, SITE, SOSIAL } from "@/lib/config";
import { MobileNav } from "@/components/layout/MobileNav";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NavSearch } from "@/components/layout/NavSearch";
import { useNavbarHide } from "@/components/layout/useNavbarHide";
import { cn } from "@/lib/utils/cn";

/**
 * Navbar dengan mega-menu. Transparan di atas hero pada beranda, lalu
 * berubah solid saat halaman di-scroll. Dropdown dapat diakses keyboard.
 *
 * Scroll ke bawah -> navbar menyembur naik (slide up + fade); scroll ke atas
 * -> muncul lagi. Di <=80px dari atas selalu terlihat (lihat useNavbarHide).
 */
export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [menuMobileTerbuka, setMenuMobileTerbuka] = useState(false);

  const isHome = pathname === "/";
  // Saat menu mobile terbuka, jangan pernah sembunyikan navbar.
  const { hidden, scrolled } = useNavbarHide(menuMobileTerbuka);

  const solid = scrolled || !isHome;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[translate,opacity,background-color,border-color] duration-300 ease-out motion-reduce:transition-none",
        hidden ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100",
        solid
          ? "border-b border-neutral-200 bg-white/95 text-neutral-900 backdrop-blur"
          : "bg-transparent text-white",
      )}
    >
      {/* Top bar */}
      <div
        className={cn(
          "hidden border-b text-xs transition-colors md:block",
          solid
            ? "border-neutral-200 bg-neutral-50 text-neutral-600"
            : "border-white/15 bg-black/20 text-white/85",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-1.5">
          <span className="font-medium">
            Portal Resmi Pemerintah Kabupaten Hulu Sungai Tengah
          </span>
          <div className="flex items-center gap-4">
            <a href={`mailto:${SITE.email}`} className="hover:underline">
              {SITE.email}
            </a>
            <span aria-hidden="true" className="opacity-40">
              |
            </span>
            <span>Telp. {SITE.phone}</span>
            <span aria-hidden="true" className="opacity-40">
              |
            </span>
            <ul className="flex items-center gap-1">
              {SOSIAL.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    title={s.name}
                    className="grid h-6 w-6 place-items-center rounded-full transition-transform hover:scale-110"
                  >
                    <SocialIcon name={s.name} className="h-3.5 w-3.5" brand />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Baris utama */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label={`${SITE.shortName} — Beranda`}
        >
          <Image
            src={solid ? "/brand/logo-hitam.png" : "/brand/logo-putih.png"}
            alt={`Logo ${SITE.shortName}`}
            width={185}
            height={54}
            priority
            className="h-9 w-auto sm:h-11"
          />
        </Link>

        {/* Navigasi desktop */}
        <nav aria-label="Navigasi utama" className="hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {NAV_MENU.map((item) => {
              const active =
                item.href === pathname ||
                (item.href && item.href !== "/" && pathname.startsWith(item.href));
              if (!item.children) {
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href ?? "/"}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                        solid
                          ? active
                            ? "bg-primary-50 text-primary-700"
                            : "text-neutral-700 hover:bg-primary-50 hover:text-primary-700"
                          : active
                            ? "bg-white/20 text-white"
                            : "text-white/90 hover:bg-white/15 hover:text-white",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              }
              return (
                <li
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpen(item.label)}
                  onMouseLeave={() => setOpen(null)}
                >
                  <button
                    type="button"
                    aria-expanded={open === item.label}
                    aria-haspopup="true"
                    onClick={() =>
                      setOpen((v) => (v === item.label ? null : item.label))
                    }
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                      solid
                        ? "text-neutral-700 hover:bg-primary-50 hover:text-primary-700"
                        : "text-white/90 hover:bg-white/15 hover:text-white",
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "text-[10px] transition-transform",
                        open === item.label && "rotate-180",
                      )}
                    >
                      ▾
                    </span>
                  </button>
                  {open === item.label ? (
                    <div className="absolute left-0 top-full z-50 w-64 pt-2">
                      <ul className="overflow-hidden rounded-xl border border-neutral-200 bg-white py-1.5 shadow-xl">
                        {item.children.map((child) => (
                          <li key={child.label}>
                            {child.external ? (
                              <a
                                href={child.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700"
                              >
                                {child.label}
                                <span aria-hidden="true" className="text-xs opacity-60">
                                  ↗
                                </span>
                              </a>
                            ) : (
                              <Link
                                href={child.href ?? "#"}
                                onClick={() => setOpen(null)}
                                className="block px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700"
                              >
                                {child.label}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <NavSearch solid={solid} />
          <ThemeToggle solid={solid} />
          <MobileNav solid={solid} onOpenChange={setMenuMobileTerbuka} />
        </div>
      </div>
    </header>
  );
}
