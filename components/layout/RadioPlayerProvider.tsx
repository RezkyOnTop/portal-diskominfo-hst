"use client";

import { createContext, useContext, useMemo, useRef, useState } from "react";
import { radioStreamUrl } from "@/lib/config";

interface RadioContextValue {
  isPlaying: boolean;
  toggle: () => void;
  url: string;
}

const RadioContext = createContext<RadioContextValue | null>(null);

export function useRadio(): RadioContextValue {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("useRadio harus dipakai di dalam RadioPlayerProvider");
  return ctx;
}

/**
 * RadioPlayerProvider — menahan satu elemen <audio> di root layout sehingga
 * siaran radio TETAP berjalan saat pengguna berpindah halaman (persist antar
 * navigasi). Menampilkan mini-player saat sedang diputar.
 */
export function RadioPlayerProvider({ children }: { children: React.ReactNode }) {
  const url = useMemo(() => radioStreamUrl(), []);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }

  return (
    <RadioContext.Provider value={{ isPlaying, toggle, url }}>
      {children}
      {/* Elemen audio persisten (tidak di-unmount saat navigasi). */}
      <audio ref={audioRef} src={url} preload="none" className="hidden" />
      {isPlaying ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-primary-700 bg-primary-700 text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-sm">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent-500" />
              Sedang memutar: Radio HST
            </span>
            <button
              type="button"
              onClick={toggle}
              className="rounded-md bg-white/15 px-3 py-1 font-semibold hover:bg-white/25"
            >
              Hentikan
            </button>
          </div>
        </div>
      ) : null}
    </RadioContext.Provider>
  );
}
