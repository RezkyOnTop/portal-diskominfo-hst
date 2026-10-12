"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * NavProgress — bilah tipis menyala di atas layar saat berpindah halaman.
 *
 * Urutan kerja di App Router: klik link -> URL berubah SEGERA (skeleton
 * `loading.tsx` tampil) -> data tiba belakangan. Karena itu selesainya
 * navigasi TIDAK bisa dideteksi dari perubahan URL saja — URL berubah di
 * awal, bukan di akhir.
 *
 * Deteksi akhir yang dipakai: kestabilan DOM `<main>`. Saat rute berganti,
 * konten berganti (mutasi). Ketika tidak ada mutasi lagi selama 400 ms,
 * navigasi dianggap selesai dan bilah dituntaskan ke 100% lalu memudar.
 * Navigasi kilat (< 150 ms tanpa mutasi berarti) tidak menampilkan apa pun
 * agar tidak berkedip. Batas aman 12 dtk menuntaskan paksa bila ada
 * streaming yang sangat lama.
 *
 * Semua `setState` dijalankan di dalam callback timer / observer, bukan
 * sinkron di badan efek.
 */
const TAMPIL_SETELAH_MS = 150;
const SELESAI_DIAM_MS = 400;
const PAKSA_SELESAI_MS = 12_000;

function Bilah() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const kunci = `${pathname}?${searchParams.toString()}`;

  const [lebar, setLebar] = useState<number | null>(null);
  const pertama = useRef(true);
  const diamTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tampilTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paksaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observer = useRef<MutationObserver | null>(null);

  function bersihkan() {
    if (diamTimer.current) clearTimeout(diamTimer.current);
    if (tampilTimer.current) clearTimeout(tampilTimer.current);
    if (paksaTimer.current) clearTimeout(paksaTimer.current);
    if (observer.current) {
      observer.current.disconnect();
      observer.current = null;
    }
    diamTimer.current = tampilTimer.current = paksaTimer.current = null;
  }

  useEffect(() => {
    // Muat awal: preloader yang bertugas, bukan bilah ini.
    if (pertama.current) {
      pertama.current = false;
      return;
    }

    let selesai = false;
    function tuntaskan() {
      if (selesai) return;
      selesai = true;
      bersihkan();
      // Satu tick agar setState tidak sinkron di badan efek.
      setTimeout(() => {
        setLebar(100);
        setTimeout(() => setLebar(null), 350);
      }, 0);
    }

    function jadwalDiam() {
      if (diamTimer.current) clearTimeout(diamTimer.current);
      diamTimer.current = setTimeout(tuntaskan, SELESAI_DIAM_MS);
    }

    // Tampilkan bilah hanya bila navigasi tidak selesai seketika.
    tampilTimer.current = setTimeout(() => {
      tampilTimer.current = null;
      if (selesai) return;
      setLebar(12);
      requestAnimationFrame(() => requestAnimationFrame(() => setLebar(88)));
    }, TAMPIL_SETELAH_MS);

    paksaTimer.current = setTimeout(tuntaskan, PAKSA_SELESAI_MS);

    const target = document.querySelector("main") ?? document.body;
    observer.current = new MutationObserver(jadwalDiam);
    observer.current.observe(target, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    jadwalDiam();

    return bersihkan;
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
