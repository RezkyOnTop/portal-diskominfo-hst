import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    heroSlide: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));
vi.mock("@/lib/storage/foto-hero", () => ({
  hapusSemuaFotoHero: vi.fn(),
}));

import { prisma } from "@/lib/db";
import {
  countHeroSlide,
  createHeroSlide,
  deleteHeroSlide,
  getHeroSlideById,
  listHeroSlidePublik,
  setFotoHeroSlide,
  updateHeroSlide,
} from "./hero";

const p = prisma.heroSlide as unknown as Record<string, ReturnType<typeof vi.fn>>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listHeroSlidePublik", () => {
  it("hanya mengambil yang aktif, urut lalu waktu", async () => {
    p.findMany.mockResolvedValue([]);
    await listHeroSlidePublik();
    expect(p.findMany).toHaveBeenCalledWith({
      where: { aktif: true },
      orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
      take: 30,
    });
  });
});

describe("getHeroSlideById", () => {
  it("menolak id kosong tanpa menyentuh DB", async () => {
    const hasil = await getHeroSlideById("   ");
    expect(hasil).toBeNull();
    expect(p.findUnique).not.toHaveBeenCalled();
  });
});

describe("createHeroSlide", () => {
  it("menambah slide dengan label + urutan", async () => {
    p.create.mockResolvedValue({ id: "s1" });
    const hasil = await createHeroSlide({ label: "Monumen HST", urutan: 1 });
    expect(hasil).toEqual({ ok: true, id: "s1" });
    expect(p.create).toHaveBeenCalledWith({
      data: { label: "Monumen HST", urutan: 1 },
      select: { id: true },
    });
  });

  it("menolak label terlalu pendek", async () => {
    const hasil = await createHeroSlide({ label: "ab", urutan: 0 });
    expect(hasil.ok).toBe(false);
    expect(p.create).not.toHaveBeenCalled();
  });
});

describe("updateHeroSlide", () => {
  it("mengubah label, urutan, dan status", async () => {
    p.update.mockResolvedValue({});
    const hasil = await updateHeroSlide({ id: "s1", label: "Baru", urutan: 2, aktif: false });
    expect(hasil).toEqual({ ok: true, id: "s1" });
  });

  it("melaporkan NOT_FOUND bila id tidak ada", async () => {
    p.update.mockRejectedValue({ code: "P2025" });
    const hasil = await updateHeroSlide({ id: "hilang", label: "X Baru", urutan: 0, aktif: true });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.reason).toBe("NOT_FOUND");
  });
});

describe("setFotoHeroSlide", () => {
  it("mencatat URL foto", async () => {
    p.update.mockResolvedValue({});
    expect(await setFotoHeroSlide("s1", "/api/hero/foto/s1")).toBe(true);
  });

  it("URL kosong disimpan sebagai null", async () => {
    p.update.mockResolvedValue({});
    await setFotoHeroSlide("s1", "  ");
    expect(p.update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { fotoUrl: null },
    });
  });
});

describe("deleteHeroSlide", () => {
  it("menghapus slide + berkas fotonya", async () => {
    const { hapusSemuaFotoHero } = await import("@/lib/storage/foto-hero");
    p.delete.mockResolvedValue({});
    const hasil = await deleteHeroSlide({ id: "s1" });
    expect(hasil).toEqual({ ok: true, id: "s1" });
    expect(hapusSemuaFotoHero).toHaveBeenCalledWith("s1");
  });
});

describe("countHeroSlide", () => {
  it("menghitung total dan aktif", async () => {
    p.count
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(5);
    expect(await countHeroSlide()).toEqual({ total: 6, aktif: 5 });
  });
});
