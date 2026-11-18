"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/utils/cn";
import { useA11y, SKALA_MAKS, SKALA_MIN } from "@/components/layout/AccessibilityProvider";

/**
 * AccessibilityWidget — tombol melayang + panel aksesibilitas.
 *
 * Setara fungsi dengan menu aksesibilitas situs lama, tetapi dibuat ulang
 * mengikuti sistem desain portal ini: ukuran teks, kontras tinggi, skala
 * abu-abu, garis bawah tautan, font mudah dibaca, hentikan animasi, dan
 * bantuan suara (membacakan halaman atau elemen yang difokuskan).
 *
 * Catatan aksesibilitas panel:
 * - `role="dialog"` + `aria-modal="false"` (panel tidak mengunci halaman).
 * - Escape menutup, fokus kembali ke tombol pemicu.
 * - Semua tombol toggle memakai `aria-pressed`, bukan warna saja.
 */

type Kecepatan = 0.7 | 1 | 1.3;

const KECEPATAN: Array<{ nilai: Kecepatan; label: string }> = [
  { nilai: 0.7, label: "Lambat" },
  { nilai: 1, label: "Normal" },
  { nilai: 1.3, label: "Cepat" },
];

function IkonAksesibilitas({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="4.5" r="1.8" />
      <path d="M4.5 8.5c2.4.9 4.9 1.4 7.5 1.4s5.1-.5 7.5-1.4" />
      <path d="M12 9.9V14m0 0-2.6 6.1M12 14l2.6 6.1" />
    </svg>
  );
}

const langgananKosong = () => () => {};
const dukungSuaraKlien = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function AccessibilityWidget() {
  const { preferensi, set, tambahSkala, kurangSkala, aturUlang } = useA11y();
  const [terbuka, setTerbuka] = useState(false);
  const [kecepatan, setKecepatan] = useState<Kecepatan>(1);
  const [sedangBicara, setSedangBicara] = useState(false);
  const [jeda, setJeda] = useState(false);
  const dukungSuara = useSyncExternalStore(
    langgananKosong,
    dukungSuaraKlien,
    () => false,
  );
  const panelRef = useRef<HTMLDivElement | null>(null);
  const tombolRef = useRef<HTMLButtonElement | null>(null);
  const idPanel = useId();
  const idJudul = useId();

  const persen = Math.round(preferensi.skala * 100);
  const bisaPerbesar = preferensi.skala < SKALA_MAKS;
  const bisaPerkecil = preferensi.skala > SKALA_MIN;

  const tutup = useCallback(() => {
    setTerbuka(false);
    tombolRef.current?.focus();
  }, []);

  // Escape menutup panel; klik di luar panel juga menutup.
  useEffect(() => {
    if (!terbuka) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        tutup();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (tombolRef.current?.contains(target)) return;
      setTerbuka(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [terbuka, tutup]);

  // Pindahkan fokus ke panel saat dibuka.
  useEffect(() => {
    if (!terbuka) return;
    const el = panelRef.current?.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    el?.focus();
  }, [terbuka]);

  // Hentikan suara ketika widget dilepas.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const ucapkan = useCallback(
    (teks: string) => {
      if (!dukungSuara || !teks.trim()) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(teks);
      u.lang = "id-ID";
      u.rate = kecepatan;
      u.onend = () => {
        setSedangBicara(false);
        setJeda(false);
      };
      u.onerror = () => {
        setSedangBicara(false);
        setJeda(false);
      };
      synth.speak(u);
      setSedangBicara(true);
      setJeda(false);
    },
    [dukungSuara, kecepatan],
  );

  const bacakanHalaman = useCallback(() => {
    const utama = document.querySelector("main") ?? document.body;
    const teks = (utama.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 4000);
    ucapkan(teks);
  }, [ucapkan]);

  const jedaAtauLanjut = useCallback(() => {
    const synth = window.speechSynthesis;
    if (synth.paused) {
      synth.resume();
      setJeda(false);
    } else {
      synth.pause();
      setJeda(true);
    }
  }, []);

  const berhenti = useCallback(() => {
    window.speechSynthesis.cancel();
    setSedangBicara(false);
    setJeda(false);
  }, []);

  // Bantuan suara: bacakan elemen yang difokuskan (tautan, tombol, judul).
  useEffect(() => {
    if (!preferensi.bantuanSuara) return;
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el || !el.matches("a, button, h1, h2, h3, summary")) return;
      if (panelRef.current?.contains(el)) return;
      const teks = el.getAttribute("aria-label") || el.textContent || "";
      ucapkan(teks.replace(/\s+/g, " ").trim());
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [preferensi.bantuanSuara, ucapkan]);

  const opsiTampilan: Array<{ kunci: "kontras" | "abuAbu" | "garisBawah" | "fontMudah" | "tanpaAnimasi"; label: string }> = [
    { kunci: "kontras", label: "Kontras tinggi" },
    { kunci: "abuAbu", label: "Skala abu-abu" },
    { kunci: "garisBawah", label: "Garis bawah tautan" },
    { kunci: "fontMudah", label: "Font mudah dibaca" },
    { kunci: "tanpaAnimasi", label: "Hentikan animasi" },
  ];

  return (
    <>
      <button
        ref={tombolRef}
        type="button"
        onClick={() => setTerbuka((v) => !v)}
        aria-expanded={terbuka}
        aria-controls={idPanel}
        aria-label="Buka menu aksesibilitas"
        title="Aksesibilitas"
        className={cn(
          "fixed bottom-4 left-4 z-[70] flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full",
          "bg-primary-600 text-white shadow-lg shadow-primary-600/30 ring-1 ring-white/20",
          "transition-transform hover:scale-105 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2",
          "dark:bg-primary-500 dark:ring-primary-300/30",
        )}
      >
        <IkonAksesibilitas className="h-6 w-6" />
      </button>

      {terbuka && (
        <div
          ref={panelRef}
          id={idPanel}
          role="dialog"
          aria-modal="false"
          aria-labelledby={idJudul}
          className={cn(
            "fixed bottom-[76px] left-4 z-[75] w-[320px] max-w-[calc(100vw-2rem)]",
            "max-h-[calc(100dvh-100px)] overflow-y-auto overscroll-contain rounded-2xl border border-neutral-200",
            "bg-white p-4 shadow-2xl shadow-neutral-900/20",
            "dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/50",
            "sm:w-[352px]",
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id={idJudul} className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
              Aksesibilitas
            </h2>
            <button
              type="button"
              onClick={tutup}
              aria-label="Tutup menu aksesibilitas"
              className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <section aria-labelledby={`${idPanel}-ukuran`} className="mb-4">
            <p id={`${idPanel}-ukuran`} className="mb-2 text-sm text-neutral-600 dark:text-neutral-300">
              Ukuran teks: <strong className="text-neutral-900 dark:text-white">{persen}%</strong>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={kurangSkala}
                disabled={!bisaPerkecil}
                aria-label="Perkecil teks"
                className="h-9 flex-1 rounded-lg border border-neutral-200 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                A−
              </button>
              <button
                type="button"
                onClick={() => set("skala", 1)}
                aria-label="Ukuran teks normal"
                className="h-9 flex-1 rounded-lg border border-neutral-200 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                A
              </button>
              <button
                type="button"
                onClick={tambahSkala}
                disabled={!bisaPerbesar}
                aria-label="Perbesar teks"
                className="h-9 flex-1 rounded-lg border border-neutral-200 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                A+
              </button>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tampilan">
            {opsiTampilan.map(({ kunci, label }) => {
              const aktif = preferensi[kunci] === true;
              return (
                <button
                  key={kunci}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() => set(kunci, !aktif)}
                  className={cn(
                    "flex items-center justify-between gap-1 rounded-xl border px-3 py-2 text-left text-xs font-medium transition",
                    aktif
                      ? "border-primary-500 bg-primary-50 text-primary-800 dark:border-primary-400 dark:bg-primary-950/60 dark:text-primary-100"
                      : "border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800",
                  )}
                >
                  <span>{label}</span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide opacity-70">
                    {aktif ? "Nyala" : "Mati"}
                  </span>
                </button>
              );
            })}
          </div>

          {dukungSuara && (
            <section className="mt-4" aria-labelledby={`${idPanel}-suara`}>
              <p id={`${idPanel}-suara`} className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Suara
              </p>
              <button
                type="button"
                aria-pressed={preferensi.bantuanSuara}
                onClick={() => set("bantuanSuara", !preferensi.bantuanSuara)}
                className={cn(
                  "mb-2 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium transition",
                  preferensi.bantuanSuara
                    ? "border-primary-500 bg-primary-50 text-primary-800 dark:border-primary-400 dark:bg-primary-950/60 dark:text-primary-100"
                    : "border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800",
                )}
              >
                <span>Bantuan suara</span>
                <span className="text-[10px] uppercase tracking-wide opacity-70">
                  {preferensi.bantuanSuara ? "Nyala" : "Mati"}
                </span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={bacakanHalaman}
                  className="h-9 flex-1 rounded-lg bg-primary-600 px-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                >
                  Bacakan halaman
                </button>
                <button
                  type="button"
                  onClick={jedaAtauLanjut}
                  disabled={!sedangBicara}
                  className="h-9 rounded-lg border border-neutral-200 px-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  {jeda ? "Lanjut" : "Jeda"}
                </button>
                <button
                  type="button"
                  onClick={berhenti}
                  disabled={!sedangBicara}
                  className="h-9 rounded-lg border border-neutral-200 px-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  Berhenti
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1" role="group" aria-label="Kecepatan suara">
                {KECEPATAN.map(({ nilai, label }) => (
                  <button
                    key={nilai}
                    type="button"
                    aria-pressed={kecepatan === nilai}
                    onClick={() => setKecepatan(nilai)}
                    className={cn(
                      "h-8 flex-1 rounded-lg border text-xs font-medium transition",
                      kecepatan === nilai
                        ? "border-primary-500 bg-primary-50 text-primary-800 dark:border-primary-400 dark:bg-primary-950/60 dark:text-primary-100"
                        : "border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>
          )}

          <button
            type="button"
            onClick={() => {
              aturUlang();
              berhenti();
            }}
            className="mt-4 w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Atur ulang semua
          </button>
          <p className="mt-2 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
            Pengaturan tersimpan di perangkat ini.
          </p>
        </div>
      )}
    </>
  );
}
