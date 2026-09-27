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
 *   GET {BASE}/assets/foto_brt/{foto}  -> gambar berita
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
  return `${baseUrl()}/assets/foto_brt/${foto.replace(/^\/+/, "")}`;
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
async function fetchArray(path: string): Promise<unknown[]> {
  const url = `${baseUrl()}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      // Respons > 2 MB tidak dapat disimpan cache bawaan Next.js; cache
      // ditangani sendiri (lihat fetchArrayCached). Karena itu no-store.
      cache: "no-store",
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

// --- Cache in-memory ber-TTL dengan stale-while-error ---
interface CacheEntry {
  data: unknown[];
  expires: number;
}
const memoryCache = new Map<string, CacheEntry>();

async function fetchArrayCached(path: string, ttlSeconds: number): Promise<unknown[]> {
  const now = Date.now();
  const cached = memoryCache.get(path);
  if (cached && cached.expires > now) return cached.data;
  try {
    const data = await fetchArray(path);
    memoryCache.set(path, { data, expires: now + ttlSeconds * 1000 });
    return data;
  } catch (err) {
    if (cached) {
      // Stale-while-error: sajikan data lama daripada gagal total.
      console.error(`[media-center] ${path} gagal; memakai cache lama`);
      return cached.data;
    }
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
