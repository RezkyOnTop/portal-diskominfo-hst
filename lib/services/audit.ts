import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * lib/services/audit.ts — jejak audit aktivitas dashboard admin.
 *
 * Aturan penting:
 *  - Pencatatan bersifat BEST-EFFORT. Kegagalan menulis log tidak boleh
 *    menggagalkan aksi utama (ubah data, unggah foto, ekspor). Semua error
 *    ditelan setelah dicatat ke console.
 *  - Yang disimpan adalah SALINAN nama/peran pelaku, bukan relasi ke tabel
 *    User — supaya riwayat tetap terbaca walau akunnya kemudian dihapus.
 *  - Jangan pernah menyimpan password, token, atau isi berkas di sini.
 */

export type PeranAudit = "ADMIN" | "EDITOR" | "ANONIM";

export interface AuditInput {
  actorId?: string | null;
  actorName: string;
  actorRole: string;
  aksi: string;
  target?: string | null;
  targetId?: string | null;
  detail?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface AuditRingkas {
  id: string;
  createdAt: Date;
  actorId: string | null;
  actorName: string;
  actorRole: string;
  aksi: string;
  target: string | null;
  targetId: string | null;
  detail: string | null;
  ip: string | null;
  userAgent: string | null;
}

/** Kode aksi yang dipakai di seluruh aplikasi + label manusianya. */
export const LABEL_AKSI: Record<string, string> = {
  MASUK: "Masuk dashboard",
  MASUK_GAGAL: "Percobaan masuk gagal",
  KELUAR: "Keluar dashboard",
  TAMBAH_PEGAWAI: "Tambah pegawai",
  UBAH_PEGAWAI: "Ubah data pegawai",
  HAPUS_PEGAWAI: "Hapus pegawai",
  UNGGAH_FOTO_PEGAWAI: "Unggah foto pegawai",
  HAPUS_FOTO_PEGAWAI: "Hapus foto pegawai",
  TAMBAH_HERO: "Tambah slide hero",
  UBAH_HERO: "Ubah slide hero",
  HAPUS_HERO: "Hapus slide hero",
  UNGGAH_FOTO_HERO: "Unggah foto hero",
  HAPUS_FOTO_HERO: "Hapus foto hero",
  UBAH_STATUS_PENGADUAN: "Ubah status pengaduan",
  UBAH_STATUS_RESERVASI: "Ubah status reservasi",
  TAMBAH_USER: "Tambah akun admin",
  UBAH_USER: "Ubah akun admin",
  GANTI_PASSWORD_USER: "Ganti password akun",
  HAPUS_USER: "Hapus akun admin",
  EKSPOR_CSV: "Ekspor data CSV",
};

/** Aksi yang dianggap sensitif (disorot di halaman audit). */
export const AKSI_SENSITIF = new Set([
  "MASUK_GAGAL",
  "HAPUS_USER",
  "HAPUS_PEGAWAI",
  "GANTI_PASSWORD_USER",
  "EKSPOR_CSV",
]);

const MAKS_DETAIL = 500;
const MAKS_UA = 300;

function potong(nilai: string | null | undefined, maks: number): string | null {
  if (!nilai) return null;
  // Buang karakter kendali (termasuk \r \n \t) supaya teks kiriman penyerang
  // tidak bisa memalsukan baris baru di tabel/dropdown halaman audit.
  const bersih = nilai
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!bersih) return null;
  return bersih.length > maks ? `${bersih.slice(0, maks - 1)}…` : bersih;
}

/** Tulis satu baris audit. Tidak pernah melempar error. */
export async function catatAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: potong(input.actorId, 64),
        actorName: potong(input.actorName, 160) ?? "Tidak dikenal",
        actorRole: potong(input.actorRole, 20) ?? "ANONIM",
        aksi: potong(input.aksi, 60) ?? "TIDAK_DIKENAL",
        target: potong(input.target, 40),
        targetId: potong(input.targetId, 64),
        detail: potong(input.detail, MAKS_DETAIL),
        ip: potong(input.ip, 64),
        userAgent: potong(input.userAgent, MAKS_UA),
      },
    });
  } catch (err) {
    // Audit TIDAK boleh menjatuhkan aksi utama.
    console.error("[audit] gagal mencatat", err);
  }
}

/** Bentuk sesi minimum yang dibutuhkan pencatat audit. */
export interface SesiAudit {
  user?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

/**
 * Catat dari sesi Auth.js (dipakai Server Action & route handler).
 * `kontek` membawa IP / user agent dari objek Request.
 */
export async function catatAuditSesi(
  session: SesiAudit | null,
  data: {
    aksi: string;
    target?: string | null;
    targetId?: string | null;
    detail?: string | null;
  },
  kontek?: { ip?: string | null; userAgent?: string | null; actorNama?: string | null },
): Promise<void> {
  const peran = session?.user?.role === "ADMIN" ? "ADMIN" : session ? "EDITOR" : "ANONIM";
  // Server Action tidak memegang objek Request — ambil dari headers().
  const dariHeader = kontek?.ip || kontek?.userAgent ? null : await kontekPermintaan();
  await catatAudit({
    actorId: session?.user?.id ?? null,
    actorName:
      session?.user?.name || session?.user?.email || kontek?.actorNama || "Tidak dikenal",
    actorRole: peran,
    aksi: data.aksi,
    target: data.target ?? null,
    targetId: data.targetId ?? null,
    detail: data.detail ?? null,
    ip: kontek?.ip ?? dariHeader?.ip ?? null,
    userAgent: kontek?.userAgent ?? dariHeader?.userAgent ?? null,
  });
}

/** IP + user agent dari konteks permintaan aktif (aman dipanggil di action). */
export async function kontekPermintaan(): Promise<{
  ip: string | null;
  userAgent: string | null;
}> {
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    const ip = fwd ? (fwd.split(",")[0]?.trim() ?? null) : (h.get("x-real-ip") ?? null);
    return { ip, userAgent: h.get("user-agent") };
  } catch {
    return { ip: null, userAgent: null };
  }
}

export interface FilterAudit {
  aksi?: string;
  aktor?: string;
  q?: string;
  limit?: number;
  halaman?: number;
}

const MAKS_LIMIT = 200;
const MAKS_HALAMAN = 10_000;
const MAKS_Q = 100;

/** Daftar jejak audit terbaru (terbaru dulu), plus jumlah total terfilter. */
export async function listAuditLogs(
  filter: FilterAudit = {},
): Promise<{ baris: AuditRingkas[]; total: number }> {
  const limit = Math.min(Math.max(1, filter.limit ?? 50), MAKS_LIMIT);
  // Halaman dibatasi: `skip` yang kelewat besar membuat Prisma melempar error
  // (500) dan membebani database.
  const halaman = Math.min(Math.max(1, filter.halaman ?? 1), MAKS_HALAMAN);
  // Kata kunci dibatasi 100 karakter — query `contains` tanpa index ini
  // full-scan, jadi panjang input tidak boleh tak terbatas.
  const q = filter.q?.trim().slice(0, MAKS_Q) || undefined;

  const where = {
    ...(filter.aksi ? { aksi: filter.aksi } : {}),
    ...(filter.aktor ? { actorId: filter.aktor } : {}),
    ...(q
      ? {
          OR: [
            { actorName: { contains: q, mode: "insensitive" as const } },
            { detail: { contains: q, mode: "insensitive" as const } },
            { ip: { contains: q } },
          ],
        }
      : {}),
  };

  const [baris, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (halaman - 1) * limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { baris, total };
}

/** Daftar pelaku (untuk filter) — dari log yang ada, bukan daftar user. */
export async function daftarAktor(): Promise<{ actorId: string | null; actorName: string }[]> {
  const rows = await prisma.auditLog.findMany({
    // Hanya akun nyata: baris ANONIM (mis. percobaan login gagal) membawa teks
    // yang dikirim penyerang, jangan sampai masuk ke dropdown admin.
    where: { actorId: { not: null } },
    distinct: ["actorId"],
    select: { actorId: true, actorName: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows;
}

/** Angka ringkas untuk kartu di halaman audit. */
export async function ringkasanAudit(): Promise<{
  hariIni: number;
  gagalMasuk: number;
  total: number;
}> {
  const sejak = new Date();
  sejak.setHours(0, 0, 0, 0);
  const [hariIni, gagalMasuk, total] = await Promise.all([
    prisma.auditLog.count({ where: { createdAt: { gte: sejak } } }),
    prisma.auditLog.count({ where: { aksi: "MASUK_GAGAL", createdAt: { gte: sejak } } }),
    prisma.auditLog.count(),
  ]);
  return { hariIni, gagalMasuk, total };
}
