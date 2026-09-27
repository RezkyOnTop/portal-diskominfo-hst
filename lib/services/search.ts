/**
 * Pencarian global lintas-sumber: berita (Media Center), pengumuman
 * (Media Center), dan halaman statis (profil/layanan).
 *
 * Semua panggilan Media Center lewat adapter (lib/api/media-center.ts);
 * halaman statis diambil dari indeks lokal agar pencarian tetap bekerja
 * walau upstream bermasalah.
 */

import { getBerita, getPengumuman } from "@/lib/api/media-center";

export interface HasilCari {
  kind: "berita" | "pengumuman" | "halaman";
  id: string;
  title: string;
  excerpt: string;
  href: string;
  category?: string;
  publishedAt?: string;
}

export interface CariParams {
  q: string;
  /** Batasi jenis hasil; kosong = semua. */
  jenis?: ("berita" | "pengumuman" | "halaman")[];
  /** Kategori berita (opsional). */
  kategori?: string;
  /** Rentang tanggal ISO (opsional, inklusif). */
  dari?: string;
  sampai?: string;
  limit?: number;
}

export interface CariResult {
  data: HasilCari[];
  total: number;
  /** Jumlah per jenis (untuk ringkasan filter). */
  counts: Record<HasilCari["kind"], number>;
  /** true bila sumber upstream gagal (hasil parsial). */
  degraded: boolean;
}

/**
 * Halaman statis yang dapat dicari (judul + deskripsi + path).
 * Dipelihara manual; sengaja bukan dari DB.
 */
export const HALAMAN_STATIS: {
  title: string;
  excerpt: string;
  href: string;
}[] = [
  { title: "Visi & Misi", excerpt: "Visi dan misi Diskominfo SP Kabupaten Hulu Sungai Tengah.", href: "/profil/visi-misi" },
  { title: "Tugas & Fungsi", excerpt: "Tugas pokok dan fungsi Dinas Komunikasi, Informatika, Statistik dan Persandian.", href: "/profil/tugas-fungsi" },
  { title: "Struktur Organisasi", excerpt: "Susunan organisasi dan pejabat Diskominfo SP HST.", href: "/profil/struktur-organisasi" },
  { title: "Maklumat Pelayanan", excerpt: "Komitmen dan standar pelayanan publik Diskominfo SP HST.", href: "/profil/maklumat-pelayanan" },
  { title: "Sejarah", excerpt: "Sejarah berdirinya Diskominfo SP Kabupaten Hulu Sungai Tengah.", href: "/profil/sejarah" },
  { title: "Data Pegawai", excerpt: "Data pegawai dan ASN Diskominfo SP HST.", href: "/profil/data-pegawai" },
  { title: "Layanan Digital", excerpt: "Daftar layanan digital dan bidang di Diskominfo SP HST.", href: "/layanan" },
  { title: "Radio Swara Murakata", excerpt: "Streaming radio pemerintah daerah Kabupaten Hulu Sungai Tengah.", href: "/radio" },
  { title: "Pengumuman", excerpt: "Pengumuman resmi dari Media Center HST.", href: "/pengumuman" },
  { title: "Klarifikasi Hoaks", excerpt: "Klarifikasi berita bohong dan disinformasi.", href: "/hoaks" },
  { title: "Kontak", excerpt: "Alamat, email, telepon, dan media sosial Diskominfo SP HST.", href: "/kontak" },
];

function norm(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/\s+/g, " ").trim();
}

/**
 * Pencocokan berbasis token: SEMUA kata pada query harus muncul di haystack.
 * Ini membuat "visi misi" tetap menemukan "Visi & Misi" (tanda baca & kata
 * sambung tidak memutus kecocokan), dan lebih tahan terhadap urutan kata.
 */
function matches(hay: string, needle: string): boolean {
  const tokens = needle.split(" ").filter(Boolean);
  if (tokens.length === 0) return false;
  const h = norm(hay);
  return tokens.every((t) => h.includes(t));
}

/** Cari lintas sumber. Tidak pernah melempar — kegagalan upstream → degraded. */
export async function cariGlobal(params: CariParams): Promise<CariResult> {
  const q = norm(params.q ?? "");
  const jenis = params.jenis && params.jenis.length > 0 ? params.jenis : ["berita", "pengumuman", "halaman"];
  const limit = params.limit ?? 60;
  const counts: Record<HasilCari["kind"], number> = { berita: 0, pengumuman: 0, halaman: 0 };
  const hasil: HasilCari[] = [];
  let degraded = false;

  if (q.length < 2) {
    return { data: [], total: 0, counts, degraded };
  }

  // Halaman statis (lokal, tidak pernah gagal)
  if (jenis.includes("halaman")) {
    for (const h of HALAMAN_STATIS) {
      if (matches(`${h.title} ${h.excerpt}`, q)) {
        hasil.push({
          kind: "halaman",
          id: `halaman:${h.href}`,
          title: h.title,
          excerpt: h.excerpt,
          href: h.href,
        });
        counts.halaman++;
      }
    }
  }

  // Berita + pengumuman dari Media Center
  if (jenis.includes("berita")) {
    try {
      const res = await getBerita({ page: 1, limit: 500 });
      for (const b of res.data) {
        if (params.kategori && norm(b.category) !== norm(params.kategori)) continue;
        if (params.dari && Date.parse(b.publishedAt) < Date.parse(params.dari)) continue;
        if (params.sampai && Date.parse(b.publishedAt) > Date.parse(params.sampai)) continue;
        if (matches(`${b.title} ${b.excerpt} ${b.category}`, q)) {
          hasil.push({
            kind: "berita",
            id: `berita:${b.id}`,
            title: b.title,
            excerpt: b.excerpt,
            href: `/berita/${b.slug}`,
            category: b.category,
            publishedAt: b.publishedAt,
          });
          counts.berita++;
        }
      }
    } catch {
      degraded = true;
    }
  }

  if (jenis.includes("pengumuman")) {
    try {
      const res = await getPengumuman({ page: 1, limit: 200 });
      for (const p of res.data) {
        if (matches(`${p.title} ${stripHtml(p.body)}`, q)) {
          hasil.push({
            kind: "pengumuman",
            id: `pengumuman:${p.id}`,
            title: p.title,
            excerpt: stripHtml(p.body).slice(0, 160),
            href: p.link ?? "/pengumuman",
            publishedAt: p.publishedAt,
          });
          counts.pengumuman++;
        }
      }
    } catch {
      degraded = true;
    }
  }

  // Urutkan: berita/pengumuman terbaru dulu, halaman di akhir.
  hasil.sort((a, b) => {
    const rank = (x: HasilCari) => (x.kind === "halaman" ? 2 : 1);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });

  return {
    data: hasil.slice(0, limit),
    total: hasil.length,
    counts,
    degraded,
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
