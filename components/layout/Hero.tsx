"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { HERO } from "@/lib/config";
import { cn } from "@/lib/utils/cn";

const SLIDES = [
  { src: "/brand/carousel-1.jpg", alt: "Monumen Kabupaten Hulu Sungai Tengah" },
  { src: "/brand/carousel-2.jpg", alt: "Kantor Pemerintah Kabupaten Hulu Sungai Tengah" },
];

/**
 * Hero carousel dengan foto asli daerah. Autoplay, kontrol manual,
 * indikator, dan menghormati prefers-reduced-motion.
 */
export function Hero() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 7000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative isolate -mt-[var(--header-h)] flex min-h-[92vh] items-center overflow-hidden bg-primary-950 pt-[var(--header-h)] text-white">
      {SLIDES.map((s, idx) => (
        <div
          key={s.src}
          aria-hidden={idx !== i}
          className={cn(
            "absolute inset-0 -z-10 transition-opacity duration-1000",
            idx === i ? "opacity-100" : "opacity-0",
          )}
        >
          <Image
            src={s.src}
            alt={s.alt}
            fill
            priority={idx === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}
      {/* Overlay gradien agar teks terbaca (WCAG AA). */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-950/85 via-primary-950/70 to-primary-950/90"
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-24 text-center">
        <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.25em] text-primary-200 sm:text-sm">
          {HERO.region}
        </p>
        <h1 className="animate-fade-up mt-4 font-heading text-4xl font-extrabold uppercase leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          {HERO.title}
        </h1>
        <p className="animate-fade-up mx-auto mt-4 max-w-3xl text-sm uppercase tracking-wide text-white/90 sm:text-base">
          {HERO.subtitle}
        </p>

        <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/profil/sejarah"
            className="rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-primary-700"
          >
            Tentang Kami
          </Link>
          <Link
            href="/layanan"
            className="rounded-full border border-white/50 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            Layanan Kami
          </Link>
        </div>

        {/* Kontrol carousel */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Slide sebelumnya"
            onClick={() => setI((v) => (v - 1 + SLIDES.length) % SLIDES.length)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/40 text-white hover:bg-white/15"
          >
            ‹
          </button>
          <div className="flex items-center gap-2" role="tablist" aria-label="Pilih slide">
            {SLIDES.map((s, idx) => (
              <button
                key={s.src}
                type="button"
                role="tab"
                aria-selected={idx === i}
                aria-label={`Slide ${idx + 1}`}
                onClick={() => setI(idx)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  idx === i ? "w-6 bg-primary-400" : "w-2 bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Slide berikutnya"
            onClick={() => setI((v) => (v + 1) % SLIDES.length)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/40 text-white hover:bg-white/15"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
