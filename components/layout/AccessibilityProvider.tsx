"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { createContext, useContext } from "react";

/**
 * AccessibilityProvider — preferensi aksesibilitas pengunjung.
 *
 * Menyimpan pilihan di localStorage (`hst-a11y`) dan menerapkannya sebagai
 * kelas pada <html>, sehingga berlaku di seluruh halaman publik. Store dibuat
 * di luar React (pola sama dengan ThemeProvider) agar sinkron dengan DOM dan
 * bebas flicker: skrip `a11yInitScript` memasang kelas sebelum paint, provider
 * hanya membaca nilai yang sama lewat useSyncExternalStore.
 */

const STORAGE_KEY = "hst-a11y";

export const SKALA_MIN = 0.9;
export const SKALA_MAKS = 1.6;
export const SKALA_LANGKAH = 0.1;

export interface Preferensi {
  /** Skala ukuran teks (1 = 100%). */
  skala: number;
  /** Kontras tinggi: teks/permukaan dipaksa kontras maksimum. */
  kontras: boolean;
  /** Seluruh halaman jadi skala abu-abu. */
  abuAbu: boolean;
  /** Semua tautan diberi garis bawah. */
  garisBawah: boolean;
  /** Font mudah dibaca (Verdana/Tahoma, jarak baris lega). */
  fontMudah: boolean;
  /** Hentikan animasi dan transisi. */
  tanpaAnimasi: boolean;
  /** Bantuan suara: membacakan elemen yang sedang difokuskan. */
  bantuanSuara: boolean;
}

export const PREFERENSI_AWAL: Preferensi = {
  skala: 1,
  kontras: false,
  abuAbu: false,
  garisBawah: false,
  fontMudah: false,
  tanpaAnimasi: false,
  bantuanSuara: false,
};

/** Batasi skala ke rentang yang didukung dan bulatkan ke langkah 0,1. */
export function batasiSkala(nilai: number): number {
  if (!Number.isFinite(nilai)) return 1;
  const bulat = Math.round(nilai * 10) / 10;
  if (bulat < SKALA_MIN) return SKALA_MIN;
  if (bulat > SKALA_MAKS) return SKALA_MAKS;
  return bulat;
}

/** Normalisasi objek mentah dari localStorage menjadi Preferensi yang sah. */
export function normalisasiPreferensi(mentah: unknown): Preferensi {
  if (typeof mentah !== "object" || mentah === null) return PREFERENSI_AWAL;
  const o = mentah as Record<string, unknown>;
  return {
    skala: batasiSkala(typeof o.skala === "number" ? o.skala : 1),
    kontras: o.kontras === true,
    abuAbu: o.abuAbu === true,
    garisBawah: o.garisBawah === true,
    fontMudah: o.fontMudah === true,
    tanpaAnimasi: o.tanpaAnimasi === true,
    bantuanSuara: o.bantuanSuara === true,
  };
}

const KELAS: Array<[keyof Preferensi, string]> = [
  ["kontras", "a11y-kontras"],
  ["abuAbu", "a11y-abu-abu"],
  ["garisBawah", "a11y-garis-bawah"],
  ["fontMudah", "a11y-font-mudah"],
  ["tanpaAnimasi", "a11y-tanpa-animasi"],
];

/** Terapkan preferensi ke <html> (kelas + variabel skala teks). */
export function terapkanPreferensi(p: Preferensi): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [kunci, kelas] of KELAS) {
    root.classList.toggle(kelas, p[kunci] === true);
  }
  root.style.setProperty("--a11y-skala", String(p.skala));
}

// ── Store eksternal (localStorage) ────────────────────────────────
const pendengar = new Set<() => void>();
let cache: Preferensi | null = null;

function bacaTersimpan(): Preferensi {
  try {
    const teks = window.localStorage.getItem(STORAGE_KEY);
    if (!teks) return PREFERENSI_AWAL;
    return normalisasiPreferensi(JSON.parse(teks));
  } catch {
    return PREFERENSI_AWAL;
  }
}

function getSnapshot(): Preferensi {
  if (cache === null) cache = bacaTersimpan();
  return cache;
}

function getServerSnapshot(): Preferensi {
  return PREFERENSI_AWAL;
}

function emit(): void {
  cache = null;
  for (const l of pendengar) l();
}

function subscribe(cb: () => void): () => void {
  pendengar.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    pendengar.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function simpan(p: Preferensi): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* mode privat / kuota penuh — preferensi tetap berlaku sesi ini. */
  }
  terapkanPreferensi(p);
  emit();
}

interface NilaiKonteks {
  preferensi: Preferensi;
  set: <K extends keyof Preferensi>(kunci: K, nilai: Preferensi[K]) => void;
  tambahSkala: () => void;
  kurangSkala: () => void;
  aturUlang: () => void;
}

const Konteks = createContext<NilaiKonteks | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const preferensi = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Sinkronkan DOM setiap preferensi berubah (sistem eksternal, bukan state).
  useEffect(() => {
    terapkanPreferensi(preferensi);
  }, [preferensi]);

  const set = useCallback<NilaiKonteks["set"]>((kunci, nilai) => {
    simpan({ ...getSnapshot(), [kunci]: nilai });
  }, []);

  const tambahSkala = useCallback(() => {
    simpan({ ...getSnapshot(), skala: batasiSkala(getSnapshot().skala + SKALA_LANGKAH) });
  }, []);

  const kurangSkala = useCallback(() => {
    simpan({ ...getSnapshot(), skala: batasiSkala(getSnapshot().skala - SKALA_LANGKAH) });
  }, []);

  const aturUlang = useCallback(() => simpan(PREFERENSI_AWAL), []);

  const nilai = useMemo<NilaiKonteks>(
    () => ({ preferensi, set, tambahSkala, kurangSkala, aturUlang }),
    [preferensi, set, tambahSkala, kurangSkala, aturUlang],
  );

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}

export function useA11y(): NilaiKonteks {
  const ctx = useContext(Konteks);
  if (!ctx) {
    throw new Error("useA11y harus dipakai di dalam <AccessibilityProvider>");
  }
  return ctx;
}

/**
 * Skrip inline: pasang kelas aksesibilitas sebelum paint agar tidak berkedip
 * saat halaman dimuat ulang dengan preferensi tersimpan.
 */
export const a11yInitScript = `(function(){try{var k="hst-a11y";var r=document.documentElement;var s=localStorage.getItem(k);if(!s)return;var p=JSON.parse(s);if(!p||typeof p!=="object")return;var map=[["kontras","a11y-kontras"],["abuAbu","a11y-abu-abu"],["garisBawah","a11y-garis-bawah"],["fontMudah","a11y-font-mudah"],["tanpaAnimasi","a11y-tanpa-animasi"]];for(var i=0;i<map.length;i++){if(p[map[i][0]]===true){r.classList.add(map[i][1]);}}var n=typeof p.skala==="number"?p.skala:1;if(n<0.9)n=0.9;if(n>1.6)n=1.6;r.style.setProperty("--a11y-skala",String(Math.round(n*10)/10));}catch(e){}})();`;
