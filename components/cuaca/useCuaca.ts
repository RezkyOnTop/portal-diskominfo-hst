"use client";

import { useCallback, useState } from "react";
import type { CuacaHari, CuacaSlot, PrakiraanCuaca } from "@/lib/types/cuaca";

export interface CuacaPayload {
  data: PrakiraanCuaca;
  sekarang: CuacaSlot | null;
  degraded: boolean;
  linkBmkg: string;
}

const KEY = "cuaca-mini-v1";

/** Ambil cuaca dari cache browser (1 jam) atau API bila basi. */
export async function ambilCuaca(force = false): Promise<CuacaPayload | null> {
  if (!force) {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const c = JSON.parse(raw) as { at: number; payload: CuacaPayload };
        if (Date.now() - c.at < 60 * 60 * 1000) return c.payload;
      }
    } catch {
      /* cache rusak -> ambil baru */
    }
  }
  const res = await fetch("/api/cuaca?mini=1", { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const payload = (await res.json()) as CuacaPayload;
  try {
    localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), payload }));
  } catch {
    /* penyimpanan penuh -> abaikan */
  }
  return payload;
}

export type { CuacaHari, CuacaSlot };

/** Hook: state cuaca + fungsi muat (dipakai widget combo). */
export function useCuaca() {
  const [payload, setPayload] = useState<CuacaPayload | null>(null);
  const [memuat, setMemuat] = useState(false);

  const muat = useCallback(async (force = false) => {
    setMemuat(true);
    try {
      const p = await ambilCuaca(force);
      if (p) setPayload(p);
    } catch {
      /* biarkan panel menampilkan fallback */
    } finally {
      setMemuat(false);
    }
  }, []);

  return { payload, memuat, muat, setPayload };
}
