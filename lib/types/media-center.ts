/**
 * Kontrak tipe untuk API Media Center HST (mediacenter.hstkab.go.id).
 *
 * PENTING: tipe di sini adalah bentuk NORMALISASI internal yang dipakai UI.
 * Bentuk mentah API Media Center berbeda (lihat catatan di lib/api/media-center.ts)
 * dan hanya boleh disentuh oleh adapter. UI tidak pernah tahu bentuk mentah.
 */

export interface Berita {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // HTML dari Media Center
  imageUrl: string | null;
  category: string;
  publishedAt: string; // ISO 8601
  sourceUrl: string; // URL kanonik di mediacenter.hstkab.go.id
  author: string;
}

export interface Pengumuman {
  id: string;
  slug: string;
  title: string;
  body: string; // HTML
  publishedAt: string; // ISO 8601
  link: string | null; // tautan eksternal opsional
}

export interface Hoaks {
  id: string;
  slug: string;
  title: string;
  claim: string;
  clarification: string;
  status: "HOAKS" | "KLARIFIKASI";
  publishedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface GetBeritaParams {
  page?: number;
  limit?: number;
  category?: string;
  q?: string;
}

export interface GetPengumumanParams {
  page?: number;
  limit?: number;
}

/**
 * Kontrak adapter. Ini SATU-SATUNYA pintu ke API Media Center HST.
 * Setiap implementasi wajib memvalidasi respons dengan Zod sebelum dipakai.
 */
export interface MediaCenterApi {
  getBerita(params?: GetBeritaParams): Promise<PaginatedResponse<Berita>>;
  getBeritaBySlug(slug: string): Promise<Berita | null>;
  getHoaks(params?: GetBeritaParams): Promise<PaginatedResponse<Hoaks>>;
  getPengumuman(params?: GetPengumumanParams): Promise<PaginatedResponse<Pengumuman>>;
  getKategori(): Promise<string[]>;
}
