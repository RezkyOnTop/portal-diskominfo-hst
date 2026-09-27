import "server-only";
import { prisma } from "@/lib/db";
import {
  ServiceSurveyInputSchema,
  hitungIkm,
  mutuPelayanan,
  type ServiceSurveyInput,
} from "@/lib/validations/local.schema";

export type SurveyResult =
  | { ok: true; id: string; ikm: number; mutu: string }
  | { ok: false; reason: "INVALID" | "UNAVAILABLE"; message: string };

/** Skor 9 unsur dari input yang sudah tervalidasi. */
function skorDari(data: ServiceSurveyInput): number[] {
  return [data.u1, data.u2, data.u3, data.u4, data.u5, data.u6, data.u7, data.u8, data.u9];
}

/**
 * Simpan jawaban survei kepuasan layanan ke database LOKAL (ServiceSurvey).
 * Nilai IKM & mutu dihitung di server (tidak dipercaya dari client).
 */
export async function createSurvey(input: unknown): Promise<SurveyResult> {
  const parsed = ServiceSurveyInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: "INVALID", message: "Data survei tidak lengkap atau tidak valid." };
  }
  const data = parsed.data;
  const ikm = hitungIkm(skorDari(data));
  const mutu = mutuPelayanan(ikm);

  try {
    const created = await prisma.serviceSurvey.create({
      data: {
        layanan: data.layanan,
        u1: data.u1,
        u2: data.u2,
        u3: data.u3,
        u4: data.u4,
        u5: data.u5,
        u6: data.u6,
        u7: data.u7,
        u8: data.u8,
        u9: data.u9,
        ikm,
        mutu,
        saran: data.saran && data.saran.trim() ? data.saran : null,
        nama: data.nama && data.nama.trim() ? data.nama : null,
        kontak: data.kontak && data.kontak.trim() ? data.kontak : null,
      },
      select: { id: true },
    });
    return { ok: true, id: created.id, ikm, mutu };
  } catch (err) {
    console.error("[survey] gagal menyimpan jawaban", err);
    return {
      ok: false,
      reason: "UNAVAILABLE",
      message: "Layanan survei sedang tidak tersedia. Coba lagi nanti.",
    };
  }
}

export interface RingkasanSurvei {
  /** Jumlah responden yang sudah mengisi survei. */
  responden: number;
  /** Nilai IKM rata-rata seluruh responden (0–100). */
  ikm: number;
  /** Mutu pelayanan (A/B/C/D) dari nilai IKM rata-rata. */
  mutu: string;
  /** Nilai rata-rata (NRR) per unsur, urut u1..u9. */
  perUnsur: { key: string; nrr: number }[];
}

/**
 * Ringkasan hasil survei (data lokal). Mengembalikan `null` bila database
 * belum tersedia — pemanggil menampilkan fallback, bukan error.
 */
export async function getRingkasanSurvei(): Promise<RingkasanSurvei | null> {
  try {
    const [count, agg] = await Promise.all([
      prisma.serviceSurvey.count(),
      prisma.serviceSurvey.aggregate({
        _avg: {
          u1: true,
          u2: true,
          u3: true,
          u4: true,
          u5: true,
          u6: true,
          u7: true,
          u8: true,
          u9: true,
          ikm: true,
        },
      }),
    ]);

    if (count === 0) {
      return { responden: 0, ikm: 0, mutu: "-", perUnsur: [] };
    }

    const avg = agg._avg;
    const keys = ["u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8", "u9"] as const;
    const perUnsur = keys.map((k) => ({
      key: k,
      nrr: Math.round(((avg[k] ?? 0) as number) * 100) / 100,
    }));
    const ikm = Math.round(((avg.ikm ?? 0) as number) * 100) / 100;

    return { responden: count, ikm, mutu: mutuPelayanan(ikm), perUnsur };
  } catch (err) {
    console.error("[survey] gagal membaca ringkasan", err);
    return null;
  }
}

/** Daftar jawaban terbaru untuk dashboard admin (data lokal). */
export async function listSurveys(take = 100) {
  return prisma.serviceSurvey.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function countSurveys() {
  return prisma.serviceSurvey.count();
}
