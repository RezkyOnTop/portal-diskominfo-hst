/**
 * Kontrak tipe untuk API publik Open Data HST (opendata.hstkab.go.id).
 *
 * PENTING: tipe di sini adalah bentuk NORMALISASI internal yang dipakai UI.
 * Bentuk mentah API Open Data berbeda dan hanya boleh disentuh oleh adapter
 * (lib/api/opendata.ts). UI tidak pernah tahu bentuk mentah.
 */

export interface OpenDataDataset {
  id: string;
  slug: string;
  judul: string;
  deskripsi: string;
  instansi: string;
  kategori: string;
  tahun: string;
  jenisData: string;
  updatedAt: string | null;
  views: number;
  /** Tautan ke halaman dataset di portal Open Data HST. */
  url: string;
}

export interface OpenDataMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface OpenDataFilter {
  kategori: string[];
  instansi: string[];
}

export interface OpenDataPage {
  data: OpenDataDataset[];
  meta: OpenDataMeta;
  filters: OpenDataFilter;
}

export interface GetDatasetParams {
  page?: number;
  limit?: number;
  kategori?: string;
  instansi?: string;
  tahun?: string;
  search?: string;
}
