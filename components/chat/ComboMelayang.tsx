"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PanelCuaca } from "@/components/cuaca/PanelCuaca";
import { CuacaIcon } from "@/components/cuaca/CuacaIcon";
import { PanelChat } from "@/components/chat/PanelChat";
import { useCuaca, ambilCuaca } from "@/components/cuaca/useCuaca";

type Tab = "cuaca" | "chat";

/**
 * ComboMelayang — widget combo AI + Cuaca di pojok kanan bawah.
 *
 * Gelembung mini berisi ringkasan cuaca (integrasi widget lama). Diklik:
 * mekar panel dengan dua tab: "Asisten AI" (default) dan "Cuaca".
 * Esc / klik luar menutup. Data cuaca di-cache 1 jam di browser.
 */
export function ComboMelayang() {
  const [buka, setBuka] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");
  const { payload, memuat, muat, setPayload } = useCuaca();
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Muat awal cuaca (gelembung) — setState hanya setelah await.
  useEffect(() => {
    let aktif = true;
    (async () => {
      const p = await ambilCuaca(false);
      if (aktif && p) setPayload(p);
    })();
    return () => {
      aktif = false;
    };
  }, [setPayload]);

  const togglePanel = useCallback(() => {
    const next = !buka;
    setBuka(next);
    if (next) void muat(false);
  }, [buka, muat]);

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

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {/* Panel mekar */}
      {buka && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Asisten AI dan prakiraan cuaca Barabai"
          className="w-[min(24rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
        >
          {/* Kepala */}
          <div className="flex items-center justify-between gap-2 border-b border-neutral-200 p-3 dark:border-neutral-700">
            <div
              role="tablist"
              aria-label="Pilih panel asisten atau cuaca"
              className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800"
            >
              <button
                role="tab"
                type="button"
                aria-selected={tab === "chat"}
                onClick={() => setTab("chat")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  tab === "chat"
                    ? "bg-white text-primary-700 shadow dark:bg-neutral-900 dark:text-primary-300"
                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
              >
                ✨ Asisten AI
              </button>
              <button
                role="tab"
                type="button"
                aria-selected={tab === "cuaca"}
                onClick={() => {
                  setTab("cuaca");
                  void muat(false);
                }}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  tab === "cuaca"
                    ? "bg-white text-primary-700 shadow dark:bg-neutral-900 dark:text-primary-300"
                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
              >
                {sekarang ? `${sekarang.suhu}° ` : ""}Cuaca
              </button>
            </div>
            <button
              type="button"
              onClick={() => setBuka(false)}
              aria-label="Tutup panel asisten dan cuaca"
              className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              ✕
            </button>
          </div>

          {/* Isi tab */}
          {tab === "chat" ? (
            <PanelChat />
          ) : (
            <PanelCuaca payload={payload} memuat={memuat} muatUlang={() => void muat(true)} />
          )}

          {/* Kaki */}
          <p className="border-t border-neutral-200 bg-neutral-50 px-4 py-1.5 text-[11px] text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800/50">
            {tab === "chat"
              ? "AI dapat keliru — verifikasi ke kontak resmi bila penting."
              : "Sumber cuaca: BMKG."}
          </p>
        </div>
      )}

      {/* Gelembung mini (ringkasan cuaca) */}
      <button
        type="button"
        onClick={togglePanel}
        aria-expanded={buka}
        aria-label={
          sekarang
            ? `Asisten AI & cuaca Barabai: ${sekarang.deskripsi}, ${sekarang.suhu} derajat. ${buka ? "Tutup panel" : "Buka panel"}`
            : "Asisten AI & cuaca Barabai. Buka panel"
        }
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/95 py-2 pl-3 pr-4 shadow-lg backdrop-blur transition-transform hover:scale-105 dark:border-neutral-700 dark:bg-neutral-900/95"
      >
        {sekarang ? (
          <>
            <CuacaIcon kode={sekarang.kode} className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-bold text-neutral-900 dark:text-white">{sekarang.suhu}°C</span>
            <span className="max-w-24 truncate text-xs text-neutral-500">· Tanya AI</span>
          </>
        ) : (
          <>
            <span aria-hidden="true" className="text-lg">✨</span>
            <span className="text-xs font-semibold text-neutral-500">Asisten</span>
          </>
        )}
      </button>
    </div>
  );
}
