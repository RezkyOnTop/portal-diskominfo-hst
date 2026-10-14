import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/services/pengaduan", () => ({
  getPengaduanByKode: vi.fn(),
}));

import { GET } from "./route";
import { getPengaduanByKode } from "@/lib/services/pengaduan";

const mock = getPengaduanByKode as unknown as ReturnType<typeof vi.fn>;

const req = (kode: string, ip = "10.9.9.9") =>
  new Request(`http://localhost/api/pengaduan/status?kode=${encodeURIComponent(kode)}`, {
    headers: { "x-forwarded-for": ip },
  });

const BARIS = {
  kode: "PGD-ABC234",
  kategori: "Layanan Publik & Perizinan",
  status: "diproses",
  tanggapan: "Sedang kami tindak lanjuti.",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
};

describe("GET /api/pengaduan/status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mengembalikan data publik saat kode ditemukan", async () => {
    mock.mockResolvedValue(BARIS);
    const res = await GET(req("PGD-ABC234"));

    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; pengaduan: typeof BARIS };
    expect(json.ok).toBe(true);
    expect(json.pengaduan.kode).toBe("PGD-ABC234");
    expect(json.pengaduan.status).toBe("diproses");
    expect(mock).toHaveBeenCalledWith("PGD-ABC234");
  });

  it("tidak membocorkan identitas pengadu (hanya field publik)", async () => {
    mock.mockResolvedValue({
      ...BARIS,
      nama: "Siti",
      kontak: "0812",
      isi: "rahasia",
    });
    const res = await GET(req("PGD-ABC234"));
    const json = (await res.json()) as { pengaduan: Record<string, unknown> };

    expect(json.pengaduan.nama).toBeUndefined();
    expect(json.pengaduan.kontak).toBeUndefined();
    expect(json.pengaduan.isi).toBeUndefined();
  });

  it("mengembalikan 404 saat kode tidak ditemukan", async () => {
    mock.mockResolvedValue(null);
    const res = await GET(req("PGD-XXXXXX"));
    expect(res.status).toBe(404);
  });

  it("mengembalikan 404 untuk kode kosong", async () => {
    mock.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/pengaduan/status"));
    expect(res.status).toBe(404);
    expect(mock).toHaveBeenCalledWith("");
  });

  it("mengembalikan 429 setelah melewati batas rate limit", async () => {
    mock.mockResolvedValue(BARIS);
    let last: Response | undefined;
    for (let i = 0; i < 22; i++) {
      last = await GET(req("PGD-ABC234", "7.7.7.7"));
    }
    expect(last!.status).toBe(429);
    expect(last!.headers.get("Retry-After")).toBeTruthy();
  });
});
