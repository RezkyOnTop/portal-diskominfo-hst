"use client";

import { useState } from "react";
import { CuacaIcon } from "@/components/cuaca/CuacaIcon";
import { bmkgLampiranUrl } from "@/lib/utils/bmkg";
import type { CuacaHari, CuacaPayload } from "@/components/cuaca/useCuaca";

/**
 * PanelCuaca — isi prakiraan cuaca (murni, tanpa gelembung/pembungkus).
 * Dipakai di dalam ComboMelayang pada tab "Cuaca". Ringkas: nama daerah,
 * kondisi kini, tab hari, rincian per 3 jam, satu baris sumber (tidak dobel).
 */
export function PanelCuaca({
  payload,
  memuat,
  muatUlang,
}: {
  payload: CuacaPayload | null;
  memuat: boolean;
  muatUlang: () => void;
}) {
  const [hariAktif, setHariAktif] = useState(0);
  const sekarang = payload?.sekarang ?? null;
  const hari: CuacaHari[] = payload?.data.hari ?? [];
  const aktif = hari[Math.min(hariAktif, Math.max(hari.length - 1, 0))] ?? null;

  if (memuat && !payload) {
    return (
      <div className="space-y-2 p-3" aria-label="Memuat cuaca">
        <div className="h-10 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
        <div className="h-14 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
      </div>
    );
  }

  if (!payload || !sekarang) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Prakiraan cuaca sedang tidak dapat dimuat.
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={muatUlang}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Coba lagi
          </button>
          <a
            href={bmkgLampiranUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Buka BMKG ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Nama daerah */}
      <div className="flex items-center gap-1.5 border-b border-neutral-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary-600 dark:border-neutral-800 dark:text-primary-400">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0"
        >
          <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        <span className="truncate">
          {payload.data.desa} · Kec. {payload.data.kecamatan}
        </span>
      </div>

      {/* Kondisi kini */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          <CuacaIcon kode={sekarang.kode} className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <p className="font-heading text-xl font-extrabold text-neutral-900 dark:text-white">
            {sekarang.suhu}
            <span className="text-sm font-bold text-neutral-500">°C</span>
          </p>
          <p className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {sekarang.deskripsi}
          </p>
          <p className="truncate text-[11px] text-neutral-500">
            {sekarang.jam} WITA · {sekarang.kelembapan}% · {sekarang.angin} km/j
            {sekarang.arahAnginText ? ` ${sekarang.arahAnginText}` : ""}
          </p>
        </div>
      </div>

      {/* Tab hari */}
      <div
        role="tablist"
        aria-label="Pilih hari prakiraan"
        className="flex gap-1 overflow-x-auto border-t border-neutral-200 px-2 pt-1.5 dark:border-neutral-700"
      >
        {hari.map((h, i) => (
          <button
            key={h.tanggal}
            role="tab"
            type="button"
            aria-selected={i === hariAktif}
            onClick={() => setHariAktif(i)}
            className={`shrink-0 rounded-t-lg px-2.5 py-1 text-center transition-colors ${
              i === hariAktif
                ? "bg-primary-50 font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <span className="block text-[11px]">{h.label}</span>
            <span className="block text-xs font-bold">
              {h.max}° <span className="font-medium opacity-70">{h.min}°</span>
            </span>
          </button>
        ))}
      </div>

      {/* Rincian per 3 jam hari aktif */}
      {aktif && (
        <ul className="max-h-40 space-y-0.5 overflow-y-auto border-t border-neutral-200 p-2 dark:border-neutral-700">
          {aktif.slot.map((s) => (
            <li
              key={s.iso}
              className="flex items-center gap-2.5 rounded-md px-2 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <time dateTime={s.iso} className="w-10 shrink-0 text-[11px] font-semibold text-neutral-500">
                {s.jam}
              </time>
              <CuacaIcon kode={s.kode} className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
              <span className="min-w-0 flex-1 truncate text-xs text-neutral-700 dark:text-neutral-300">
                {s.deskripsi}
              </span>
              <span className="shrink-0 text-xs font-bold text-neutral-900 dark:text-white">{s.suhu}°</span>
              <span className="hidden w-10 shrink-0 text-right text-[11px] text-neutral-500 sm:block">
                {s.kelembapan}%
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Sumber (satu baris saja) */}
      <div className="flex items-center justify-between gap-2 border-t border-neutral-200 bg-neutral-50 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-800/50">
        <p className="text-[10px] text-neutral-500">
          {payload.degraded ? "Data terakhir · " : ""}Sumber: BMKG
        </p>
        <a
          href={payload.linkBmkg}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-semibold text-primary-700 hover:underline dark:text-primary-400"
        >
          Buka BMKG ↗
        </a>
      </div>
    </>
  );
}
