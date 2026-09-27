import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/services/reservation", () => ({
  createReservation: vi.fn(),
}));

import { POST } from "./route";
import { createReservation } from "@/lib/services/reservation";

const createMock = createReservation as unknown as ReturnType<typeof vi.fn>;

const BODY_VALID = {
  nama: "Budi Santoso",
  instansi: "SMAN 1 Barabai",
  email: "budi@example.com",
  telepon: "081234567890",
  layanan: "Kunjungan / Studi Tiru",
  tanggal: "2026-10-05",
  waktuMulai: "09:00",
  waktuSelesai: "11:00",
  jumlahPeserta: 25,
  keperluan: "Studi tiru pengelolaan media center daerah.",
};

function makeRequest(body: unknown, ip = "10.1.1.1") {
  return new Request("http://localhost/api/reservasi", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/reservasi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mengembalikan 201 dan kode lacak saat berhasil", async () => {
    createMock.mockResolvedValue({ ok: true, id: "r1", kode: "RSV-ABC234" });
    const res = await POST(makeRequest(BODY_VALID));

    expect(res.status).toBe(201);
    const json = (await res.json()) as { ok: boolean; kode: string };
    expect(json.ok).toBe(true);
    expect(json.kode).toBe("RSV-ABC234");
  });

  it("meneruskan body apa adanya ke service layer", async () => {
    createMock.mockResolvedValue({ ok: true, id: "r1", kode: "RSV-ABC234" });
    await POST(makeRequest(BODY_VALID));

    const arg = createMock.mock.calls[0]![0] as { nama: string; jumlahPeserta: number };
    expect(arg.nama).toBe("Budi Santoso");
    expect(arg.jumlahPeserta).toBe(25);
  });

  it("mengembalikan 422 beserta fieldErrors saat validasi gagal", async () => {
    createMock.mockResolvedValue({
      ok: false,
      reason: "INVALID",
      message: "Data permohonan tidak valid.",
      fieldErrors: { email: ["Email tidak valid"] },
    });
    const res = await POST(makeRequest({ ...BODY_VALID, email: "salah" }));

    expect(res.status).toBe(422);
    const json = (await res.json()) as { ok: boolean; fieldErrors: Record<string, string[]> };
    expect(json.ok).toBe(false);
    expect(json.fieldErrors.email).toBeDefined();
  });

  it("mengembalikan 503 saat layanan tidak tersedia", async () => {
    createMock.mockResolvedValue({
      ok: false,
      reason: "UNAVAILABLE",
      message: "Layanan sedang tidak tersedia.",
    });
    const res = await POST(makeRequest(BODY_VALID));
    expect(res.status).toBe(503);
  });

  it("mengembalikan 400 saat body bukan JSON", async () => {
    const res = await POST(makeRequest("bukan-json"));
    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("mengembalikan 429 setelah melewati batas rate limit", async () => {
    createMock.mockResolvedValue({ ok: true, id: "r1", kode: "RSV-ABC234" });
    let last: Response | undefined;
    for (let i = 0; i < 7; i++) {
      last = await POST(makeRequest(BODY_VALID, "8.8.8.8"));
    }
    expect(last!.status).toBe(429);
  });
});
