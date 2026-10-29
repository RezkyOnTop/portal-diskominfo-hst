import "./tokens.css";
import "./admin.css";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { SITE } from "@/lib/config";
import { AdminSidebarNav, type NavGroup } from "@/components/admin/AdminSidebarNav";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { default: "Dashboard", template: "%s · Dashboard Diskominfo SP HST" },
  robots: { index: false, follow: false },
};

async function logoutAction() {
  "use server";
  await signOut({ redirectTo: "/" });
}

const MENU_UTAMA: NavGroup = {
  label: "Ringkasan",
  items: [
    { href: "/dashboard", label: "Ringkasan", icon: "dashboard" },
    { href: "/dashboard/statistik", label: "Statistik kunjungan", icon: "statistik" },
  ],
};

const MENU_LAYANAN: NavGroup = {
  label: "Layanan dan konten",
  items: [
    { href: "/dashboard/subscriber", label: "Subscriber radio", icon: "radio" },
    { href: "/dashboard/reservasi", label: "Reservasi layanan", icon: "reservasi" },
    { href: "/dashboard/pengaduan", label: "Pengaduan dan aspirasi", icon: "pengaduan" },
    { href: "/dashboard/hero", label: "Slideshow hero", icon: "hero" },
    { href: "/dashboard/pegawai", label: "Data pegawai", icon: "pegawai" },
    { href: "/dashboard/survei", label: "Survei IKM", icon: "survei" },
  ],
};

const MENU_ADMIN: NavGroup = {
  label: "Administrasi",
  items: [
    { href: "/dashboard/pengguna", label: "Kelola user", icon: "pengguna" },
    { href: "/dashboard/audit", label: "Jejak audit", icon: "audit" },
  ],
};

function inisial(nama: string): string {
  const bagian = nama.trim().split(/\s+/).filter(Boolean);
  if (bagian.length === 0) return "?";
  if (bagian.length === 1) return bagian[0]!.slice(0, 2).toUpperCase();
  return (bagian[0]![0]! + bagian[bagian.length - 1]![0]!).toUpperCase();
}

/**
 * Layout area dashboard, kerangka mandiri (header + sidebar), tanpa navbar dan
 * footer publik. Penjagaan sesi dilakukan di sini (auth()), dengan pengalihan
 * awal di proxy.ts sebagai lapisan pertama.
 *
 * Token tampilan ada di `admin.css` (scope [data-admin], tema Hallmark: Dusk);
 * situs publik tetap memakai sistemnya sendiri di globals.css.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/masuk?callbackUrl=/dashboard");

  const isAdmin = session.user?.role === "ADMIN";
  const groups = isAdmin ? [MENU_UTAMA, MENU_LAYANAN, MENU_ADMIN] : [MENU_UTAMA, MENU_LAYANAN];
  const identitas = session.user?.name || session.user?.email || "Tanpa nama";

  return (
    <div data-admin className="min-h-screen bg-[var(--adm-paper)] text-[var(--adm-ink)]">
      <header className="sticky top-0 z-40 border-b border-[var(--adm-rule)] bg-[var(--adm-surface)]">
        <div className="mx-auto flex h-16 max-w-[88rem] items-center justify-between gap-4 px-5">
          <Link
            href="/dashboard"
            aria-label={`Dashboard ${SITE.shortName}`}
            className="flex min-w-0 items-center gap-3"
          >
            {/* Logo sama dengan situs publik: hitam di mode terang, putih di gelap. */}
            <Image
              src="/brand/logo-hitam.png"
              alt={`Logo ${SITE.shortName}`}
              width={185}
              height={54}
              priority
              className="block h-8 w-auto dark:hidden"
            />
            <Image
              src="/brand/logo-putih.png"
              alt=""
              width={185}
              height={54}
              priority
              className="hidden h-8 w-auto dark:block"
            />
            <span className="hidden border-l border-[var(--adm-rule)] pl-3 text-[12px] text-[var(--adm-muted)] sm:block">
              Dashboard
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-[13px] text-[var(--adm-ink-2)] underline decoration-transparent underline-offset-4 transition-colors duration-[var(--adm-dur-micro)] hover:decoration-current sm:inline motion-reduce:transition-none"
            >
              Lihat situs
            </Link>

            <span aria-hidden className="hidden h-6 w-px bg-[var(--adm-rule)] sm:block" />

            <AdminThemeToggle />

            <span aria-hidden className="hidden h-6 w-px bg-[var(--adm-rule)] sm:block" />

            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--adm-surface-2)] text-[11px] font-semibold text-[var(--adm-ink-2)]"
              >
                {inisial(identitas)}
              </span>
              <span className="hidden min-w-0 flex-col leading-tight md:flex">
                <span className="max-w-[11rem] truncate text-[13px] font-medium text-[var(--adm-ink)]">
                  {identitas}
                </span>
                <span className="text-[12px] text-[var(--adm-muted)]">
                  {isAdmin ? "Administrator" : "Editor"}
                </span>
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  aria-label="Keluar dari dashboard"
                  title="Keluar"
                  className="grid size-8 place-items-center rounded-[var(--adm-radius-sm)] text-[var(--adm-muted)] transition-colors duration-[var(--adm-dur-micro)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)] motion-reduce:transition-none"
                >
                  <LogOut className="size-4" aria-hidden />
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[88rem] px-5">
          <AdminSidebarNav groups={groups} variant="bar" />
        </div>
      </header>

      <div className="mx-auto flex max-w-[88rem] gap-8 px-5 py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24">
            <AdminSidebarNav groups={groups} />
            <p className="mt-4 border-t border-[var(--adm-rule)] pt-3 text-[12px] leading-relaxed text-[var(--adm-muted)]">
              Masuk sebagai {identitas}
            </p>
          </div>
        </aside>

        <main id="konten-utama" className="min-w-0 flex-1 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
