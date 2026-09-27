/**
 * Galeri foto — diturunkan dari arsip berita Media Center HST.
 *
 * Media Center TIDAK punya endpoint galeri (semua /api/galeri* → 404),
 * jadi galeri dibangun dari foto berita yang sudah tersedia. Adapter ini
 * memakai ulang lib/api/media-center.ts (tidak menyentuh host upstream
 * sendiri) sehingga aturan isolasi tetap terjaga.
 */

import { getBerita } from "@/lib/api/media-center";

export interface FotoGaleri {
  id: string;
  imageUrl: string;
  title: string;
  /** Kategori berita (dipakai sebagai filter album). */
  album: string;
  /** Halaman berita terkait. */
  href: string;
  publishedAt: string;
}

export interface GaleriParams {
  /** Batasi ke album/kategori tertentu. */
  album?: string;
  page?: number;
  limit?: number;
}

export interface GaleriResult {
  data: FotoGaleri[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
  albums: string[];
}

/**
 * Ambil foto galeri. Hanya berita yang punya foto yang disertakan.
 * Tidak pernah melempar — kegagalan upstream → galeri kosong.
 */
export async function getGaleri(params: GaleriParams = {}): Promise<GaleriResult> {
  const { album, page = 1, limit = 12 } = params;
  const empty: GaleriResult = {
    data: [],
    meta: { page: 1, perPage: limit, total: 0, totalPages: 1 },
    albums: [],
  };

  try {
    const res = await getBerita({ page: 1, limit: 500 });
    let items: FotoGaleri[] = res.data
      .filter((b) => Boolean(b.imageUrl))
      .map((b) => ({
        id: b.id,
        imageUrl: b.imageUrl as string,
        title: b.title,
        album: b.category || "Umum",
        href: `/berita/${b.slug}`,
        publishedAt: b.publishedAt,
      }));

    const albums = Array.from(new Set(items.map((i) => i.album))).sort((a, b) =>
      a.localeCompare(b, "id"),
    );

    if (album) {
      const target = album.toLowerCase();
      items = items.filter((i) => i.album.toLowerCase() === target);
    }

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * limit;

    return {
      data: items.slice(start, start + limit),
      meta: { page: safePage, perPage: limit, total, totalPages },
      albums,
    };
  } catch {
    return empty;
  }
}
