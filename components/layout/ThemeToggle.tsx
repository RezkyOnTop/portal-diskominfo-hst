"use client";

import { useTheme } from "@/components/layout/ThemeProvider";
import { cn } from "@/lib/utils/cn";

/**
 * ThemeToggle — tombol ganti mode terang/gelap.
 *
 * Ikon ditukar lewat CSS (kelas .dark di <html>, dipasang skrip anti-flicker
 * sebelum paint), jadi tidak ada hydration mismatch maupun setState di effect.
 */
export function ThemeToggle({ solid = true }: { solid?: boolean }) {
  const { toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti mode terang/gelap"
      title="Ganti mode terang/gelap"
      className={cn(
        "grid h-9 w-9 place-items-center rounded-lg border transition-colors",
        solid
          ? "border-neutral-200 text-neutral-700 hover:bg-neutral-100"
          : "border-neutral-900/15 text-neutral-700 hover:bg-neutral-900/10 dark:border-white/30 dark:text-white dark:hover:bg-white/15",
      )}
    >
      {/* Mode terang → tampilkan ikon bulan (aksi: ke gelap) */}
      <svg
        className="dark:hidden"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
      </svg>
      {/* Mode gelap → tampilkan ikon matahari (aksi: ke terang) */}
      <svg
        className="hidden dark:block"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
