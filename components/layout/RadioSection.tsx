"use client";

import { useState } from "react";
import Link from "next/link";
import { RADIO_NAME } from "@/lib/config";
import { useRadio } from "@/components/layout/RadioPlayerProvider";

/** Section Radio Swara Murakata — pemutar inline + ajakan ke halaman radio. */
export function RadioSection() {
  const { isPlaying, toggle } = useRadio();
  const [tried, setTried] = useState(false);

  return (
    <section className="relative overflow-hidden bg-primary-800 text-white">
      <div aria-hidden="true" className="absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-14 text-center md:flex-row md:justify-between md:text-left">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/15">
            <span aria-hidden="true" className="text-2xl">
              📻
            </span>
          </span>
          <div>
            <h2 className="font-heading text-xl font-bold sm:text-2xl">
              {RADIO_NAME} Online
            </h2>
            <p className="mt-1 text-sm text-white/85">
              Dengarkan siaran radio Pemerintah Kabupaten Hulu Sungai Tengah.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setTried(true);
              toggle();
            }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-neutral-100"
          >
            <span aria-hidden="true">{isPlaying ? "❚❚" : "▶"}</span>
            {isPlaying ? "Jeda" : "Dengarkan Disini"}
          </button>
          <Link
            href="/radio"
            className="rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
          >
            Halaman Radio
          </Link>
        </div>
      </div>
      {tried && !isPlaying ? (
        <p className="relative pb-4 text-center text-xs text-white/75">
          Siaran tidak dapat dimulai (stream belum tersedia). Silakan coba lagi nanti.
        </p>
      ) : null}
    </section>
  );
}
