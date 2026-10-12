import Link from "next/link";
import { HERO, JAM_LAYANAN, RADIO_NAME } from "@/lib/config";
import { HeroSlideshow } from "@/components/layout/HeroSlideshow";

/**
 * Hero "Digital Civic": split asimetris, gradient mesh adaptif (terang di
 * mode terang, gelap di mode gelap), kartu kaca mengapung, dan widget
 * radio. Foto Kabupaten HST BERGERAK (slideshow otomatis), tetapi tetap
 * dalam panel kaca — bukan carousel layar penuh seperti situs lama.
 */
export function Hero() {
  return (
    <section className="hero-mesh relative isolate -mt-[var(--header-h)] overflow-hidden pt-[calc(var(--header-h)+2rem)] text-neutral-900 dark:text-white">
      <div aria-hidden="true" className="hero-grid absolute inset-0 opacity-60" />
      {/* Orb dekoratif */}
      <div
        aria-hidden="true"
        className="animate-float absolute -right-16 top-24 h-72 w-72 rounded-full bg-primary-500/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-10 lg:grid-cols-[1.15fr_1fr] lg:pb-28 lg:pt-16">
        {/* Kolom teks */}
        <div>
          <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-primary-600/20 bg-white/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary-700 dark:border-white/15 dark:bg-white/5 dark:text-primary-200">
            <span
              aria-hidden="true"
              className="animate-pulse-ring h-1.5 w-1.5 rounded-full bg-secondary-500"
            />
            {HERO.region}
          </p>

          <h1 className="animate-fade-up delay-1 mt-6 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Satu Portal untuk
            <br />
            <span className="hero-text-gradient">Informasi &amp; Layanan</span>
            <br />
            Hulu Sungai Tengah
          </h1>

          <p className="animate-fade-up delay-2 mt-6 max-w-xl text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
            {HERO.subtitle}. Berita resmi, pengumuman, klarifikasi hoaks, data
            terbuka, dan radio daerah — dalam satu pengalaman digital yang cepat
            dan mudah diakses.
          </p>

          <div className="animate-fade-up delay-3 mt-8 flex flex-wrap gap-3">
            <Link
              href="/berita"
              className="group inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-primary-500"
            >
              Jelajahi Berita
              <span
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
            <Link
              href="/layanan"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white/60 px-6 py-3 text-sm font-semibold text-neutral-800 backdrop-blur transition-colors hover:bg-white dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              Layanan Digital
            </Link>
          </div>

          {/* Pilar ringkas */}
          <dl className="animate-fade-up delay-4 mt-10 grid max-w-lg grid-cols-3 gap-3 border-t border-neutral-900/10 pt-6 dark:border-white/10">
            {[
              { k: "Media Center", v: "Berita resmi", icon: "M4 6h16v12H4zM8 10h8M8 14h5" },
              { k: "Open Data", v: "Data terbuka", icon: "M12 3v18M3 12h18" },
              { k: "Radio", v: "Swara Murakata", icon: "M4 12a8 8 0 0116 0M7 12a5 5 0 0110 0M12 12v8" },
            ].map((s) => (
              <div
                key={s.k}
                className="rounded-xl border border-neutral-900/10 bg-white/60 p-3 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="text-accent-600 dark:text-accent-400"
                >
                  <path d={s.icon} />
                </svg>
                <dt className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-200">
                  {s.k}
                </dt>
                <dd className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-300">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Kolom visual: slideshow foto HST yang bergerak */}
        <div className="animate-fade-up delay-2 relative">
          <HeroSlideshow />

          {/* Widget radio mengapung */}
          <div className="hero-glass absolute -bottom-5 left-3 flex items-center gap-3 rounded-2xl p-3 pr-5 shadow-xl sm:-left-6">
            <span className="animate-pulse-ring grid h-10 w-10 place-items-center rounded-full bg-secondary-500 text-white">
              <span aria-hidden="true">▶</span>
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-primary-700 dark:text-primary-200">
                Sedang Siaran
              </p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{RADIO_NAME}</p>
            </div>
          </div>

          {/* Badge jam layanan mengapung */}
          <div className="hero-glass absolute -right-3 -top-5 rounded-2xl px-4 py-3 text-center shadow-xl">
            <p className="font-heading text-sm font-extrabold leading-tight text-neutral-900 dark:text-white">
              {JAM_LAYANAN.singkat}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-primary-700 dark:text-primary-200">
              Jam Layanan
            </p>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="hero-divider" />
    </section>
  );
}
