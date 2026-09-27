import "server-only";
import { prisma } from "@/lib/db";
import { VisitorInputSchema } from "@/lib/validations/local.schema";

/**
 * Catat satu kunjungan ke database LOKAL (VisitorStat).
 * Analytics bersifat best-effort: kegagalan TIDAK boleh memecahkan halaman.
 */
export async function recordVisit(
  input: unknown,
  meta: { userAgent?: string | null; country?: string | null } = {},
): Promise<{ ok: boolean }> {
  const parsed = VisitorInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  try {
    await prisma.visitorStat.create({
      data: {
        path: parsed.data.path,
        referrer: parsed.data.referrer || null,
        userAgent: meta.userAgent ?? null,
        country: meta.country ?? null,
      },
    });
    return { ok: true };
  } catch (err) {
    console.error("[visitor] gagal mencatat kunjungan", err);
    return { ok: false };
  }
}

export interface StatistikRingkas {
  total: number;
  hariIni: number;
  perHari: { tanggal: string; jumlah: number }[];
  halamanPopuler: { path: string; jumlah: number }[];
}

/** Ringkasan statistik kunjungan untuk dashboard admin (data lokal). */
export async function getStatistikRingkas(days = 14): Promise<StatistikRingkas> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [total, hariIni, rows] = await Promise.all([
    prisma.visitorStat.count(),
    prisma.visitorStat.count({ where: { visitedAt: { gte: startOfToday } } }),
    prisma.visitorStat.findMany({
      where: { visitedAt: { gte: since } },
      select: { path: true, visitedAt: true },
      take: 20000,
    }),
  ]);

  const perHariMap = new Map<string, number>();
  const pathMap = new Map<string, number>();
  for (const row of rows) {
    const key = row.visitedAt.toISOString().slice(0, 10);
    perHariMap.set(key, (perHariMap.get(key) ?? 0) + 1);
    pathMap.set(row.path, (pathMap.get(row.path) ?? 0) + 1);
  }

  return {
    total,
    hariIni,
    perHari: Array.from(perHariMap.entries())
      .map(([tanggal, jumlah]) => ({ tanggal, jumlah }))
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal)),
    halamanPopuler: Array.from(pathMap.entries())
      .map(([path, jumlah]) => ({ path, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 10),
  };
}
