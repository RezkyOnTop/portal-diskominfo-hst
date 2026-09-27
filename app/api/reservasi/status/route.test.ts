import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/services/reservation", () => ({
  getReservationByKode: vi.fn(),
}));

import { GET } from "./route";
import { getReservationByKode } from "@/lib/services/reservation";

const getMock = getReservationByKode as unknown as ReturnType<typeof vi.fn>;

const ROW = {
  id: "r1",
  kode: "RSV-ABC234",
  nama: "Budi Santoso",
  instansi: "SMAN 1 Barabai",
  email: "budi@example.com",
  telepon: "081234567890",
  layanan: "Kunjungan / Studi Tiru",
  tanggal: new Date("2026-10-05T00:00:00.000Z"),
  waktuMulai: "09:00",
  waktuSelesai: "11:00",
  jumlahPeserta: 25,
  keperluan: "Studi tiru.",
  status: "DISETUJUI",
  catatanAdmin: "Hadir 15 menit lebih awal.",
  createdAt: new Date("2026-09-28T02:00:00.000Z"),
  updatedAt: new Date("2026-09-28T03:00:00.000Z"),
};

function makeRequest(kode: string, ip = "10.2.2.2") {
  return new Request(`http://localhost/api/reservasi/status?kode=${encodeURIComponent(kode)}`, {
    headers: { "x-forwarded-for": ip },
  });
}

describe("GET /api/reservasi/status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mengembalikan data permohonan saat kode ditemukan", async () => {
    getMock.mockResolvedValue(ROW);
    const res = await GET(makeRequest("RSV-ABC234"));

    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; data: Record<string, unknown> };
    expect(json.ok).toBe(true);
    expect(json.data.kode).toBe("RSV-ABC234");
    expect(json.data.status).toBe("DISETUJUI");
  });

  it("TIDAK membocorkan email & telepon pemohon", async () => {
    getMock.mockResolvedValue(ROW);
    const res = await GET(makeRequest("RSV-ABC234"));
    const json = (await res.json()) as { data: Record<string, unknown> };

    expect(json.data.email).toBeUndefined();
    expect(json.data.telepon).toBeUndefined();
  });

  it("menerima kode huruf kecil (dinormalkan service)", async () => {
    getMock.mockResolvedValue(ROW);
    const res = await GET(makeRequest("rsv-abc234"));
    expect(res.status).toBe(200);
  });

  it("mengembalikan 400 saat format kode tidak valid", async () => {
    const res = await GET(makeRequest("NGACO"));
    expect(res.status).toBe(400);
    expect(getMock).not.toHaveBeenCalled();
  });

  it("mengembalikan 404 saat kode tidak ditemukan", async () => {
    getMock.mockResolvedValue(null);
    const res = await GET(makeRequest("RSV-ZZZZZZ"));
    expect(res.status).toBe(404);
  });

  it("mengembalikan 429 setelah melewati batas rate limit (anti penebakan kode)", async () => {
    getMock.mockResolvedValue(ROW);
    let last: Response | undefined;
    for (let i = 0; i < 22; i++) {
      last = await GET(makeRequest("RSV-ABC234", "7.7.7.7"));
    }
    expect(last!.status).toBe(429);
  });
});
