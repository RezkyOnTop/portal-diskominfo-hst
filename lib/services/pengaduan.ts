import "server-only";
import { prisma } from "@/lib/db";
import {
  PengaduanInputSchema,
  TanggapiPengaduanSchema,
  buatKodePengaduan,
  type StatusPengaduan,
} from "@/lib/validations/local.schema";

export type PengaduanResult =
  | { ok: true; id: string; kode: string }
  | { ok: false; reason: "INVALID" | "UNAVAILABLE"; message: string; fieldErrors?: Record<string, string[]> };

export interface PengaduanRingkas {
  id: string;
  kode: string;
  nama: string;
  kontak: string;
  kategori: string;
  isi: string;
  status: string;
  tanggapan: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Simpan pengaduan/aspirasi baru (data lokal: Pengaduan).
 * Kode lacak dibuat unik; bila bentrok (sangat jarang) dicoba ulang beberapa kali.
 */
export async function createPengaduan(input: unknown): Promise<PengaduanResult> {
  const parsed = PengaduanInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return {
      ok: false,
      reason: "INVALID",
      message: "Data pengaduan tidak valid.",
      fieldErrors,
    };
  }

  const d = parsed.data;
  const data = {
    nama: d.nama,
    kontak: d.kontak,
    kategori: d.kategori,
    isi: d.isi,
  };

  // Kode unik: coba beberapa kali bila terjadi bentrok (P2002).
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const kode = buatKodePengaduan();
    try {
      const created = await prisma.pengaduan.create({
        data: { ...data, kode },
        select: { id: true, kode: true },
      });
      return { ok: true, id: created.id, kode: created.kode };
    } catch (err) {
      const code = typeof err === "object" && err !== null && "code" in err ? (err as { code?: string }).code : undefined;
      if (code === "P2002") continue; // bentrok kode -> coba lagi
      console.error("[pengaduan] gagal menyimpan", err);
      return {
        ok: false,
        reason: "UNAVAILABLE",
        message: "Layanan sedang tidak tersedia. Coba lagi nanti.",
      };
    }
  }

  console.error("[pengaduan] gagal membuat kode unik setelah 5 percobaan");
  return {
    ok: false,
    reason: "UNAVAILABLE",
    message: "Layanan sedang tidak tersedia. Coba lagi nanti.",
  };
}

/** Daftar pengaduan untuk dashboard admin (terbaru dulu). */
export async function listPengaduan(status?: string): Promise<PengaduanRingkas[]> {
  return prisma.pengaduan.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

/** Ambil satu pengaduan berdasarkan kode lacak (untuk pengadu). */
export async function getPengaduanByKode(kode: string): Promise<PengaduanRingkas | null> {
  const kodeBersih = kode.trim().toUpperCase();
  if (!kodeBersih) return null;
  return prisma.pengaduan.findUnique({ where: { kode: kodeBersih } });
}

/** Hitung pengaduan per status (untuk kartu ringkasan admin). */
export async function countPengaduan(): Promise<{
  total: number;
  baru: number;
  diproses: number;
  selesai: number;
}> {
  const [total, baru, diproses, selesai] = await Promise.all([
    prisma.pengaduan.count(),
    prisma.pengaduan.count({ where: { status: "BARU" } }),
    prisma.pengaduan.count({ where: { status: "DIPROSES" } }),
    prisma.pengaduan.count({ where: { status: "SELESAI" } }),
  ]);
  return { total, baru, diproses, selesai };
}

export type TanggapiResult =
  | { ok: true }
  | { ok: false; reason: "INVALID" | "NOT_FOUND" | "UNAVAILABLE"; message: string };

/** Tanggapi pengaduan: ubah status + simpan respons petugas (aksi admin). */
export async function tanggapiPengaduan(input: unknown): Promise<TanggapiResult> {
  const parsed = TanggapiPengaduanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: "INVALID", message: "Data tanggapan tidak valid." };
  }
  const { id, status, tanggapan } = parsed.data;
  try {
    await prisma.pengaduan.update({
      where: { id },
      data: {
        status: status satisfies StatusPengaduan,
        tanggapan: tanggapan && tanggapan.trim() ? tanggapan : null,
      },
    });
    return { ok: true };
  } catch (err) {
    const code = typeof err === "object" && err !== null && "code" in err ? (err as { code?: string }).code : undefined;
    if (code === "P2025") {
      return { ok: false, reason: "NOT_FOUND", message: "Pengaduan tidak ditemukan." };
    }
    console.error("[pengaduan] gagal menanggapi", err);
    return { ok: false, reason: "UNAVAILABLE", message: "Layanan sedang tidak tersedia." };
  }
}
