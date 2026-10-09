import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    staff: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));
vi.mock("@/lib/storage/foto", () => ({
  hapusSemuaFoto: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/db";
import {
  countStaff,
  createStaff,
  deleteStaff,
  getStaffById,
  listStaffAdmin,
  listStaffPublik,
  setFotoStaff,
  updateStaff,
} from "./staff";

const staffMock = prisma.staff as unknown as Record<string, ReturnType<typeof vi.fn>>;

function inputValid(over: Record<string, unknown> = {}) {
  return {
    nama: "Budi Santoso, S.Kom",
    nip: "19900101 202001 1 001",
    jabatan: "Pranata Komputer Ahli Pertama",
    unit: "Staf PPPK",
    urutan: 10,
    ...over,
  };
}

describe("createStaff", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menyimpan pegawai valid", async () => {
    staffMock.create!.mockResolvedValue({ id: "s1" });
    const res = await createStaff(inputValid());
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.id).toBe("s1");
    expect(staffMock.create!).toHaveBeenCalledOnce();
  });

  it("nip kosong dinormalkan jadi null", async () => {
    staffMock.create!.mockResolvedValue({ id: "s1" });
    await createStaff(inputValid({ nip: "  " }));
    const arg = staffMock.create!.mock.calls[0]![0] as { data: { nip: null } };
    expect(arg.data.nip).toBeNull();
  });

  it("menolak nama terlalu pendek dengan fieldErrors", async () => {
    const res = await createStaff(inputValid({ nama: "A" }));
    expect(res.ok).toBe(false);
    if (!res.ok && res.reason === "INVALID") {
      expect(res.fieldErrors?.nama).toBeDefined();
    }
    expect(staffMock.create!).not.toHaveBeenCalled();
  });

  it("menolak unit yang tidak dikenal", async () => {
    const res = await createStaff(inputValid({ unit: "Direksi" }));
    expect(res.ok).toBe(false);
    expect(staffMock.create!).not.toHaveBeenCalled();
  });
});

describe("updateStaff", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mengubah data pegawai valid", async () => {
    staffMock.update!.mockResolvedValue({ id: "s1" });
    const res = await updateStaff({ ...inputValid(), id: "s1", aktif: true });
    expect(res).toEqual({ ok: true, id: "s1" });
    expect(staffMock.update!).toHaveBeenCalledOnce();
  });

  it("mengembalikan NOT_FOUND bila id tidak ada", async () => {
    staffMock.update!.mockRejectedValue({ code: "P2025" });
    const res = await updateStaff({ ...inputValid(), id: "tidak-ada", aktif: true });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("NOT_FOUND");
  });

  it("menolak aktif non-boolean", async () => {
    const res = await updateStaff({ ...inputValid(), id: "s1", aktif: "ya" });
    expect(res.ok).toBe(false);
    expect(staffMock.update!).not.toHaveBeenCalled();
  });
});

describe("deleteStaff", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menghapus pegawai dan fotonya", async () => {
    staffMock.delete!.mockResolvedValue({ id: "s1" });
    const { hapusSemuaFoto } = await import("@/lib/storage/foto");
    const res = await deleteStaff({ id: "s1" });
    expect(res).toEqual({ ok: true, id: "s1" });
    expect(hapusSemuaFoto).toHaveBeenCalledWith("s1");
  });

  it("mengembalikan NOT_FOUND bila id tidak ada", async () => {
    staffMock.delete!.mockRejectedValue({ code: "P2025" });
    const res = await deleteStaff({ id: "tidak-ada" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("NOT_FOUND");
  });

  it("menolak id kosong", async () => {
    const res = await deleteStaff({ id: "  " });
    expect(res.ok).toBe(false);
    expect(staffMock.delete!).not.toHaveBeenCalled();
  });
});

describe("list / get / count", () => {
  beforeEach(() => vi.clearAllMocks());

  it("listStaffPublik hanya memfilter yang aktif", async () => {
    staffMock.findMany!.mockResolvedValue([]);
    await listStaffPublik();
    const arg = staffMock.findMany!.mock.calls[0]![0] as { where: { aktif: boolean } };
    expect(arg.where).toEqual({ aktif: true });
  });

  it("listStaffAdmin tanpa filter aktif", async () => {
    staffMock.findMany!.mockResolvedValue([]);
    await listStaffAdmin();
    const arg = staffMock.findMany!.mock.calls[0]![0] as { where?: unknown };
    expect(arg.where).toBeUndefined();
  });

  it("getStaffById mengembalikan null untuk id kosong", async () => {
    const res = await getStaffById("  ");
    expect(res).toBeNull();
    expect(staffMock.findUnique!).not.toHaveBeenCalled();
  });

  it("countStaff mengelompokkan per unit", async () => {
    staffMock.count!.mockResolvedValue(3);
    staffMock.groupBy!.mockResolvedValue([
      { unit: "Staf PNS", _count: { unit: 2 } },
      { unit: "Kepala Dinas", _count: { unit: 1 } },
    ]);
    const res = await countStaff();
    expect(res).toEqual({ total: 3, perUnit: { "Staf PNS": 2, "Kepala Dinas": 1 } });
  });
});

describe("setFotoStaff", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mengembalikan true bila update berhasil", async () => {
    staffMock.update!.mockResolvedValue({ id: "s1" });
    expect(await setFotoStaff("s1", "/api/pegawai/foto/s1")).toBe(true);
  });

  it("mengembalikan false dan membuang berkas bila id tidak ada", async () => {
    staffMock.update!.mockRejectedValue({ code: "P2025" });
    const { hapusSemuaFoto } = await import("@/lib/storage/foto");
    expect(await setFotoStaff("tidak-ada", "/api/pegawai/foto/tidak-ada")).toBe(false);
    expect(hapusSemuaFoto).toHaveBeenCalledWith("tidak-ada");
  });

  it("menyimpan null bila url kosong (kembali ke avatar default)", async () => {
    staffMock.update!.mockResolvedValue({ id: "s1" });
    expect(await setFotoStaff("s1", "  ")).toBe(true);
    const arg = staffMock.update!.mock.calls[0]![0] as { data: { fotoUrl: null } };
    expect(arg.data.fotoUrl).toBeNull();
  });
});
