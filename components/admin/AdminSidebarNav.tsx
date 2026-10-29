"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  ClipboardList,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Radio,
  ScrollText,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Ikon dikirim sebagai NAMA (string), bukan komponen, karena daftar menu
 * disusun di server component, komponen fungsi tidak bisa diserialisasi
 * melewati batas server/client.
 */
const IKON = {
  dashboard: LayoutDashboard,
  statistik: BarChart3,
  radio: Radio,
  reservasi: CalendarCheck,
  pengaduan: Inbox,
  hero: ImageIcon,
  pegawai: Users,
  survei: ClipboardList,
  pengguna: UserCog,
  audit: ScrollText,
} satisfies Record<string, LucideIcon>;

export type NamaIkon = keyof typeof IKON;

export interface NavItem {
  href: string;
  label: string;
  icon: NamaIkon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const DUR = "duration-[var(--adm-dur-micro)]";

/**
 * Navigasi dashboard. Klien hanya karena `usePathname` (penanda menu aktif);
 * datanya disaring di server, jadi menu khusus Administrator tidak pernah
 * dikirim ke peramban akun Editor.
 *
 * Hallmark: label grup ditulis biasa (bukan kapital ber-tracking), state aktif
 * memakai latar lembut + garis aksen, bukan blok warna penuh.
 */
export function AdminSidebarNav({
  groups,
  variant = "sidebar",
}: {
  groups: NavGroup[];
  variant?: "sidebar" | "bar";
}) {
  const pathname = usePathname() ?? "";

  const aktif = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`);

  if (variant === "bar") {
    return (
      <nav
        aria-label="Navigasi dashboard"
        className="-mx-5 overflow-x-auto px-5 pb-2 lg:hidden"
      >
        <ul className="flex min-w-max items-center gap-1">
          {groups.flatMap((g) => g.items).map((item) => {
            const on = aktif(item.href);
            const Icon = IKON[item.icon];
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-[var(--adm-radius-sm)] px-2.5 text-[13px]",
                    `transition-colors ${DUR} motion-reduce:transition-none`,
                    on
                      ? "bg-[var(--adm-accent-soft)] font-medium text-[var(--adm-accent)]"
                      : "text-[var(--adm-ink-2)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Navigasi dashboard" className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-2 pb-1 text-[12px] text-[var(--adm-muted)]">{group.label}</p>
          <ul className="space-y-px">
            {group.items.map((item) => {
              const on = aktif(item.href);
              const Icon = IKON[item.icon];
              return (
                <li key={item.href} className="relative">
                  {/* Garis aksen kiri menandai halaman aktif. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-2 bottom-2 w-px",
                      on ? "bg-[var(--adm-accent)]" : "bg-transparent",
                    )}
                  />
                  <Link
                    href={item.href}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "group flex h-9 items-center gap-2.5 rounded-[var(--adm-radius-sm)] pl-2.5 pr-2 text-[13px]",
                      `transition-colors ${DUR} motion-reduce:transition-none`,
                      on
                        ? "bg-[var(--adm-accent-soft)] font-medium text-[var(--adm-accent)]"
                        : "text-[var(--adm-ink-2)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        on ? "text-[var(--adm-accent)]" : "text-[var(--adm-muted)]",
                      )}
                      aria-hidden
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
