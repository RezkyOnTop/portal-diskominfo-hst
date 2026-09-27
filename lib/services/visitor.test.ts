import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    visitorStat: {
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { recordVisit, getStatistikRingkas } from "./visitor";

const createMock = prisma.visitorStat.create as unknown as ReturnType<typeof vi.fn>;
const countMock = prisma.visitorStat.count as unknown as ReturnType<typeof vi.fn>;
const findManyMock = prisma.visitorStat.findMany as unknown as ReturnType<typeof vi.fn>;

describe("recordVisit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mencatat kunjungan valid", async () => {
    createMock.mockResolvedValue({ id: "v1" });
    const res = await recordVisit(
      { path: "/berita", referrer: "https://google.com" },
      { userAgent: "vitest" },
    );
    expect(res.ok).toBe(true);
    expect(createMock).toHaveBeenCalledOnce();
  });

  it("menolak input tidak valid tanpa menyentuh DB", async () => {
    const res = await recordVisit({ path: "" });
    expect(res.ok).toBe(false);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("gagal dengan aman (best-effort) saat DB error", async () => {
    createMock.mockRejectedValue(new Error("db down"));
    const res = await recordVisit({ path: "/" });
    expect(res.ok).toBe(false);
  });
});

describe("getStatistikRingkas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menghitung total, hari ini, tren harian, dan halaman populer", async () => {
    countMock.mockResolvedValueOnce(100).mockResolvedValueOnce(7);
    findManyMock.mockResolvedValue([
      { path: "/berita", visitedAt: new Date("2026-01-01T10:00:00Z") },
      { path: "/berita", visitedAt: new Date("2026-01-01T11:00:00Z") },
      { path: "/", visitedAt: new Date("2026-01-02T09:00:00Z") },
    ]);
    const stats = await getStatistikRingkas(14);
    expect(stats.total).toBe(100);
    expect(stats.hariIni).toBe(7);
    expect(stats.perHari).toHaveLength(2);
    expect(stats.halamanPopuler[0]).toEqual({ path: "/berita", jumlah: 2 });
  });

  it("mengembalikan struktur kosong bila tidak ada data", async () => {
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);
    const stats = await getStatistikRingkas(7);
    expect(stats.perHari).toEqual([]);
    expect(stats.halamanPopuler).toEqual([]);
  });
});
