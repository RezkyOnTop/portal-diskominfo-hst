"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * NavProgress — bilah tipis menyala di atas layar saat berpindah halaman.
 *
 * Alur: klik link internal -> tunggu 150 ms (agar navigasi kilat tidak
 * berkedip) -> bilah muncul 12% lalu meluncur ke 88% -> saat rute baru tiba,
 * bilah dituntaskan ke 100% lalu memudar.
 *
 * Semua `setState` dijalankan di dalam callback timer / event, bukan sinkron
 * di badan efek, sehingga tidak memicu render beruntun.
 */
function Bilah() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const kunci = `${pathname}?${searchParams.toString()}`;

  const [lebar, setLebar] = useState<number | null>(null);
  const timerMulai = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerSelesai = useRef<ReturnType<typeof setTimeout> | null>(null);
  // true = navigasi sedang berjalan (klik sudah terjadi, rute belum tiba).
  const menunggu = useRef(false);
  // true = bilah benar-benar sudah tampil (navigasi tidak selesai seketika).
  const tampil = useRef(false);

  // Fase 1 — dengarkan klik link internal.
  useEffect(() => {
    function mulai(e: MouseEvent) {
      // Hanya navigasi internal biasa: klik kiri, tanpa modifier, bukan
      // target baru, bukan anchor hash / lintas-origin / unduhan.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const tujuan = new URL(a.href, location.href);
      if (tujuan.origin !== location.origin) return;
      if (tujuan.pathname === location.pathname && tujuan.search === location.search) {
        return;
      }
      if (menunggu.current) return;
      menunggu.current = true;
      timerMulai.current = setTimeout(() => {
        timerMulai.current = null;
        tampil.current = true;
        setLebar(12);
        requestAnimationFrame(() => requestAnimationFrame(() => setLebar(88)));
      }, 150);
    }

    function batal() {
      menunggu.current = false;
      tampil.current = false;
      if (timerMulai.current) {
        clearTimeout(timerMulai.current);
        timerMulai.current = null;
      }
      setLebar(null);
    }

    document.addEventListener("click", mulai, true);
    window.addEventListener("popstate", batal);
    window.addEventListener("pagehide", batal);
    return () => {
      document.removeEventListener("click", mulai, true);
      window.removeEventListener("popstate", batal);
      window.removeEventListener("pagehide", batal);
      if (timerMulai.current) clearTimeout(timerMulai.current);
      if (timerSelesai.current) clearTimeout(timerSelesai.current);
    };
  }, []);

  // Fase 2 — rute baru tiba.
  useEffect(() => {
    if (!menunggu.current) return;
    menunggu.current = false;
    if (timerMulai.current) {
      clearTimeout(timerMulai.current);
      timerMulai.current = null;
    }
    // Navigasi selesai sebelum bilah sempat tampil -> tidak usah menampilkan
    // apa pun (menghindari kedipan).
    if (!tampil.current) return;
    // Ditunda satu tick agar setState tidak sinkron di badan efek.
    const t = setTimeout(() => {
      setLebar(100);
      timerSelesai.current = setTimeout(() => {
        tampil.current = false;
        setLebar(null);
      }, 350);
    }, 0);
    return () => clearTimeout(t);
  }, [kunci]);

  return (
    <div
      aria-hidden="true"
      className={lebar === null ? "nav-progress" : "nav-progress nav-progress--tampil"}
    >
      <div className="nav-progress__bar" style={{ width: `${lebar ?? 0}%` }} />
    </div>
  );
}

export function NavProgress() {
  return (
    <Suspense fallback={null}>
      <Bilah />
    </Suspense>
  );
}
