import "server-only";

import { z } from "zod";
import type {
  OpenDataDataset,
  OpenDataFilter,
  OpenDataPage,
  GetDatasetParams,
} from "@/types/opendata";

/**
 * ============================================================================
 *  lib/api/opendata.ts — SATU-SATUNYA tempat yang boleh memanggil
 *  opendata.hstkab.go.id. Tidak ada `fetch` ke domain tersebut di file lain.
 * ============================================================================
 *
 * Endpoint PUBLIK (tanpa API key, terverifikasi langsung):
 *   GET {BASE}/api/public/datasets?page=&limit=&kategori=&instansi=&tahun=&search=
 *     -> { success, data[], metadata{total,page,limit,total_pages}, filters{...} }
 *
 * Item dataset:
 *   { id, judul, slug, deskripsi(HTML), instansi, kategori, tahun, jenis_data,
 *     file_url, created_at, updated_at, views, status }
 *
 * Endpoint TIDAK tersedia: /api/public/datasets/{slug} -> 404 "Dataset not found".
 * Karena itu kartu dataset menautkan ke halaman publik portal Open Data
 * (tautan dibuat dari slug), bukan mengambil detail per-item.
 *
 * Error Open Data TIDAK pernah diteruskan mentah ke client: semua kegagalan
 * dinormalisasi menjadi `OpenDataError` dengan pesan generik.
 */

const TIMEOUT_MS = 8000;
const REVALIDATE = 3600; // 1 jam — katalog dataset jarang berubah.
const GENERIC_MESSAGE =
  "Data terbuka sedang tidak dapat dimuat. Silakan buka portal Open Data HST.";

export class OpenDataError extends Error {
  readonly code: string;
  constructor(code: string, message: string = GENERIC_MESSAGE) {
    super(message);
    this.name = "OpenDataError";
    this.code = code;
  }
}

/** Base URL portal Open Data (bisa dioverride via env). */
export function openDataBaseUrl(): string {
  return (
    process.env.OPENDATA_API_BASE_URL?.replace(/\/+$/, "") ??
    "https://opendata.hstkab.go.id"
  );
}

// --- Skema Zod (validasi respons upstream) ---

/** Koersi angka/tahun yang datang sebagai string. */
const angka = z.union([z.number(), z.string()]).transform((v) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
});

const DatasetRawSchema = z.object({
  id: z.string(),
  judul: z.string().min(1),
  // Slug TIDAK selalu ada — sekitar 24% dataset di portal tidak punya slug.
  // Jangan buang dataset valid hanya karena slug kosong; URL memakai id sebagai
  // fallback (portal menerima keduanya: /public/datasets/{slug|id}).
  slug: z.string().nullish(),
  deskripsi: z.string().nullish(),
  instansi: z.string().nullish(),
  kategori: z.string().nullish(),
  tahun: z.union([z.string(), z.number()]).nullish(),
  jenis_data: z.string().nullish(),
  file_url: z.string().nullish(),
  updated_at: z.string().nullish(),
  views: angka.optional(),
  status: z.string().nullish(),
});

const MetadataSchema = z.object({
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  total_pages: z.number().optional(),
});

const ResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(z.unknown()),
  metadata: MetadataSchema.optional(),
  filters: z
    .object({
      kategori: z.array(z.string()).optional(),
      instansi: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Bersihkan deskripsi HTML menjadi teks pendek.
 *
 * Data di portal Open Data sebagian diisi otomatis oleh AI dan menyisipkan
 * kalimat pembuka yang tidak informatif (mis. "Berikut adalah kode HTML rapi
 * dari teks yang diberikan:"). Kalimat semacam itu dibuang agar kartu dataset
 * menampilkan isi yang berguna.
 */
function ringkas(html: string | null | undefined, max = 180): string {
  if (!html) return "";
  let text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  // Buang kalimat pembuka bergaya AI yang tidak informatif.
  text = text.replace(
    /^(berikut (adalah|ini)[^.:]*?[:.]\s*)/i,
    "",
  );
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** Normalisasi satu item dataset ke bentuk internal. */
function normalize(raw: z.infer<typeof DatasetRawSchema>): OpenDataDataset {
  const jenis = (raw.jenis_data ?? "").toLowerCase();
  const slug = raw.slug?.trim();
  // Portal menerima slug MAUPUN id di /public/datasets/{...}.
  const ident = slug && slug.length > 0 ? slug : raw.id;
  return {
    id: raw.id,
    slug: slug ?? "",
    judul: raw.judul,
    deskripsi: ringkas(raw.deskripsi),
    instansi: raw.instansi?.trim() || "Pemerintah Kabupaten HST",
    kategori: raw.kategori?.trim() || "Lainnya",
    tahun: raw.tahun != null ? String(raw.tahun) : "",
    jenisData: jenis || "data",
    updatedAt: raw.updated_at ?? null,
    views: raw.views ?? 0,
    url: `${openDataBaseUrl()}/public/datasets/${ident}`,
  };
}

/**
 * Parsing toleran per-item: satu item cacat tidak menggagalkan seluruh halaman.
 */
function parseDatasets(raw: unknown[]): OpenDataDataset[] {
  const out: OpenDataDataset[] = [];
  let invalid = 0;
  for (const item of raw) {
    const r = DatasetRawSchema.safeParse(item);
    if (r.success) out.push(normalize(r.data));
    else invalid++;
  }
  if (invalid > 0) {
    console.warn(`[opendata] ${invalid} dataset dilewati (tidak valid)`);
  }
  return out;
}

// --- Cache in-memory ber-TTL dengan stale-while-error ---
interface CacheEntry {
  data: OpenDataPage;
  expires: number;
}
const memoryCache = new Map<string, CacheEntry>();

async function fetchDatasets(params: GetDatasetParams): Promise<OpenDataPage> {
  const url = new URL(`${openDataBaseUrl()}/api/public/datasets`);
  url.searchParams.set("page", String(params.page ?? 1));
  url.searchParams.set("limit", String(params.limit ?? 12));
  if (params.kategori) url.searchParams.set("kategori", params.kategori);
  if (params.instansi) url.searchParams.set("instansi", params.instansi);
  if (params.tahun) url.searchParams.set("tahun", params.tahun);
  if (params.search) url.searchParams.set("search", params.search);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let json: unknown;
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) throw new OpenDataError(`HTTP_${res.status}`);
    try {
      json = await res.json();
    } catch {
      throw new OpenDataError("INVALID_JSON");
    }
  } catch (err) {
    if (err instanceof OpenDataError) {
      console.error(`[opendata] /api/public/datasets gagal: ${err.code}`);
      throw err;
    }
    const code = err instanceof Error && err.name === "AbortError" ? "TIMEOUT" : "NETWORK";
    console.error(`[opendata] /api/public/datasets gagal: ${code}`, err);
    throw new OpenDataError(code);
  } finally {
    clearTimeout(timer);
  }

  const parsed = ResponseSchema.safeParse(json);
  if (!parsed.success) throw new OpenDataError("INVALID_SHAPE");

  const meta = parsed.data.metadata ?? {};
  const limit = params.limit ?? 12;
  const total = meta.total ?? 0;
  return {
    data: parseDatasets(parsed.data.data),
    meta: {
      page: meta.page ?? params.page ?? 1,
      perPage: meta.limit ?? limit,
      total,
      totalPages: meta.total_pages ?? Math.max(1, Math.ceil(total / limit)),
    },
    filters: {
      kategori: parsed.data.filters?.kategori ?? [],
      instansi: parsed.data.filters?.instansi ?? [],
    },
  };
}

/**
 * Ambil daftar dataset terbuka. Gagal total -> `degraded: true` dengan data
 * kosong (UI menampilkan fallback + tautan ke portal), bukan error 500.
 */
export async function getDatasets(
  params: GetDatasetParams = {},
): Promise<OpenDataPage & { degraded: boolean }> {
  const key = JSON.stringify({
    p: params.page ?? 1,
    l: params.limit ?? 12,
    k: params.kategori ?? "",
    i: params.instansi ?? "",
    t: params.tahun ?? "",
    s: params.search ?? "",
  });
  const now = Date.now();
  const cached = memoryCache.get(key);
  if (cached && cached.expires > now) {
    return { ...cached.data, degraded: false };
  }
  try {
    const page = await fetchDatasets(params);
    memoryCache.set(key, { data: page, expires: now + REVALIDATE * 1000 });
    return { ...page, degraded: false };
  } catch (err) {
    if (cached) {
      console.error("[opendata] gagal; memakai cache lama", err);
      return { ...cached.data, degraded: true };
    }
    return {
      data: [],
      meta: { page: params.page ?? 1, perPage: params.limit ?? 12, total: 0, totalPages: 1 },
      filters: { kategori: [], instansi: [] },
      degraded: true,
    };
  }
}

/** Ambil daftar kategori & instansi (dari respons kosong/1 item). */
export async function getFilterDataset(): Promise<OpenDataFilter> {
  const page = await getDatasets({ limit: 1 });
  return page.filters;
}

/** Kosongkan cache in-memory (dipakai pengujian). */
export function __clearOpenDataCache(): void {
  memoryCache.clear();
}
