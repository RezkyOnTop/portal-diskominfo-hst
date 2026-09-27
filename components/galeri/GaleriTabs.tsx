"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { FotoGaleri } from "@/lib/services/galeri";
import type { Video } from "@/lib/api/media-center-video";

type Tab = "foto" | "video";

/**
 * GaleriTabs — galeri foto + video dalam satu halaman bertab.
 * Foto: lightbox dengan navigasi keyboard (←/→/Esc).
 * Video: modal pemutar embed youtube-nocookie (tanpa cookie pelacak).
 * Data sudah diambil di server (RSC) dan diteruskan sebagai props.
 */
export function GaleriTabs({ foto, video }: { foto: FotoGaleri[]; video: Video[] }) {
  const [tab, setTab] = useState<Tab>(foto.length > 0 ? "foto" : "video");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [player, setPlayer] = useState<Video | null>(null);

  const closeLightbox = useCallback(() => setLightbox(null), []);
  const step = useCallback(
    (d: number) => {
      setLightbox((i) => {
        if (i === null) return i;
        const next = (i + d + foto.length) % foto.length;
        return next;
      });
    },
    [foto.length],
  );

  useEffect(() => {
    if (lightbox === null && !player) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLightbox(null);
        setPlayer(null);
      }
      if (lightbox !== null) {
        if (e.key === "ArrowRight") step(1);
        if (e.key === "ArrowLeft") step(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, player, step]);

  return (
    <div>
      {/* Tab */}
      <div role="tablist" aria-label="Jenis galeri" className="flex flex-wrap gap-2">
        <button
          role="tab"
          type="button"
          aria-selected={tab === "foto"}
          onClick={() => setTab("foto")}
          className={cn(
            "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
            tab === "foto"
              ? "bg-primary-600 text-white"
              : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
          )}
        >
          📷 Foto ({foto.length})
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === "video"}
          onClick={() => setTab("video")}
          className={cn(
            "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
            tab === "video"
              ? "bg-primary-600 text-white"
              : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
          )}
        >
          ▶ Video ({video.length})
        </button>
      </div>

      {/* Panel Foto */}
      {tab === "foto" ? (
        foto.length === 0 ? (
          <p className="mt-8 rounded-[var(--radius-card)] border border-dashed border-neutral-200 bg-white p-10 text-center text-neutral-600">
            Belum ada foto pada galeri.
          </p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {foto.map((f, i) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => setLightbox(i)}
                  className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
                  aria-label={`Perbesar foto: ${f.title}`}
                >
                  <Image
                    src={f.imageUrl}
                    alt={f.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    unoptimized
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="absolute inset-x-0 bottom-0 line-clamp-2 p-2.5 text-left text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {f.title}
                  </span>
                  <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                    {f.album}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {/* Panel Video */}
      {tab === "video" ? (
        video.length === 0 ? (
          <p className="mt-8 rounded-[var(--radius-card)] border border-dashed border-neutral-200 bg-white p-10 text-center text-neutral-600">
            Video belum dapat dimuat saat ini.{" "}
            <a
              href="https://www.youtube.com/@mediacenterhst"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-700 hover:underline"
            >
              Buka kanal YouTube Media Center HST ↗
            </a>
          </p>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {video.map((v) => (
              <li key={v.id}>
                <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-neutral-200 bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
                  <button
                    type="button"
                    onClick={() => setPlayer(v)}
                    className="relative block aspect-video w-full overflow-hidden bg-neutral-900"
                    aria-label={`Putar video: ${v.title}`}
                  >
                    <Image
                      src={v.thumbnail}
                      alt={v.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/25 transition-colors group-hover:bg-black/40">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-primary-700 shadow-lg transition-transform group-hover:scale-110">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="line-clamp-2 font-heading text-base font-semibold leading-snug text-neutral-900">
                      {v.title}
                    </h3>
                    <div className="mt-auto flex items-center gap-3 text-xs text-neutral-500">
                      <time dateTime={v.publishedAt}>{formatDateShort(v.publishedAt)}</time>
                      {v.views !== null ? <span>· {v.views.toLocaleString("id-ID")} tayangan</span> : null}
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )
      ) : null}

      <p className="mt-8 text-center text-sm text-neutral-600">
        Kanal resmi:{" "}
        <a
          href="https://www.youtube.com/@mediacenterhst"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary-700 hover:underline"
        >
          YouTube Media Center HST ↗
        </a>
      </p>

      {/* Lightbox foto */}
      {lightbox !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={foto[lightbox].title}
          className="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between p-4">
            <p className="line-clamp-1 pr-4 text-sm font-medium text-white/90">
              {foto[lightbox].title}
            </p>
            <button
              type="button"
              onClick={closeLightbox}
              aria-label="Tutup"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              ✕
            </button>
          </div>
          <div className="relative flex-1">
            <Image
              src={foto[lightbox].imageUrl}
              alt={foto[lightbox].title}
              fill
              sizes="100vw"
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="flex items-center justify-center gap-4 p-4">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Foto sebelumnya"
              className="rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white hover:bg-white/25"
            >
              ← Sebelumnya
            </button>
            <span className="text-xs text-white/70">
              {lightbox + 1} / {foto.length}
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Foto berikutnya"
              className="rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white hover:bg-white/25"
            >
              Berikutnya →
            </button>
          </div>
          <div className="px-4 pb-4 text-center">
            <Link
              href={foto[lightbox].href}
              className="text-xs font-semibold text-accent-300 hover:underline"
            >
              Baca berita terkait ↗
            </Link>
          </div>
        </div>
      ) : null}

      {/* Modal video */}
      {player ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={player.title}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-3xl">
            <div className="mb-3 flex items-start justify-between gap-4">
              <h2 className="font-heading text-sm font-semibold text-white sm:text-base">
                {player.title}
              </h2>
              <button
                type="button"
                onClick={() => setPlayer(null)}
                aria-label="Tutup"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                src={`${player.embedUrl}?autoplay=1&rel=0`}
                title={player.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <a
              href={player.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs font-semibold text-accent-300 hover:underline"
            >
              Tonton di YouTube ↗
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
