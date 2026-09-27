import "server-only";
import { prisma } from "@/lib/db";
import {
  ServiceReservationInputSchema,
  UpdateReservasiStatusSchema,
  buatKodeReservasi,
  type StatusReservasi,
} from "@/lib/validations/local.schema";

export type ReservasiResult =
  | { ok: true; id: string; kode: string }
  | { ok: false; reason: "INVALID" | "UNAVAILABLE"; message: string; fieldErrors?: Record<string, string[]> };

export interface ReservasiRingkas {
  id: string;
  kode: string;
  nama: string;
  instansi: string | null;
  email: string;
  telepon: string;
  layanan: string;
  tanggal: Date;
  waktuMulai: string;
  waktuSelesai: string | null;
  jumlahPeserta: number;
  keperluan: string;
  status: string;
  catatanAdmin: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Buat permohonan reservasi baru (data lokal: ServiceReservation).
 * Kode lacak dibuat unik; bila bentrok (sangat jarang) dicoba ulang beberapa kali.
 */
export async function createReservation(input: unknown): Promise<ReservasiResult> {
  const parsed = ServiceReservationInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return {
      ok: false,
      reason: "INVALID",
      message: "Data permohonan tidak valid.",
      fieldErrors,
    };
  }

  const d = parsed.data;
  const data = {
    nama: d.nama,
    instansi: d.instansi && d.instansi.trim() ? d.instansi : null,
    email: d.email,
    telepon: d.telepon,
    layanan: d.layanan,
    // Tanggal kegiatan bersifat date-only: dipaku ke tengah malam UTC agar
    // tidak bergeser sehari saat server & browser berbeda zona waktu.
    tanggal: new Date(`${d.tanggal}T00:00:00.000Z`),
    waktuMulai: d.waktuMulai,
    waktuSelesai: d.waktuSelesai && d.waktuSelesai.trim() ? d.waktuSelesai : null,
    jumlahPeserta: d.jumlahPeserta,
    keperluan: d.keperluan,
  };

  // Kode unik: coba beberapa kali bila terjadi bentrok (P2002).
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const kode = buatKodeReservasi();
    try {
      const created = await prisma.serviceReservation.create({
        data: { ...data, kode },
        select: { id: true, kode: true },
      });
      return { ok: true, id: created.id, kode: created.kode };
    } catch (err) {
      const code = typeof err === "object" && err !== null && "code" in err ? (err as { code?: string }).code : undefined;
      if (code === "P2002") continue; // bentrok kode -> coba lagi
      console.error("[reservasi] gagal menyimpan", err);
      return {
        ok: false,
        reason: "UNAVAILABLE",
        message: "Layanan sedang tidak tersedia. Coba lagi nanti.",
      };
    }
  }

  console.error("[reservasi] gagal membuat kode unik setelah 5 percobaan");
  return {
    ok: false,
    reason: "UNAVAILABLE",
    message: "Layanan sedang tidak tersedia. Coba lagi nanti.",
  };
}

/** Daftar permohonan untuk dashboard admin (terbaru dulu). */
export async function listReservations(status?: string): Promise<ReservasiRingkas[]> {
  return prisma.serviceReservation.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

/** Ambil satu permohonan berdasarkan kode lacak (untuk pemohon). */
export async function getReservationByKode(kode: string): Promise<ReservasiRingkas | null> {
  const kodeBersih = kode.trim().toUpperCase();
  if (!kodeBersih) return null;
  return prisma.serviceReservation.findUnique({ where: { kode: kodeBersih } });
}

/** Hitung permohonan per status (untuk kartu ringkasan admin). */
export async function countReservations(): Promise<{
  total: number;
  menunggu: number;
  disetujui: number;
  ditolak: number;
  selesai: number;
}> {
  const [total, menunggu, disetujui, ditolak, selesai] = await Promise.all([
    prisma.serviceReservation.count(),
    prisma.serviceReservation.count({ where: { status: "MENUNGGU" } }),
    prisma.serviceReservation.count({ where: { status: "DISETUJUI" } }),
    prisma.serviceReservation.count({ where: { status: "DITOLAK" } }),
    prisma.serviceReservation.count({ where: { status: "SELESAI" } }),
  ]);
  return { total, menunggu, disetujui, ditolak, selesai };
}

export type UpdateStatusResult =
  | { ok: true }
  | { ok: false; reason: "INVALID" | "NOT_FOUND" | "UNAVAILABLE"; message: string };

/** Ubah status permohonan (aksi admin). */
export async function updateReservationStatus(input: unknown): Promise<UpdateStatusResult> {
  const parsed = UpdateReservasiStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: "INVALID", message: "Data perubahan status tidak valid." };
  }
  const { id, status, catatanAdmin } = parsed.data;
  try {
    await prisma.serviceReservation.update({
      where: { id },
      data: {
        status: status satisfies StatusReservasi,
        catatanAdmin: catatanAdmin && catatanAdmin.trim() ? catatanAdmin : null,
      },
    });
    return { ok: true };
  } catch (err) {
    const code = typeof err === "object" && err !== null && "code" in err ? (err as { code?: string }).code : undefined;
    if (code === "P2025") {
      return { ok: false, reason: "NOT_FOUND", message: "Permohonan tidak ditemukan." };
    }
    console.error("[reservasi] gagal mengubah status", err);
    return { ok: false, reason: "UNAVAILABLE", message: "Layanan sedang tidak tersedia." };
  }
}
