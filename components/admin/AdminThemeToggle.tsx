"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/layout/ThemeProvider";

/**
 * Tombol mode terang/gelap untuk header dashboard.
 *
 * Ikonnya ditukar lewat CSS (`.dark` di <html> sudah dipasang skrip
 * anti-flicker sebelum paint), jadi tidak ada setState di effect dan tidak ada
 * hydration mismatch. Persistensi ditangani ThemeProvider (localStorage).
 */
export function AdminThemeToggle() {
  const { toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti mode terang atau gelap"
      title="Ganti mode terang atau gelap"
      className="grid size-8 place-items-center rounded-[var(--adm-radius-sm)] text-[var(--adm-muted)] transition-colors duration-[var(--adm-dur-micro)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)] motion-reduce:transition-none"
    >
      <Moon className="size-4 dark:hidden" aria-hidden />
      <Sun className="hidden size-4 dark:block" aria-hidden />
    </button>
  );
}
