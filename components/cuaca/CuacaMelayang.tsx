"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CuacaIcon } from "@/components/cuaca/CuacaIcon";
import { bmkgLampiranUrl } from "@/lib/utils/bmkg";
import type { CuacaHari, CuacaSlot, PrakiraanCuaca } from "@/types/cuaca";
interface CuacaPayload {
  data: PrakiraanCuaca;
  sekarang: CuacaSlot | null;
  degraded: boolean;
  linkBmkg: string;
}

/** Ambil cuaca dari cache browser (1 jam) atau API bila basi. */
async function ambilCuaca(force = false): Promise<CuacaPayload | null> {
  const KEY = "cuaca-mini-v1";
  if (!force) {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const c = JSON.parse(raw) as { at: number; payload: CuacaPayload };
        if (Date.now() - c.at < 60 * 60 * 1000) return c.payload;
      }
    } catch {
      /* cache rusak -> ambil baru */
    }
  }
  const res = await fetch("/api/cuaca?mini=1", { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const payload = (await res.json()) as CuacaPayload;
  try {
    localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), payload }));
  } catch {
    /* penyimpanan penuh -> abaikan */
  }
  return payload;
}

/**
 * Widget cuaca melayang — gelembung mini di pojok kanan bawah.
 * Diklik: mekar panel prakiraan (kondisi kini + hari + rincian per 3 jam).
 * Esc / klik luar: menutup. Data di-cache 1 jam di browser.
 */
export function CuacaMelayang() {
  const [buka, setBuka] = useState(false);
  const [hariAktif, setHariAktif] = useState(0);
  const [payload, setPayload] = useState<CuacaPayload | null>(null);
  const [memuat, setMemuat] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const muat = useCallback(async (force = false) => {
    setMemuat(true);
    try {
      const p = await ambilCuaca(force);
      if (p) setPayload(p);
    } catch {
      /* panel tampilkan fallback */
    } finally {
      setMemuat(false);
    }
  }, []);

  // Buka/tutup panel; saat dibuka, segarkan data (event handler).
  const togglePanel = useCallback(() => {
    const next = !buka;
    setBuka(next);
    if (next) void muat(false);
  }, [buka, muat]);

  // Muat awal: setState hanya SETELAH await (tidak sinkron di effect).
  useEffect(() => {
    let aktif = true;
    (async () => {
      const p = await ambilCuaca(false);
      if (aktif && p) setPayload(p);
    })();
    return () => {
      aktif = false;
    };
  }, []);

  // Esc menutup.
  useEffect(() => {
    if (!buka) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setBuka(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [buka]);

  // Klik luar menutup.
  useEffect(() => {
    if (!buka) return;
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setBuka(false);
      }
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [buka]);

  const sekarang = payload?.sekarang ?? null;
  const hari: CuacaHari[] = payload?.data.hari ?? [];
  const aktif = hari[Math.min(hariAktif, Math.max(hari.length - 1, 0))] ?? null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {/* Panel mekar */}
      {buka && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Prakiraan cuaca Barabai"
          className="w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
        >
          <div className="flex items-start justify-between gap-2 border-b border-neutral-200 p-4 dark:border-neutral-700">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                Cuaca · Barabai
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {payload
                  ? `${payload.data.desa} · Kec. ${payload.data.kecamatan}`
                  : "Memuat prakiraan…"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBuka(false)}
              aria-label="Tutup panel cuaca"
              className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              ✕
            </button>
          </div>

          {memuat && !payload ? (
            <div className="space-y-2 p-4" aria-label="Memuat cuaca">
              <div className="h-12 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
              <div className="h-16 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
            </div>
          ) : !payload || !sekarang ? (
            <div className="p-4 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Prakiraan cuaca sedang tidak dapat dimuat.
              </p>
              <a
                href={bmkgLampiranUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Buka BMKG ↗
              </a>
            </div>
          ) : (
            <>
              {/* Kondisi kini */}
              <div className="flex items-center gap-4 p-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  <CuacaIcon kode={sekarang.kode} className="h-8 w-8" />
                </span>
                <div className="min-w-0">
                  <p className="font-heading text-2xl font-extrabold text-neutral-900 dark:text-white">
                    {sekarang.suhu}
                    <span className="text-base font-bold text-neutral-500">°C</span>
                  </p>
                  <p className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    {sekarang.deskripsi}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Pukul {sekarang.jam} WITA · {sekarang.kelembapan}% · Angin{" "}
                    {sekarang.angin} km/j
                    {sekarang.arahAnginText ? ` ${sekarang.arahAnginText}` : ""}
                  </p>
                </div>
              </div>

              {/* Tab hari */}
              <div
                role="tablist"
                aria-label="Pilih hari prakiraan"
                className="flex gap-1 overflow-x-auto border-t border-neutral-200 px-3 pt-2 dark:border-neutral-700"
              >
                {hari.map((h, i) => (
                  <button
                    key={h.tanggal}
                    role="tab"
                    type="button"
                    aria-selected={i === hariAktif}
                    onClick={() => setHariAktif(i)}
                    className={`shrink-0 rounded-t-lg px-3 py-2 text-center transition-colors ${
                      i === hariAktif
                        ? "bg-primary-50 font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                        : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <span className="block text-xs">{h.label}</span>
                    <span className="block text-sm font-bold">
                      {h.max}° <span className="font-medium opacity-70">{h.min}°</span>
                    </span>
                  </button>
                ))}
              </div>

              {/* Rincian per 3 jam hari aktif */}
              {aktif && (
                <ul className="max-h-56 space-y-1 overflow-y-auto border-t border-neutral-200 p-3 dark:border-neutral-700">
                  {aktif.slot.map((s) => (
                    <li
                      key={s.iso}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      <time
                        dateTime={s.iso}
                        className="w-11 shrink-0 text-xs font-semibold text-neutral-500"
                      >
                        {s.jam}
                      </time>
                      <CuacaIcon kode={s.kode} className="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
                      <span className="min-w-0 flex-1 truncate text-xs text-neutral-700 dark:text-neutral-300">
                        {s.deskripsi}
                      </span>
                      <span className="shrink-0 text-xs font-bold text-neutral-900 dark:text-white">
                        {s.suhu}°
                      </span>
                      <span className="hidden w-12 shrink-0 text-right text-[11px] text-neutral-500 sm:block">
                        {s.kelembapan}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-neutral-700 dark:bg-neutral-800/50">
                <p className="text-[11px] text-neutral-500">
                  {payload.degraded ? "Data terakhir · " : ""}Sumber: BMKG
                </p>
                <a
                  href={payload.linkBmkg}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary-700 hover:underline dark:text-primary-400"
                >
                  BMKG ↗
                </a>
              </div>
            </>
          )}
        </div>
      )}

      {/* Gelembung mini */}
      <button
        type="button"
        onClick={togglePanel}
        aria-expanded={buka}
        aria-label={
          sekarang
            ? `Cuaca Barabai: ${sekarang.deskripsi}, ${sekarang.suhu} derajat. ${buka ? "Tutup panel" : "Buka prakiraan"}`
            : "Cuaca Barabai. Buka prakiraan"
        }
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/95 py-2 pl-3 pr-4 shadow-lg backdrop-blur transition-transform hover:scale-105 dark:border-neutral-700 dark:bg-neutral-900/95"
      >
        {sekarang ? (
          <>
            <CuacaIcon kode={sekarang.kode} className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-bold text-neutral-900 dark:text-white">
              {sekarang.suhu}°C
            </span>
            <span className="max-w-24 truncate text-xs text-neutral-500">
              Barabai
            </span>
          </>
        ) : (
          <>
            <span aria-hidden="true" className="text-lg">🌤️</span>
            <span className="text-xs font-semibold text-neutral-500">Cuaca</span>
          </>
        )}
      </button>
    </div>
  );
}
