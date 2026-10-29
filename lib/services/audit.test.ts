import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1", "user-agent": "vitest" })),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import {
  AKSI_SENSITIF,
  LABEL_AKSI,
  catatAudit,
  catatAuditSesi,
  daftarAktor,
  kontekPermintaan,
  listAuditLogs,
  ringkasanAudit,
} from "./audit";

const log = prisma.auditLog as unknown as Record<string, ReturnType<typeof vi.fn>>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("catatAudit", () => {
  it("menyimpan baris audit dengan nilai yang dipotong", async () => {
    log.create!.mockResolvedValue({});
    await catatAudit({
      actorId: "u1",
      actorName: "Admin Satu",
      actorRole: "ADMIN",
      aksi: "MASUK",
      detail: "x".repeat(900),
      ip: "1.2.3.4",
      userAgent: "y".repeat(500),
    });
    const arg = log.create!.mock.calls[0]![0] as { data: Record<string, string | null> };
    expect(arg.data.detail).toHaveLength(500);
    expect(arg.data.detail!.endsWith("…")).toBe(true);
    expect(arg.data.userAgent).toHaveLength(300);
  });

  it("tidak pernah melempar error walau penulisan gagal", async () => {
    log.create!.mockRejectedValue(new Error("db down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      catatAudit({ actorName: "X", actorRole: "EDITOR", aksi: "MASUK" }),
    ).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("membuang karakter kendali dari teks kiriman pengguna", async () => {
    log.create!.mockResolvedValue({});
    await catatAudit({
      actorName: "penyusup\r\nADMIN | Hapus akun",
      actorRole: "ANONIM",
      aksi: "MASUK_GAGAL",
      detail: "baris1\nbaris2\ttab",
    });
    const arg = log.create!.mock.calls[0]![0] as { data: Record<string, string | null> };
    expect(arg.data.actorName).toBe("penyusup ADMIN | Hapus akun");
    expect(arg.data.detail).toBe("baris1 baris2 tab");
    expect(arg.data.actorName).not.toContain("\n");
  });

  it("memberi nilai bawaan saat nama/aksi kosong", async () => {
    log.create!.mockResolvedValue({});
    await catatAudit({ actorName: "   ", actorRole: "", aksi: "" });
    const arg = log.create!.mock.calls[0]![0] as { data: Record<string, string | null> };
    expect(arg.data.actorName).toBe("Tidak dikenal");
    expect(arg.data.aksi).toBe("TIDAK_DIKENAL");
    expect(arg.data.detail).toBeNull();
  });
});

describe("catatAuditSesi", () => {
  it("menentukan peran dari sesi dan mengambil IP dari headers", async () => {
    log.create!.mockResolvedValue({});
    await catatAuditSesi(
      { user: { id: "u9", name: "Editor Sembilan", role: "EDITOR" } },
      { aksi: "UBAH_PEGAWAI", target: "Staff", targetId: "s1", detail: "ubah" },
    );
    const arg = log.create!.mock.calls[0]![0] as { data: Record<string, string | null> };
    expect(arg.data.actorRole).toBe("EDITOR");
    expect(arg.data.actorId).toBe("u9");
    expect(arg.data.ip).toBe("203.0.113.7");
    expect(arg.data.userAgent).toBe("vitest");
  });

  it("menandai ANONIM bila sesi kosong", async () => {
    log.create!.mockResolvedValue({});
    await catatAuditSesi(null, { aksi: "MASUK_GAGAL" }, { actorNama: "penyusup" });
    const arg = log.create!.mock.calls[0]![0] as { data: Record<string, string | null> };
    expect(arg.data.actorRole).toBe("ANONIM");
    expect(arg.data.actorName).toBe("penyusup");
  });
});

describe("listAuditLogs", () => {
  it("menerapkan filter aksi/aktor/pencarian dan batas limit", async () => {
    log.findMany!.mockResolvedValue([]);
    log.count!.mockResolvedValue(0);
    const hasil = await listAuditLogs({ aksi: "MASUK", aktor: "u1", q: "admin", limit: 999 });
    expect(hasil.total).toBe(0);
    const arg = log.findMany!.mock.calls[0]![0] as { take: number; where: Record<string, unknown> };
    expect(arg.take).toBe(200); // limit dibatasi 200
    expect(arg.where.aksi).toBe("MASUK");
    expect(arg.where.actorId).toBe("u1");
    expect(arg.where.OR).toBeTruthy();
  });

  it("memakai nilai bawaan saat filter kosong", async () => {
    log.findMany!.mockResolvedValue([]);
    log.count!.mockResolvedValue(0);
    await listAuditLogs();
    const arg = log.findMany!.mock.calls[0]![0] as { take: number; skip: number };
    expect(arg.take).toBe(50);
    expect(arg.skip).toBe(0);
  });

  it("membatasi halaman ekstrem dan panjang kata kunci", async () => {
    log.findMany!.mockResolvedValue([]);
    log.count!.mockResolvedValue(0);
    await listAuditLogs({ halaman: 999_999_999_999, q: "x".repeat(500) });
    const arg = log.findMany!.mock.calls[0]![0] as {
      skip: number;
      where: { OR: { actorName: { contains: string } }[] };
    };
    expect(arg.skip).toBeLessThanOrEqual(10_000 * 50);
    expect(arg.where.OR[0]!.actorName.contains).toHaveLength(100);
  });
});

describe("bantu lain", () => {
  it("daftarAktor mengembalikan baris terbatas", async () => {
    log.findMany!.mockResolvedValue([{ actorId: "u1", actorName: "A" }]);
    const rows = await daftarAktor();
    expect(rows).toHaveLength(1);
    const arg = log.findMany!.mock.calls[0]![0] as { take: number };
    expect(arg.take).toBe(50);
  });

  it("ringkasanAudit mengembalikan tiga angka", async () => {
    log.count!.mockResolvedValueOnce(5).mockResolvedValueOnce(2).mockResolvedValueOnce(99);
    const r = await ringkasanAudit();
    expect(r).toEqual({ hariIni: 5, gagalMasuk: 2, total: 99 });
  });

  it("kontekPermintaan membaca IP pertama dari X-Forwarded-For", async () => {
    const k = await kontekPermintaan();
    expect(k.ip).toBe("203.0.113.7");
    expect(k.userAgent).toBe("vitest");
  });

  it("label aksi & daftar sensitif tersedia", () => {
    expect(LABEL_AKSI.MASUK).toBeTruthy();
    expect(AKSI_SENSITIF.has("MASUK_GAGAL")).toBe(true);
  });
});
