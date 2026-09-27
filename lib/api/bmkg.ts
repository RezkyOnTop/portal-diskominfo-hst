import "server-only";

import { z } from "zod";
import type { PrakiraanCuaca, CuacaHari, CuacaSlot } from "@/types/cuaca";

/**
 * ============================================================================
 *  lib/api/bmkg.ts — SATU-SATUNYA tempat yang boleh memanggil api.bmkg.go.id.
 *  Tidak ada `fetch` ke domain tersebut di file lain.
 * ============================================================================
 *
 * Endpoint PUBLIK (tanpa API key, terverifikasi langsung):
 *   GET {BASE}/publik/prakiraan-cuaca?adm4={kode_wilayah_iv}
 *
 * Kode wilayah default = 63.07.06.1001 (Barabai Darat, Kec. Barabai) —
 * kelurahan TERDEKAT dari kantor Diskominfo (1,2 km). Benawa Tengah sendiri
 * belum terdaftar di BMKG, jadi Barabai Darat dipakai sebagai representasi
 * prakiraan wilayah kantor.
 *
 * Bentuk respons BMKG:
 *   { lokasi: {...}, data: [ { lokasi: {...}, cuaca: [ [slot, ...], ... ] } ] }
 *   `cuaca` = array hari; tiap hari = array slot per ~3 jam.
 *
 * Error BMKG TIDAK pernah diteruskan mentah ke client: semua kegagalan
 * dinormalisasi menjadi `CuacaError` dengan pesan generik.
 */

const TIMEOUT_MS = 8000;
const REVALIDATE = 1800; // 30 menit — prakiraan BMKG diperbarui beberapa kali/hari.
const GENERIC_MESSAGE =
  "Informasi cuaca sedang tidak dapat dimuat. Silakan cek langsung laman BMKG.";

/** Kode wilayah BMKG default (Barabai Darat) — bisa dioverride via env. */
export const DEFAULT_ADM4 = "63.07.06.1001";

export class CuacaError extends Error {
  readonly code: string;
  constructor(code: string, message: string = GENERIC_MESSAGE) {
    super(message);
    this.name = "CuacaError";
    this.code = code;
  }
}

/** Base URL API publik BMKG (bisa dioverride via env, mis. untuk pengujian). */
export function bmkgBaseUrl(): string {
  return (
    process.env.BMKG_API_BASE_URL?.replace(/\/+$/, "") ??
    "https://api.bmkg.go.id"
  );
}

/** Kode wilayah (adm4) yang dipakai; dari env atau default Barabai Darat. */
export function bmkgAdm4(): string {
  const v = process.env.BMKG_ADM4?.trim();
  return v && /^[0-9.]+$/.test(v) ? v : DEFAULT_ADM4;
}

// --- Skema Zod (validasi respons upstream) ---

/** Slot cuaca mentah BMKG. Semua angka boleh datang sebagai number/string. */
const angka = z.union([z.number(), z.string()]).transform((v) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
});

const SlotRawSchema = z.object({
  local_datetime: z.string(),
  utc_datetime: z.string().nullish(),
  t: angka, // suhu °C
  hu: angka, // kelembapan %
  ws: angka, // kecepatan angin km/jam
  wd: z.string().nullish(), // arah angin singkat
  wd_to: z.string().nullish(),
  weather: angka, // kode cuaca
  weather_desc: z.string().nullish(),
  image: z.string().nullish(), // URL ikon resmi BMKG
  time_index: z.string().nullish(),
  analysis_date: z.string().nullish(),
});

const LokasiSchema = z.object({
  adm1: z.string().nullish(),
  adm2: z.string().nullish(),
  adm3: z.string().nullish(),
  adm4: z.string().nullish(),
  provinsi: z.string().nullish(),
  kotkab: z.string().nullish(),
  kecamatan: z.string().nullish(),
  desa: z.string().nullish(),
  kelurahan: z.string().nullish(),
  lon: z.union([z.number(), z.string()]).nullish(),
  lat: z.union([z.number(), z.string()]).nullish(),
  timezone: z.string().nullish(),
});

const ResponseSchema = z.object({
  lokasi: LokasiSchema,
  data: z
    .array(
      z.object({
        lokasi: LokasiSchema.optional(),
        cuaca: z.array(z.array(SlotRawSchema)),
      }),
    )
    .min(1),
});

// --- Pemetaan arah angin (kode BMKG -> Bahasa Indonesia) ---

const ARAH_ANGIN: Record<string, string> = {
  N: "Utara",
  NNE: "Utara-Timur Laut",
  NE: "Timur Laut",
  ENE: "Timur-Timur Laut",
  E: "Timur",
  ESE: "Timur-Tenggara",
  SE: "Tenggara",
  SSE: "Selatan-Tenggara",
  S: "Selatan",
  SSW: "Selatan-Barat Daya",
  SW: "Barat Daya",
  WSW: "Barat-Barat Daya",
  W: "Barat",
  WNW: "Barat-Barat Laut",
  NW: "Barat Laut",
  NNW: "Utara-Barat Laut",
};

function arahAnginText(kode: string | null | undefined): string {
  if (!kode) return "";
  return ARAH_ANGIN[kode.toUpperCase()] ?? kode;
}

const HARI_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;
const BULAN_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

/**
 * Ambil bagian tanggal & jam dari string waktu lokal BMKG.
 * Format BMKG: "2026-09-28 10:00:00" (tanpa sufiks zona).
 */
function pisahWaktu(local: string): { tanggal: string; jam: string; iso: string } {
  const [tgl = "", jamRaw = "00:00:00"] = local.trim().split(" ");
  const jam = jamRaw.slice(0, 5); // "10:00"
  return { tanggal: tgl, jam, iso: `${tgl}T${jamRaw || "00:00:00"}+08:00` };
}

/**
 * Label hari Bahasa Indonesia dari tanggal "YYYY-MM-DD".
 *
 * PENTING: hari dihitung dari TANGGAL KALENDER, bukan dari instan waktu.
 * `new Date("2026-09-28T00:00:00+08:00").getUTCDay()` akan memberi hari UTC
 * (27 Sep = Minggu) sehingga label meleset satu hari. Karena itu komponen
 * tanggal dipakai langsung lewat Date.UTC — bebas dari zona waktu server.
 */
function labelHari(tanggal: string, index: number): string {
  if (index === 0) return "Hari ini";
  if (index === 1) return "Besok";
  const [y, m, d] = tanggal.split("-").map(Number);
  if (!y || !m || !d) return tanggal;
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return HARI_ID[day] ?? tanggal;
}

/** Label tanggal pendek, mis. "28 Sep". */
function labelTanggal(tanggal: string): string {
  const [, bulan, hari] = tanggal.split("-");
  if (!bulan || !hari) return tanggal;
  const b = BULAN_ID[Number(bulan) - 1] ?? bulan;
  return `${Number(hari)} ${b}`;
}

/** Normalisasi satu slot mentah ke bentuk internal. */
function normalizeSlot(raw: z.infer<typeof SlotRawSchema>): CuacaSlot {
  const { jam, iso } = pisahWaktu(raw.local_datetime);
  return {
    jam,
    iso,
    suhu: Math.round(raw.t),
    kode: raw.weather,
    deskripsi: raw.weather_desc?.trim() || "Tidak diketahui",
    kelembapan: Math.round(raw.hu),
    angin: Math.round(raw.ws),
    arahAngin: raw.wd?.trim() ?? "",
    arahAnginText: arahAnginText(raw.wd),
    ikon: raw.image?.trim() ?? "",
  };
}

/** Rangkum cuaca sehari: deskripsi yang paling sering muncul. */
function ringkasHari(slot: CuacaSlot[]): string {
  const hitung = new Map<string, number>();
  for (const s of slot) hitung.set(s.deskripsi, (hitung.get(s.deskripsi) ?? 0) + 1);
  let best = "";
  let max = -1;
  for (const [desc, n] of hitung) {
    if (n > max) {
      max = n;
      best = desc;
    }
  }
  return best || "Tidak diketahui";
}

/**
 * Normalisasi respons BMKG menjadi `PrakiraanCuaca`.
 *
 * Toleran: hari tanpa slot valid tetap disertakan selama ada minimal satu
 * slot; hari kosong dibuang agar UI tidak menampilkan kartu kosong.
 */
function normalize(raw: z.infer<typeof ResponseSchema>): PrakiraanCuaca {
  const lok = raw.data[0]?.lokasi ?? raw.lokasi;
  const hariRaw = raw.data[0]?.cuaca ?? [];

  const hari: CuacaHari[] = [];
  hariRaw.forEach((slots, i) => {
    const valid = slots.map(normalizeSlot);
    if (valid.length === 0) return;
    const suhu = valid.map((s) => s.suhu);
    const tanggal = pisahWaktu(slots[0]!.local_datetime).tanggal;
    hari.push({
      tanggal,
      label: labelHari(tanggal, i),
      labelTanggal: labelTanggal(tanggal),
      slot: valid,
      min: Math.min(...suhu),
      max: Math.max(...suhu),
      ringkas: ringkasHari(valid),
    });
  });

  return {
    desa: lok?.desa?.trim() || lok?.kelurahan?.trim() || "Barabai",
    kecamatan: lok?.kecamatan?.trim() || "Barabai",
    kotkab: lok?.kotkab?.trim() || "Hulu Sungai Tengah",
    provinsi: lok?.provinsi?.trim() || "Kalimantan Selatan",
    adm4: lok?.adm4?.trim() || bmkgAdm4(),
    analisis: raw.data[0]?.cuaca?.[0]?.[0]?.analysis_date ?? "",
    hari,
  };
}

// --- Cache in-memory ber-TTL dengan stale-while-error ---
interface CacheEntry {
  data: PrakiraanCuaca;
  expires: number;
}
const memoryCache = new Map<string, CacheEntry>();

async function fetchCuaca(adm4: string): Promise<PrakiraanCuaca> {
  const url = `${bmkgBaseUrl()}/publik/prakiraan-cuaca?adm4=${encodeURIComponent(adm4)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let json: unknown;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) throw new CuacaError(`HTTP_${res.status}`);
    try {
      json = await res.json();
    } catch {
      throw new CuacaError("INVALID_JSON");
    }
  } catch (err) {
    if (err instanceof CuacaError) {
      console.error(`[bmkg] prakiraan-cuaca gagal: ${err.code}`);
      throw err;
    }
    const code =
      err instanceof Error && err.name === "AbortError" ? "TIMEOUT" : "NETWORK";
    console.error(`[bmkg] prakiraan-cuaca gagal: ${code}`, err);
    throw new CuacaError(code);
  } finally {
    clearTimeout(timer);
  }

  const parsed = ResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.error("[bmkg] bentuk respons tidak sesuai skema");
    throw new CuacaError("INVALID_SHAPE");
  }
  return normalize(parsed.data);
}

/**
 * Ambil prakiraan cuaca. Gagal total -> `degraded: true` dengan `data: null`
 * (UI menampilkan fallback + tautan BMKG), bukan error 500.
 */
export async function getPrakiraanCuaca(
  adm4: string = bmkgAdm4(),
): Promise<{ data: PrakiraanCuaca | null; degraded: boolean }> {
  const now = Date.now();
  const cached = memoryCache.get(adm4);
  if (cached && cached.expires > now) {
    return { data: cached.data, degraded: false };
  }
  try {
    const data = await fetchCuaca(adm4);
    memoryCache.set(adm4, { data, expires: now + REVALIDATE * 1000 });
    return { data, degraded: false };
  } catch (err) {
    if (cached) {
      console.error("[bmkg] gagal; memakai cache lama", err);
      return { data: cached.data, degraded: true };
    }
    return { data: null, degraded: true };
  }
}

/** Kosongkan cache in-memory (dipakai pengujian). */
export function __clearCuacaCache(): void {
  memoryCache.clear();
}

/** URL halaman prakiraan BMKG untuk kode wilayah tertentu (tautan "sumber"). */
export function bmkgPageUrl(adm4: string = bmkgAdm4()): string {
  return `https://www.bmkg.go.id/cuaca/prakiraan-cuaca/${adm4}`;
}

/**
 * Pilih slot prakiraan yang paling dekat dengan waktu sekarang (WITA).
 * Dipakai widget untuk menampilkan "cuaca saat ini" dari slot per-3-jam BMKG.
 * Murni (tanpa efek samping) sehingga mudah diuji.
 */
export function slotTerdekat(
  hari: CuacaHari[],
  now: Date = new Date(),
): CuacaSlot | null {
  const semua = hari.flatMap((h) => h.slot);
  if (semua.length === 0) return null;
  const target = now.getTime();
  let best = semua[0]!;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const s of semua) {
    const t = new Date(s.iso).getTime();
    if (Number.isNaN(t)) continue;
    const diff = Math.abs(t - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = s;
    }
  }
  return best;
}
