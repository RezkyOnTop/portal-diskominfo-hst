import { describe, expect, it } from "vitest";
import {
  PREFERENSI_AWAL,
  SKALA_MAKS,
  SKALA_MIN,
  batasiSkala,
  normalisasiPreferensi,
} from "@/components/layout/AccessibilityProvider";

describe("batasiSkala", () => {
  it("membulatkan ke langkah 0,1", () => {
    expect(batasiSkala(1.234)).toBe(1.2);
    expect(batasiSkala(1.26)).toBe(1.3);
  });

  it("menahan nilai di dalam rentang", () => {
    expect(batasiSkala(0.2)).toBe(SKALA_MIN);
    expect(batasiSkala(5)).toBe(SKALA_MAKS);
  });

  it("mengembalikan 1 untuk nilai tidak valid", () => {
    expect(batasiSkala(Number.NaN)).toBe(1);
    expect(batasiSkala(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("normalisasiPreferensi", () => {
  it("memakai nilai awal untuk masukan yang bukan objek", () => {
    expect(normalisasiPreferensi(null)).toEqual(PREFERENSI_AWAL);
    expect(normalisasiPreferensi("abc")).toEqual(PREFERENSI_AWAL);
    expect(normalisasiPreferensi(42)).toEqual(PREFERENSI_AWAL);
  });

  it("hanya menerima boolean true untuk sakelar", () => {
    const hasil = normalisasiPreferensi({ kontras: "ya", abuAbu: 1, garisBawah: true });
    expect(hasil.kontras).toBe(false);
    expect(hasil.abuAbu).toBe(false);
    expect(hasil.garisBawah).toBe(true);
  });

  it("menormalkan skala yang tersimpan di luar rentang", () => {
    expect(normalisasiPreferensi({ skala: 9 }).skala).toBe(SKALA_MAKS);
    expect(normalisasiPreferensi({ skala: 0.1 }).skala).toBe(SKALA_MIN);
    expect(normalisasiPreferensi({ skala: "besar" }).skala).toBe(1);
  });
});
