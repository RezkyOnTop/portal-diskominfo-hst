"use client";

import { useEffect, useRef, useState } from "react";
import { markdownAman } from "@/lib/utils/markdown";
import { bersihkanPesanChat } from "@/lib/utils/sanitize";
import { useRiwayatChat } from "./useRiwayatChat";

const SARAN = [
  "Bagaimana cara reservasi layanan?",
  "Apa saja layanan Diskominfo SP HST?",
  "Alamat dan kontak kantor?",
  "Cuaca Barabai hari ini?",
];

/**
 * PanelChat — kotak chat AI di dalam widget combo.
 *
 * Riwayat percakapan disimpan per-tab (sessionStorage) sehingga tidak hilang
 * saat berpindah tab widget atau me-refresh halaman; hilang saat tab ditutup.
 *
 * Keamanan: input disanitasi sebelum kirim; balasan dirender sebagai teks/
 * markdown yang sudah di-escape (bukan HTML mentah) untuk mencegah XSS.
 * Disclaimer privasi selalu tampil.
 */
export function PanelChat() {
  const { pesan, tambahPesan, hapusRiwayat } = useRiwayatChat();
  const [teks, setTeks] = useState("");
  const [memuat, setMemuat] = useState(false);
  const daftarRef = useRef<HTMLDivElement | null>(null);
  const kunciRef = useRef(false);

  useEffect(() => {
    const el = daftarRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [pesan, memuat]);

  async function kirim(isi: string) {
    const bersih = bersihkanPesanChat(isi);
    // Kunci ref: cegah kirim ganda walau klik terjadi sebelum re-render.
    if (bersih.length < 2 || kunciRef.current) return;
    kunciRef.current = true;
    setMemuat(true);
    const riwayat = pesan
      .filter((p) => !p.gagal)
      .slice(-6)
      .map((p) => ({ role: p.role, content: p.content }));
    tambahPesan({ role: "user", content: bersih });
    setTeks("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pesan: bersih, riwayat }),
      });
      const data = (await res.json()) as { ok?: boolean; balasan?: string; message?: string };
      if (!res.ok || !data.ok || !data.balasan) {
        throw new Error(data.message ?? "Gagal menghubungi asisten.");
      }
      tambahPesan({ role: "assistant", content: data.balasan! });
    } catch (e) {
      const m = e instanceof Error ? e.message : "Gagal menghubungi asisten.";
      tambahPesan({ role: "assistant", content: m, gagal: true });
    } finally {
      kunciRef.current = false;
      setMemuat(false);
    }
  }

  return (
    <div className="flex h-[min(26rem,60vh)] flex-col">
      {/* Disclaimer privasi + tombol bersihkan riwayat */}
      <div className="flex items-start gap-1.5 border-b border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
        <span aria-hidden="true">⚠️</span>
        <span className="flex-1">
          Jangan kirim data pribadi sensitif (NIK, nomor KK, password, OTP). Percakapan
          dapat diproses pihak ketiga (penyedia AI).
        </span>
        {pesan.filter((p) => p.role === "user").length > 0 ? (
          <button
            type="button"
            onClick={hapusRiwayat}
            className="shrink-0 rounded-md border border-amber-300 px-1.5 py-0.5 text-[10px] font-semibold hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/40"
          >
            Bersihkan
          </button>
        ) : null}
      </div>

      {/* Daftar pesan */}
      <div
        ref={daftarRef}
        className="flex-1 space-y-3 overflow-y-auto p-3"
        aria-live="polite"
        aria-label="Percakapan dengan asisten"
      >
        {pesan.map((p, i) => (
          <div
            key={i}
            className={p.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                p.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary-600 px-3.5 py-2 text-sm text-white"
                  : p.gagal
                    ? "max-w-[85%] rounded-2xl rounded-bl-sm bg-red-50 px-3.5 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    : "max-w-[85%] rounded-2xl rounded-bl-sm bg-neutral-100 px-3.5 py-2 text-sm text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
              }
            >
              {p.role === "assistant" && !p.gagal ? (
                // Markdown sudah di-escape total -> aman dari XSS.
                <div
                  className="space-y-1 [&_a]:break-words"
                  dangerouslySetInnerHTML={{ __html: markdownAman(p.content) }}
                />
              ) : (
                <span className="whitespace-pre-wrap break-words">{p.content}</span>
              )}
            </div>
          </div>
        ))}

        {memuat ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-neutral-100 px-3.5 py-2.5 dark:bg-neutral-800">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" />
            </div>
          </div>
        ) : null}
      </div>

      {/* Saran cepat (hanya saat belum ada pertanyaan user) */}
      {pesan.filter((p) => p.role === "user").length === 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-neutral-100 px-3 py-2 dark:border-neutral-800">
          {SARAN.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void kirim(s)}
              className="rounded-full border border-neutral-200 px-3 py-1 text-[11px] font-medium text-neutral-600 hover:bg-primary-50 hover:text-primary-700 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void kirim(teks);
        }}
        className="flex items-center gap-2 border-t border-neutral-200 p-2.5 dark:border-neutral-700"
      >
        <input
          type="text"
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          maxLength={1000}
          placeholder="Tulis pertanyaan…"
          aria-label="Pesan untuk asisten"
          className="h-10 min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={memuat || teks.trim().length < 2}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Kirim pesan"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
