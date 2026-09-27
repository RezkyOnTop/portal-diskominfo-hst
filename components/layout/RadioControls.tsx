"use client";

import { useRadio } from "@/components/layout/RadioPlayerProvider";

/** Kontrol pemutar radio (memanfaatkan provider persisten di root layout). */
export function RadioControls() {
  const { isPlaying, toggle } = useRadio();
  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={isPlaying}
        className="inline-flex h-14 items-center gap-3 rounded-full bg-white px-6 text-base font-semibold text-primary-700 hover:bg-neutral-100"
      >
        <span aria-hidden="true" className="text-xl">
          {isPlaying ? "⏸" : "▶"}
        </span>
        {isPlaying ? "Jeda Siaran" : "Putar Siaran"}
      </button>
      <span aria-live="polite" className="text-sm text-white/80">
        {isPlaying ? "Sedang memutar Radio HST" : "Siaran berhenti"}
      </span>
    </div>
  );
}
