"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

const JENIS = [
  { key: "berita", label: "Berita" },
  { key: "pengumuman", label: "Pengumuman" },
  { key: "halaman", label: "Halaman" },
] as const;

/**
 * SearchBar — kotak pencarian dengan filter jenis + kategori + rentang tanggal.
 * Mendorong semua state ke URL agar hasil bisa dibagikan/di-bookmark.
 */
export function SearchBar({
  kategoriList = [],
  initialQ = "",
  initialJenis = [],
  initialKategori = "",
  initialDari = "",
  initialSampai = "",
}: {
  kategoriList?: string[];
  initialQ?: string;
  initialJenis?: string[];
  initialKategori?: string;
  initialDari?: string;
  initialSampai?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [jenis, setJenis] = useState<string[]>(initialJenis);
  const [kategori, setKategori] = useState(initialKategori);
  const [dari, setDari] = useState(initialDari);
  const [sampai, setSampai] = useState(initialSampai);
  const [showFilter, setShowFilter] = useState(
    Boolean(initialKategori || initialDari || initialSampai || initialJenis.length),
  );

  function buildHref(over?: Partial<{ q: string; jenis: string[]; kategori: string; dari: string; sampai: string }>) {
    const next = { q, jenis, kategori, dari, sampai, ...over };
    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.jenis.length) params.set("jenis", next.jenis.join(","));
    if (next.kategori) params.set("kategori", next.kategori);
    if (next.dari) params.set("dari", next.dari);
    if (next.sampai) params.set("sampai", next.sampai);
    const qs = params.toString();
    return qs ? `/cari?${qs}` : "/cari";
  }

  function submit(over?: Partial<{ q: string; jenis: string[]; kategori: string; dari: string; sampai: string }>) {
    router.push(buildHref(over));
  }

  function toggleJenis(k: string) {
    const next = jenis.includes(k) ? jenis.filter((j) => j !== k) : [...jenis, k];
    setJenis(next);
    submit({ jenis: next });
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)] sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </span>
          <input
            type="search"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari berita, pengumuman, atau halaman…"
            aria-label="Kata kunci pencarian"
            className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500"
          />
        </div>
        <button
          type="submit"
          className="h-11 rounded-lg bg-primary-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          Cari
        </button>
      </div>

      {/* Filter jenis */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {JENIS.map((j) => (
          <button
            key={j.key}
            type="button"
            aria-pressed={jenis.includes(j.key)}
            onClick={() => toggleJenis(j.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              jenis.includes(j.key)
                ? "bg-primary-600 text-white"
                : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
            )}
          >
            {j.label}
          </button>
        ))}
        <button
          type="button"
          aria-expanded={showFilter}
          onClick={() => setShowFilter((v) => !v)}
          className="ml-auto rounded-full px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
        >
          {showFilter ? "Sembunyikan filter ▲" : "Filter lanjutan ▼"}
        </button>
      </div>

      {showFilter ? (
        <div className="mt-4 grid gap-3 border-t border-neutral-100 pt-4 sm:grid-cols-3">
          <label className="text-xs font-semibold text-neutral-600">
            Kategori berita
            <select
              value={kategori}
              onChange={(e) => {
                setKategori(e.target.value);
                submit({ kategori: e.target.value });
              }}
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 bg-white px-2 text-sm text-neutral-900"
            >
              <option value="">Semua kategori</option>
              {kategoriList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-neutral-600">
            Dari tanggal
            <input
              type="date"
              value={dari}
              onChange={(e) => setDari(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 bg-white px-2 text-sm text-neutral-900"
            />
          </label>
          <label className="text-xs font-semibold text-neutral-600">
            Sampai tanggal
            <input
              type="date"
              value={sampai}
              onChange={(e) => setSampai(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 bg-white px-2 text-sm text-neutral-900"
            />
          </label>
          <div className="sm:col-span-3">
            <button
              type="button"
              onClick={() => submit()}
              className="h-10 rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Terapkan filter
            </button>
            <button
              type="button"
              onClick={() => {
                setJenis([]);
                setKategori("");
                setDari("");
                setSampai("");
                router.push(buildHref({ jenis: [], kategori: "", dari: "", sampai: "" }));
              }}
              className="ml-2 h-10 rounded-lg px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-100"
            >
              Reset
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
