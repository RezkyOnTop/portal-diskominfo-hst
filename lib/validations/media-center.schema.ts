import { z } from "zod";

/**
 * Skema Zod untuk validasi respons MENTAH dari API Media Center HST.
 *
 * Bentuk nyata (per hasil verifikasi):
 *  - GET /api/berita      -> array polos
 *    { id_berita, tanggal, title, isi, foto, link, slug, author, kategori_id }
 *  - GET /api/pengumuman  -> array polos
 *    { id_pengumuman, tanggal, title, slug, isi, link }
 *
 * Catatan: `kategori_id` berisi NAMA kategori (mis. "Pemerintahan"), bukan angka.
 * Skema dibuat toleran: field opsional diberi default agar perubahan kecil pada
 * API tidak langsung merobohkan halaman.
 */

export const BeritaItemSchema = z.object({
  id_berita: z.union([z.string(), z.number()]).transform((v) => String(v)),
  tanggal: z.string().min(1),
  title: z.string().min(1),
  isi: z.string().default(""),
  foto: z.string().default(""),
  link: z.string().default(""),
  slug: z.string().min(1),
  author: z.string().default(""),
  kategori_id: z.string().default("Umum"),
});

export const BeritaListSchema = z.array(BeritaItemSchema);

export const PengumumanItemSchema = z.object({
  id_pengumuman: z.union([z.string(), z.number()]).transform((v) => String(v)),
  tanggal: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  isi: z.string().default(""),
  link: z.string().default(""),
});

export const PengumumanListSchema = z.array(PengumumanItemSchema);

export type RawBerita = z.infer<typeof BeritaItemSchema>;
export type RawPengumuman = z.infer<typeof PengumumanItemSchema>;
