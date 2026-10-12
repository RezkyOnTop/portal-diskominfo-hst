"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * HeroSlideshow — foto Kabupaten HST bergerak otomatis (auto-rotate).
 * Menghormati prefers-reduced-motion (tidak auto-play bila diminta).
 * Klik indikator untuk pindah slide; ada tombol jeda.
 *
 * Daftar slide datang dari prop (dikelola admin lewat /dashboard/hero).
 * Bila prop kosong, dipakai foto bawaan di public/brand sebagai cadangan.
 *
 * Performa: hanya slide aktif (+1 tetangga berikutnya, prefetch halus) yang
 * me-render <Image>, sehingga browser tidak mengunduh semua foto sekaligus.
 * Tanpa ini, 6 foto (~300 KB di HP – ~1,3 MB di layar besar) diunduh di awal
 * dan beranda terasa lelet.
 */
export interface SlideHero {
  src: string;
  label: string;
}

const SLIDES_BAWAAN: SlideHero[] = [
  { src: "/brand/carousel-1.jpg", label: "Monumen Kabupaten Hulu Sungai Tengah" },
  { src: "/brand/carousel-2.jpg", label: "Kantor Pemerintah Kabupaten Hulu Sungai Tengah" },
  { src: "/brand/hst-aktivitas-1.jpg", label: "Kegiatan masyarakat Hulu Sungai Tengah" },
  { src: "/brand/hst-aktivitas-2.jpg", label: "Pasar murah di Hulu Sungai Tengah" },
  { src: "/brand/hst-aktivitas-3.jpg", label: "Upacara di Hulu Sungai Tengah" },
  { src: "/brand/hst-aktivitas-4.jpg", label: "Aktivitas pemerintahan Hulu Sungai Tengah" },
];

const INTERVAL = 4500;

export function HeroSlideshow({ slides }: { slides?: SlideHero[] }) {
  const daftar = slides && slides.length > 0 ? slides : SLIDES_BAWAAN;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) setPlaying(false);
  }, []);

  // Indeks selalu di-clamp saat render (lihat `aktif`), jadi tidak perlu
  // menyelaraskan state lewat efek saat jumlah slide berubah.

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % daftar.length);
  }, [daftar.length]);

  useEffect(() => {
    if (!playing || reduced.current) return;
    const t = setInterval(next, INTERVAL);
    return () => clearInterval(t);
  }, [playing, next]);

  const aktif = index < daftar.length ? index : 0;
  // Prefetch halus: slide berikutnya ikut dimuat agar transisi tidak kedip,
  // tetapi tidak semua slide sekaligus.
  const perluMuat = new Set([aktif, (aktif + 1) % daftar.length]);

  return (
    <div className="hero-glass relative overflow-hidden rounded-[var(--radius-card)] p-2 shadow-2xl">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-900">
        {daftar.map((s, i) => (
          <div
            key={s.src}
            aria-hidden={i !== aktif}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              i === aktif ? "opacity-100" : "opacity-0"
            }`}
          >
            {perluMuat.has(i) ? (
              <Image
                src={s.src}
                alt=""
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 45vw"
                className={`object-cover transition-transform duration-[6000ms] ease-out ${
                  i === aktif ? "scale-105" : "scale-100"
                }`}
              />
            ) : null}
          </div>
        ))}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent"
        />

        {/* Kontrol putar/jeda */}
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Jeda slideshow" : "Putar slideshow"}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Indikator */}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {daftar.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Tampilkan ${s.label}`}
              aria-current={i === aktif}
              className={`h-1.5 rounded-full transition-all ${
                i === aktif ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
