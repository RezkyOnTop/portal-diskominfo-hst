"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * NavSearch — pencarian ringkas di navbar. Tombol membuka input; Enter
 * menuju /cari?q=… Ada juga pintasan keyboard "/" untuk fokus cepat.
 */
export function NavSearch({ solid = true }: { solid?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term.length >= 2) {
      router.push(`/cari?q=${encodeURIComponent(term)}`);
      setOpen(false);
      setQ("");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka pencarian"
        title="Cari (tekan /)"
        className={cn(
          "grid h-9 w-9 place-items-center rounded-lg border transition-colors",
          solid
            ? "border-neutral-200 text-neutral-700 hover:bg-neutral-100"
            : "border-white/30 text-white hover:bg-white/15",
        )}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </button>
    );
  }

  return (
    <form onSubmit={submit} role="search" className="flex items-center">
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onBlur={() => {
          if (!q.trim()) setOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Cari…"
        aria-label="Kata kunci pencarian"
        className={cn(
          "h-9 w-40 rounded-lg border px-3 text-sm sm:w-56",
          solid
            ? "border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400"
            : "border-white/30 bg-white/10 text-white placeholder:text-white/60",
        )}
      />
    </form>
  );
}
