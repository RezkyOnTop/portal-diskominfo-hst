"use client";

import { useEffect, useState } from "react";

/**
 * useNavbarHide — sembunyikan navbar saat scroll ke bawah, munculkan saat
 * scroll ke atas. Threshold 80px: di bawah itu navbar selalu terlihat.
 *
 * - Mengembalikan `hidden` (boolean) + `scrolled` (melewati 24px, untuk
 *   gaya solid/transparan).
 * - Throttle via requestAnimationFrame: satu baca scrollY per frame.
 * - Hormati `prefers-reduced-motion`: tidak pernah menyembunyikan.
 * - `frozen`: saat true (mis. menu mobile terbuka), navbar dipaksa terlihat.
 */
export function useNavbarHide(frozen = false): {
  hidden: boolean;
  scrolled: boolean;
} {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return; // gerak dimatikan -> navbar statis

    let last = window.scrollY;
    let ticking = false;

    function update() {
      ticking = false;
      const y = window.scrollY;
      setScrolled(y > 24);
      if (frozen) {
        setHidden(false);
      } else if (y <= 80) {
        // Threshold: belum lewat 80px -> selalu terlihat.
        setHidden(false);
      } else if (y > last + 4) {
        // Scroll ke bawah -> sembunyikan (slide up + fade via CSS).
        setHidden(true);
      } else if (y < last - 4) {
        // Scroll ke atas -> munculkan kembali.
        setHidden(false);
      }
      last = y;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [frozen]);

  if (frozen && hidden) return { hidden: false, scrolled };
  return { hidden, scrolled };
}
