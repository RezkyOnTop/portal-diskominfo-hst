import "server-only";

import {
  BeritaItemSchema,
  PengumumanItemSchema,
  type RawBerita,
  type RawPengumuman,
} from "@/lib/validations/media-center.schema";
import type {
  Berita,
  GetBeritaParams,
  GetPengumumanParams,
  Hoaks,
  MediaCenterApi,
  PaginatedResponse,
  Pengumuman,
} from "@/types/media-center";

/**
 * ============================================================================
 *  lib/api/media-center.ts — SATU-SATUNYA tempat yang boleh memanggil
 *  mediacenter.hstkab.go.id. Tidak ada `fetch` ke domain tersebut di file lain.
 * ============================================================================
 *
 * Bentuk MENTAH API Media Center (hasil verifikasi langsung):
 *   GET {BASE}/api/berita      -> array polos, item:
 *       { id_berita, tanggal:"YYYY-MM-DD HH:mm:ss", title, isi(HTML),
 *         foto(nama file), link, slug, author, kategori_id(nama kategori) }
 *   GET {BASE}/api/pengumuman  -> array polos, item:
 *       { id_pengumuman, tanggal, title, slug, isi(HTML), link }
 *   Gambar: https://data-mediacenter.hstkab.go.id/assets/foto_brt/{foto}
 *           (host GAMBAR != host API — lihat imageBaseUrl)
 *   Halaman detail: {BASE}/berita/{slug}
 *
 * CATATAN PENTING (berbeda dari asumsi awal dokumen):
 *   - Tidak ada endpoint `/api/hoaks`. `getHoaks()` diturunkan dari berita dan
 *     saat ini mengembalikan daftar kosong. Bila tim Media Center menambah
 *     endpoint hoaks, cukup ubah fungsi ini — UI tidak tersentuh.
 *   - API tidak menyediakan paginasi server-side (mengembalikan ~1357 berita,
 *     ~4.7 MB). Paginasi dilakukan di adapter.
 *   - Respons > 2 MB sehingga cache bawaan `fetch` Next.js tidak menyimpannya.
 *     Karena itu adapter memakai cache in-memory ber-TTL + strategi
 *     stale-while-error agar tidak membebani API dan tetap tahan gangguan.
 *
 * Error dari Media Center TIDAK pernah diteruskan mentah ke client: semua
 * kegagalan dinormalisasi menjadi `MediaCenterError` dengan pesan generik.
 */

const REVALIDATE_BERITA = 3600; // 1 jam (berita & pengumuman)
const TIMEOUT_MS = 8000;

const GENERIC_MESSAGE =
  "Layanan informasi sedang tidak tersedia. Silakan coba beberapa saat lagi.";

export class MediaCenterError extends Error {
  readonly code: string;
  constructor(code: string, message: string = GENERIC_MESSAGE) {
    super(message);
    this.name = "MediaCenterError";
    this.code = code;
  }
}

function baseUrl(): string {
  return (
    process.env.MEDIA_CENTER_API_BASE_URL?.replace(/\/+$/, "") ??
    "https://mediacenter.hstkab.go.id"
  );
}

/**
 * Host GAMBAR berbeda dari host API (terverifikasi langsung).
 * API:    https://mediacenter.hstkab.go.id
 * Gambar: https://data-mediacenter.hstkab.go.id/assets/foto_brt/{foto}
 * (Dibaca dari bundle JS frontend Media Center; memakai host API = 404.)
 */
function imageBaseUrl(): string {
  return (
    process.env.MEDIA_CENTER_IMAGE_BASE_URL?.replace(/\/+$/, "") ??
    "https://data-mediacenter.hstkab.go.id"
  );
}

function toIso(tanggal: string): string {
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(tanggal)
    ? tanggal.replace(" ", "T")
    : tanggal;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function imageUrl(foto: string): string | null {
  if (!foto || !foto.trim()) return null;
  if (/^https?:\/\//i.test(foto)) return foto;
  return `${imageBaseUrl()}/assets/foto_brt/${foto.replace(/^\/+/, "")}`;
}

function normalizeBerita(raw: RawBerita): Berita {
  return {
    id: raw.id_berita,
    slug: raw.slug,
    title: raw.title,
    excerpt: "",
    content: raw.isi,
    imageUrl: imageUrl(raw.foto),
    category: raw.kategori_id || "Umum",
    publishedAt: toIso(raw.tanggal),
    sourceUrl: `${baseUrl()}/berita/${raw.slug}`,
    author: raw.author || "",
  };
}

function normalizePengumuman(raw: RawPengumuman): Pengumuman {
  return {
    id: raw.id_pengumuman,
    slug: raw.slug,
    title: raw.title,
    body: raw.isi,
    publishedAt: toIso(raw.tanggal),
    link: raw.link && raw.link.trim() ? raw.link : null,
  };
}

/** Ambil array MENTAH dari Media Center (timeout + error normalisasi). */
async function fetchArray(path: string, ttlSeconds: number): Promise<unknown[]> {
  const url = `${baseUrl()}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      // Respons > 2 MB tidak dapat disimpan cache bawaan Next.js, jadi cache
      // ditangani sendiri (lihat fetchArrayCached). `next.revalidate` memberi
      // tahu Next bahwa fetch ini BOLEH di-cache saat prerender/ISR — tanpa
      // ini beranda tidak bisa statis dan selalu render dinamis (TTFB tinggi).
      next: { revalidate: ttlSeconds },
    });
    if (!res.ok) throw new MediaCenterError(`HTTP_${res.status}`);
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      throw new MediaCenterError("INVALID_JSON");
    }
    if (!Array.isArray(json)) throw new MediaCenterError("INVALID_SHAPE");
    return json;
  } catch (err) {
    if (err instanceof MediaCenterError) {
      console.error(`[media-center] ${path} gagal: ${err.code}`);
      throw err;
    }
    const code =
      err instanceof Error && err.name === "AbortError" ? "TIMEOUT" : "NETWORK";
    console.error(`[media-center] ${path} gagal: ${code}`, err);
    throw new MediaCenterError(code);
  } finally {
    clearTimeout(timer);
  }
}

// --- Cache in-memory ber-TTL dengan stale-while-revalidate ---
//
// Kenapa begini (diukur langsung):
//   - API Media Center mengirim SELURUH feed dalam satu respons (~3,5 MB,
//     ~4 detik). Tidak ada paginasi server-side, jadi feed ini wajib di-cache.
//   - Respons > 2 MB sehingga cache `fetch` bawaan Next.js TIDAK menyimpannya;
//     satu-satunya cache adalah Map di bawah.
//   - Dua masalah nyata yang membuat navigasi terasa macet:
//       1. THUNDERING HERD: satu halaman sering meminta dua hal sekaligus
//          (mis. `Promise.all([getBerita(), getKategori()])`). Tanpa dedup,
//          keduanya melihat cache kosong lalu masing-masing mengunduh 3,5 MB
//          — total ~8 detik, bukan ~4.
//       2. BLOKIR SAAT BASI: begitu TTL habis, permintaan berikutnya menunggu
//          unduhan penuh sebelum halaman dirender.
//     Perbaikan: `inFlight` membuat pemanggil bersamaan berbagi SATU unduhan,
//     dan data basi disajikan SEKARANG sambil disegarkan di latar belakang.
interface CacheEntry {
  data: unknown[] | null;
  expires: number;
  inFlight: Promise<unknown[]> | null;
}
const memoryCache = new Map<string, CacheEntry>();

function refresh(path: string, ttlSeconds: number): Promise<unknown[]> {
  return fetchArray(path, ttlSeconds)
    .then((data) => {
      memoryCache.set(path, {
        data,
        expires: Date.now() + ttlSeconds * 1000,
        inFlight: null,
      });
      return data;
    })
    .catch((err) => {
      const prev = memoryCache.get(path);
      if (prev) prev.inFlight = null; // biarkan percobaan berikutnya mencoba lagi
      throw err;
    });
}

async function fetchArrayCached(path: string, ttlSeconds: number): Promise<unknown[]> {
  const now = Date.now();
  const entry = memoryCache.get(path);

  // 1. Masih segar -> langsung sajikan.
  if (entry?.data && entry.expires > now) return entry.data;

  // 2. Ada data tapi sudah basi -> sajikan stale SEKARANG, segarkan di latar.
  if (entry?.data) {
    if (!entry.inFlight) {
      entry.inFlight = refresh(path, ttlSeconds).catch((err) => {
        // Gagal menyegarkan -> tetap pakai data lama (stale-while-error).
        console.error(
          `[media-center] ${path} gagal disegarkan: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        return entry.data as unknown[];
      });
    }
    return entry.data;
  }

  // 3. Belum ada data sama sekali (cold start) -> unduh; pemanggil bersamaan
  //    berbagi satu unduhan yang sama, bukan dua.
  if (entry?.inFlight) return entry.inFlight;

  const p = refresh(path, ttlSeconds);
  memoryCache.set(path, { data: null, expires: 0, inFlight: p });
  try {
    return await p;
  } catch (err) {
    if (memoryCache.get(path)?.inFlight === p) memoryCache.delete(path);
    throw err;
  }
}

function paginate<T>(items: T[], page: number, perPage: number): PaginatedResponse<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  return {
    data: items.slice(start, start + perPage),
    meta: { page: safePage, perPage, total, totalPages },
  };
}

/**
 * Parsing toleran per-item: satu item cacat TIDAK menggagalkan seluruh feed.
 * Ini penting karena API Media Center mengirim ribuan item dalam satu respons.
 */
function parseBerita(raw: unknown[]): Berita[] {
  const items: Berita[] = [];
  let invalid = 0;
  for (const item of raw) {
    const r = BeritaItemSchema.safeParse(item);
    if (r.success) items.push(normalizeBerita(r.data));
    else invalid++;
  }
  if (invalid > 0) {
    console.warn(`[media-center] /api/berita: ${invalid} item dilewati (tidak valid)`);
  }
  return items.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

function parsePengumuman(raw: unknown[]): Pengumuman[] {
  const items: Pengumuman[] = [];
  for (const item of raw) {
    const r = PengumumanItemSchema.safeParse(item);
    if (r.success) items.push(normalizePengumuman(r.data));
  }
  return items.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

async function loadBerita(): Promise<Berita[]> {
  const raw = await fetchArrayCached("/api/berita", REVALIDATE_BERITA);
  return parseBerita(raw);
}

export const mediaCenterApi: MediaCenterApi = {
  async getBerita(params: GetBeritaParams = {}): Promise<PaginatedResponse<Berita>> {
    const { page = 1, limit = 9, category, q } = params;
    let items = await loadBerita();
    if (category) {
      const target = category.toLowerCase();
      items = items.filter((b) => b.category.toLowerCase() === target);
    }
    if (q) {
      const needle = q.toLowerCase();
      items = items.filter(
        (b) =>
          b.title.toLowerCase().includes(needle) ||
          b.content.toLowerCase().includes(needle),
      );
    }
    return paginate(items, page, limit);
  },

  async getBeritaBySlug(slug: string): Promise<Berita | null> {
    const items = await loadBerita();
    return items.find((b) => b.slug === slug) ?? null;
  },

  async getHoaks(params: GetBeritaParams = {}): Promise<PaginatedResponse<Hoaks>> {
    const { page = 1, limit = 9 } = params;
    const items = await loadBerita();
    const keywords = ["hoaks", "hoax", "klarifikasi", "disinformasi"];
    const hoaks: Hoaks[] = items
      .filter((b) => {
        const hay = `${b.category} ${b.title}`.toLowerCase();
        return keywords.some((k) => hay.includes(k));
      })
      .map((b) => ({
        id: b.id,
        slug: b.slug,
        title: b.title,
        claim: b.title,
        clarification: b.content,
        status: "KLARIFIKASI" as const,
        publishedAt: b.publishedAt,
      }));
    return paginate(hoaks, page, limit);
  },

  async getPengumuman(
    params: GetPengumumanParams = {},
  ): Promise<PaginatedResponse<Pengumuman>> {
    const { page = 1, limit = 10 } = params;
    const raw = await fetchArrayCached("/api/pengumuman", REVALIDATE_BERITA);
    const items = parsePengumuman(raw);
    return paginate(items, page, limit);
  },

  async getKategori(): Promise<string[]> {
    const items = await loadBerita();
    return Array.from(new Set(items.map((b) => b.category))).sort((a, b) =>
      a.localeCompare(b, "id"),
    );
  },
};

// --- Ekspor fungsi bernama (memudahkan import langsung & pengujian) ---
export const getBerita = mediaCenterApi.getBerita;
export const getBeritaBySlug = mediaCenterApi.getBeritaBySlug;
export const getHoaks = mediaCenterApi.getHoaks;
export const getPengumuman = mediaCenterApi.getPengumuman;
export const getKategori = mediaCenterApi.getKategori;

/** Kosongkan cache in-memory (dipakai pengujian). */
export function __clearMediaCenterCache(): void {
  memoryCache.clear();
}
