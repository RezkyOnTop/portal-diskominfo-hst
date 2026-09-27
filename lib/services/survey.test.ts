import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    serviceSurvey: {
      create: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import {
  createSurvey,
  getRingkasanSurvei,
  listSurveys,
  countSurveys,
} from "./survey";

const createMock = prisma.serviceSurvey.create as unknown as ReturnType<typeof vi.fn>;
const countMock = prisma.serviceSurvey.count as unknown as ReturnType<typeof vi.fn>;
const aggMock = prisma.serviceSurvey.aggregate as unknown as ReturnType<typeof vi.fn>;
const findManyMock = prisma.serviceSurvey.findMany as unknown as ReturnType<typeof vi.fn>;

const VALID = {
  layanan: "Layanan Data & Statistik",
  u1: 4,
  u2: 4,
  u3: 4,
  u4: 4,
  u5: 4,
  u6: 4,
  u7: 4,
  u8: 4,
  u9: 4,
  saran: "Bagus",
  nama: "Budi",
  kontak: "budi@example.com",
};

describe("createSurvey", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menyimpan survei valid, menghitung IKM & mutu di server", async () => {
    createMock.mockResolvedValue({ id: "s1" });
    const res = await createSurvey(VALID);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.id).toBe("s1");
      expect(res.ikm).toBe(100);
      expect(res.mutu).toBe("A");
    }
    // IKM & mutu TIDAK dipercaya dari client — dihitung ulang di server.
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ikm: 100, mutu: "A" }),
      }),
    );
  });

  it("mengabaikan ikm/mutu yang dikirim client (server yang menghitung)", async () => {
    createMock.mockResolvedValue({ id: "s2" });
    const res = await createSurvey({ ...VALID, ikm: 0, mutu: "D" });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.ikm).toBe(100);
  });

  it("mengosongkan field opsional kosong menjadi null", async () => {
    createMock.mockResolvedValue({ id: "s3" });
    await createSurvey({ ...VALID, saran: "", nama: "", kontak: "" });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ saran: null, nama: null, kontak: null }),
      }),
    );
  });

  it("menolak input tidak valid (skor di luar 1–4)", async () => {
    const res = await createSurvey({ ...VALID, u5: 9 });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("INVALID");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("menolak input tanpa layanan", async () => {
    const res = await createSurvey({ ...VALID, layanan: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("INVALID");
  });

  it("mengembalikan UNAVAILABLE saat database error", async () => {
    createMock.mockRejectedValue(new Error("db down"));
    const res = await createSurvey(VALID);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("UNAVAILABLE");
  });
});

describe("getRingkasanSurvei", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mengembalikan ringkasan dengan IKM, mutu, dan NRR per unsur", async () => {
    countMock.mockResolvedValue(10);
    aggMock.mockResolvedValue({
      _avg: {
        u1: 3.8,
        u2: 3.5,
        u3: 3.9,
        u4: 3.2,
        u5: 3.7,
        u6: 3.6,
        u7: 3.9,
        u8: 3.1,
        u9: 3.4,
        ikm: 88.5,
      },
    });
    const res = await getRingkasanSurvei();
    expect(res).not.toBeNull();
    expect(res!.responden).toBe(10);
    expect(res!.ikm).toBe(88.5);
    expect(res!.mutu).toBe("A");
    expect(res!.perUnsur).toHaveLength(9);
    expect(res!.perUnsur[0]!.key).toBe("u1");
    expect(res!.perUnsur[0]!.nrr).toBe(3.8);
  });

  it("mengembalikan responden 0 tanpa data", async () => {
    countMock.mockResolvedValue(0);
    aggMock.mockResolvedValue({ _avg: {} });
    const res = await getRingkasanSurvei();
    expect(res!.responden).toBe(0);
    expect(res!.ikm).toBe(0);
    expect(res!.mutu).toBe("-");
    expect(res!.perUnsur).toHaveLength(0);
  });

  it("menangani nilai null dari agregat (belum ada baris)", async () => {
    countMock.mockResolvedValue(3);
    aggMock.mockResolvedValue({ _avg: { ikm: null, u1: null } });
    const res = await getRingkasanSurvei();
    expect(res!.ikm).toBe(0);
    expect(res!.perUnsur[0]!.nrr).toBe(0);
  });

  it("mengembalikan null saat database error (bukan throw)", async () => {
    countMock.mockRejectedValue(new Error("db down"));
    expect(await getRingkasanSurvei()).toBeNull();
  });
});

describe("listSurveys / countSurveys", () => {
  it("meneruskan ke prisma", async () => {
    findManyMock.mockResolvedValue([{ id: "1" }]);
    countMock.mockResolvedValue(7);
    expect(await listSurveys()).toHaveLength(1);
    expect(await countSurveys()).toBe(7);
  });
});
