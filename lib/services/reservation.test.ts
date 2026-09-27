import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    serviceReservation: {
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
  createReservation,
  getReservationByKode,
  listReservations,
  countReservations,
  updateReservationStatus,
} from "./reservation";

const createMock = prisma.serviceReservation.create as unknown as ReturnType<typeof vi.fn>;
const findManyMock = prisma.serviceReservation.findMany as unknown as ReturnType<typeof vi.fn>;
const findUniqueMock = prisma.serviceReservation.findUnique as unknown as ReturnType<typeof vi.fn>;
const updateMock = prisma.serviceReservation.update as unknown as ReturnType<typeof vi.fn>;
const countMock = prisma.serviceReservation.count as unknown as ReturnType<typeof vi.fn>;

/** Input valid yang bisa dimodifikasi per kasus uji. */
function inputValid(over: Record<string, unknown> = {}) {
  return {
    nama: "Budi Santoso",
    instansi: "SMAN 1 Barabai",
    email: "budi@example.com",
    telepon: "081234567890",
    layanan: "Kunjungan / Studi Tiru",
    tanggal: "2026-10-01",
    waktuMulai: "09:00",
    waktuSelesai: "11:00",
    jumlahPeserta: 25,
    keperluan: "Studi tiru pengelolaan media center daerah.",
    ...over,
  };
}

describe("createReservation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menyimpan permohonan valid dan mengembalikan kode lacak", async () => {
    createMock.mockResolvedValue({ id: "r1", kode: "RSV-ABC234" });
    const res = await createReservation(inputValid());

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.kode).toMatch(/^RSV-[A-Z0-9]{6}$/);
      expect(res.id).toBe("r1");
    }
    expect(createMock).toHaveBeenCalledOnce();
  });

  it("menormalkan email jadi huruf kecil dan tanggal jadi Date", async () => {
    createMock.mockResolvedValue({ id: "r1", kode: "RSV-ABC234" });
    await createReservation(inputValid({ email: "BUDI@Example.COM" }));

    const arg = createMock.mock.calls[0]![0] as { data: { email: string; tanggal: Date } };
    expect(arg.data.email).toBe("budi@example.com");
    expect(arg.data.tanggal).toBeInstanceOf(Date);
  });

  it("memaku tanggal kegiatan ke tengah malam UTC (tidak bergeser antar zona waktu)", async () => {
    createMock.mockResolvedValue({ id: "r1", kode: "RSV-ABC234" });
    await createReservation(inputValid({ tanggal: "2026-10-05" }));

    const arg = createMock.mock.calls[0]![0] as { data: { tanggal: Date } };
    expect(arg.data.tanggal.toISOString()).toBe("2026-10-05T00:00:00.000Z");
  });

  it("mengubah instansi kosong menjadi null", async () => {
    createMock.mockResolvedValue({ id: "r1", kode: "RSV-ABC234" });
    await createReservation(inputValid({ instansi: "" }));
    const arg = createMock.mock.calls[0]![0] as { data: { instansi: string | null } };
    expect(arg.data.instansi).toBeNull();
  });

  it("menolak input tidak valid beserta fieldErrors", async () => {
    const res = await createReservation(inputValid({ email: "bukan-email", jumlahPeserta: 0 }));

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe("INVALID");
      expect(res.fieldErrors).toBeDefined();
      expect(res.fieldErrors!.email).toBeDefined();
      expect(res.fieldErrors!.jumlahPeserta).toBeDefined();
    }
    expect(createMock).not.toHaveBeenCalled();
  });

  it("menolak jam selesai yang tidak setelah jam mulai", async () => {
    const res = await createReservation(inputValid({ waktuMulai: "11:00", waktuSelesai: "09:00" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors!.waktuSelesai).toBeDefined();
  });

  it("mencoba kode baru saat bentrok (P2002) lalu berhasil", async () => {
    const bentrok = Object.assign(new Error("unique"), { code: "P2002" });
    createMock.mockRejectedValueOnce(bentrok).mockResolvedValueOnce({ id: "r2", kode: "RSV-ZZZ999" });

    const res = await createReservation(inputValid());
    expect(res.ok).toBe(true);
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("mengembalikan UNAVAILABLE saat DB bermasalah (bukan P2002)", async () => {
    createMock.mockRejectedValue(new Error("db down"));
    const res = await createReservation(inputValid());

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("UNAVAILABLE");
  });
});

describe("getReservationByKode", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mencari dengan kode yang sudah dinormalkan (huruf besar, trim)", async () => {
    findUniqueMock.mockResolvedValue({ id: "r1", kode: "RSV-ABC234" });
    await getReservationByKode("  rsv-abc234  ");
    expect(findUniqueMock).toHaveBeenCalledWith({ where: { kode: "RSV-ABC234" } });
  });

  it("mengembalikan null untuk kode kosong tanpa menyentuh DB", async () => {
    expect(await getReservationByKode("   ")).toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });
});

describe("listReservations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("memfilter berdasarkan status bila diberikan", async () => {
    findManyMock.mockResolvedValue([]);
    await listReservations("DISETUJUI");
    const arg = findManyMock.mock.calls[0]![0] as { where?: { status?: string } };
    expect(arg.where).toEqual({ status: "DISETUJUI" });
  });

  it("tanpa filter status memakai where undefined", async () => {
    findManyMock.mockResolvedValue([]);
    await listReservations();
    const arg = findManyMock.mock.calls[0]![0] as { where?: unknown };
    expect(arg.where).toBeUndefined();
  });
});

describe("countReservations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mengembalikan hitungan per status", async () => {
    countMock
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3);

    expect(await countReservations()).toEqual({
      total: 10,
      menunggu: 4,
      disetujui: 2,
      ditolak: 1,
      selesai: 3,
    });
  });
});

describe("updateReservationStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("memperbarui status dan catatan admin", async () => {
    updateMock.mockResolvedValue({ id: "r1" });
    const res = await updateReservationStatus({
      id: "r1",
      status: "DISETUJUI",
      catatanAdmin: "Silakan hadir 15 menit lebih awal.",
    });

    expect(res.ok).toBe(true);
    const arg = updateMock.mock.calls[0]![0] as {
      data: { status: string; catatanAdmin: string | null };
    };
    expect(arg.data.status).toBe("DISETUJUI");
    expect(arg.data.catatanAdmin).toBe("Silakan hadir 15 menit lebih awal.");
  });

  it("mengubah catatan kosong menjadi null", async () => {
    updateMock.mockResolvedValue({ id: "r1" });
    await updateReservationStatus({ id: "r1", status: "MENUNGGU", catatanAdmin: "" });
    const arg = updateMock.mock.calls[0]![0] as { data: { catatanAdmin: string | null } };
    expect(arg.data.catatanAdmin).toBeNull();
  });

  it("menolak status yang tidak dikenal", async () => {
    const res = await updateReservationStatus({ id: "r1", status: "NGACO" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("INVALID");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("mengembalikan NOT_FOUND saat permohonan tidak ada (P2025)", async () => {
    updateMock.mockRejectedValue(Object.assign(new Error("not found"), { code: "P2025" }));
    const res = await updateReservationStatus({ id: "rX", status: "DISETUJUI" });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("NOT_FOUND");
  });

  it("mengembalikan UNAVAILABLE saat DB bermasalah", async () => {
    updateMock.mockRejectedValue(new Error("db down"));
    const res = await updateReservationStatus({ id: "r1", status: "DISETUJUI" });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("UNAVAILABLE");
  });
});
