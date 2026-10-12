import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    pengaduan: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import {
  createPengaduan,
  getPengaduanByKode,
  countPengaduan,
  tanggapiPengaduan,
} from "./pengaduan";

const createMock = prisma.pengaduan.create as unknown as ReturnType<typeof vi.fn>;
const findUniqueMock = prisma.pengaduan.findUnique as unknown as ReturnType<typeof vi.fn>;
const updateMock = prisma.pengaduan.update as unknown as ReturnType<typeof vi.fn>;
const countMock = prisma.pengaduan.count as unknown as ReturnType<typeof vi.fn>;

/** Input valid yang bisa dimodifikasi per kasus uji. */
function inputValid(over: Record<string, unknown> = {}) {
  return {
    nama: "Siti Aminah",
    kontak: "081234567890",
    kategori: "Layanan Publik & Perizinan",
    isi: "Layanan informasi di loket sangat lambat pagi ini, mohon perhatian.",
    ...over,
  };
}

describe("createPengaduan", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menyimpan pengaduan valid dan mengembalikan kode lacak", async () => {
    createMock.mockResolvedValue({ id: "p1", kode: "PGD-ABC234" });
    const res = await createPengaduan(inputValid());

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.kode).toMatch(/^PGD-[A-Z0-9]{6}$/);
      expect(res.id).toBe("p1");
    }
    expect(createMock).toHaveBeenCalledOnce();
  });

  it("menolak nama terlalu pendek (INVALID + fieldErrors)", async () => {
    const res = await createPengaduan(inputValid({ nama: "A" }));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe("INVALID");
      expect(res.fieldErrors?.nama).toBeDefined();
    }
    expect(createMock).not.toHaveBeenCalled();
  });

  it("menolak isi terlalu pendek (minimal 15 karakter)", async () => {
    const res = await createPengaduan(inputValid({ isi: "jelek" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.isi).toBeDefined();
  });

  it("menolak kategori di luar daftar", async () => {
    const res = await createPengaduan(inputValid({ kategori: "Tidak Ada" }));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe("INVALID");
      expect(res.fieldErrors?.kategori).toBeDefined();
    }
  });

  it("mengembalikan UNAVAILABLE saat DB gagal (tanpa bocor detail)", async () => {
    createMock.mockRejectedValue(new Error("secret-db-error"));
    const res = await createPengaduan(inputValid());
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe("UNAVAILABLE");
      expect(res.message).not.toMatch(/secret/);
    }
  });

  it("mencoba ulang saat kode bentrok (P2002) lalu sukses", async () => {
    createMock
      .mockRejectedValueOnce({ code: "P2002" })
      .mockResolvedValueOnce({ id: "p2", kode: "PGD-ZZ9999" });
    const res = await createPengaduan(inputValid());
    expect(res.ok).toBe(true);
    expect(createMock).toHaveBeenCalledTimes(2);
  });
});

describe("getPengaduanByKode", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menormalkan kode ke huruf besar sebelum mencari", async () => {
    findUniqueMock.mockResolvedValue({ kode: "PGD-ABC234" });
    await getPengaduanByKode("  pgd-abc234 ");
    expect(findUniqueMock).toHaveBeenCalledWith({ where: { kode: "PGD-ABC234" } });
  });

  it("mengembalikan null untuk kode kosong", async () => {
    const res = await getPengaduanByKode("   ");
    expect(res).toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });
});

describe("countPengaduan", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menghitung per status", async () => {
    countMock
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(3);
    const c = await countPengaduan();
    expect(c).toEqual({ total: 10, baru: 4, diproses: 3, selesai: 3 });
  });
});

describe("tanggapiPengaduan", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menyimpan status + tanggapan", async () => {
    updateMock.mockResolvedValue({});
    const res = await tanggapiPengaduan({
      id: "p1",
      status: "DIPROSES",
      tanggapan: "Sedang kami tindak lanjuti.",
    });
    expect(res).toEqual({ ok: true });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { status: "DIPROSES", tanggapan: "Sedang kami tindak lanjuti." },
    });
  });

  it("tanggapan kosong disimpan null", async () => {
    updateMock.mockResolvedValue({});
    await tanggapiPengaduan({ id: "p1", status: "SELESAI", tanggapan: "  " });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { status: "SELESAI", tanggapan: null },
    });
  });

  it("menolak status tak dikenal", async () => {
    const res = await tanggapiPengaduan({ id: "p1", status: "HILANG", tanggapan: "" });
    expect(res.ok).toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("mengembalikan NOT_FOUND bila id tidak ada (P2025)", async () => {
    updateMock.mockRejectedValue({ code: "P2025" });
    const res = await tanggapiPengaduan({ id: "x", status: "SELESAI", tanggapan: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("NOT_FOUND");
  });
});
