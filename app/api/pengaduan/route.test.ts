import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/services/pengaduan", () => ({
  createPengaduan: vi.fn(),
}));

import { POST } from "./route";
import { createPengaduan } from "@/lib/services/pengaduan";

const createMock = createPengaduan as unknown as ReturnType<typeof vi.fn>;

const BODY_VALID = {
  nama: "Siti Aminah",
  kontak: "081234567890",
  kategori: "Layanan Publik & Perizinan",
  isi: "Layanan informasi di loket sangat lambat pagi ini, mohon perhatian.",
};

function makeRequest(body: unknown, ip = "10.2.2.2") {
  return new Request("http://localhost/api/pengaduan", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/pengaduan", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mengembalikan 201 dan kode lacak saat berhasil", async () => {
    createMock.mockResolvedValue({ ok: true, id: "p1", kode: "PGD-ABC234" });
    const res = await POST(makeRequest(BODY_VALID));

    expect(res.status).toBe(201);
    const json = (await res.json()) as { ok: boolean; kode: string };
    expect(json.ok).toBe(true);
    expect(json.kode).toBe("PGD-ABC234");
  });

  it("mengembalikan 422 beserta fieldErrors saat validasi gagal", async () => {
    createMock.mockResolvedValue({
      ok: false,
      reason: "INVALID",
      message: "Data pengaduan tidak valid.",
      fieldErrors: { isi: ["Uraian minimal 15 karakter"] },
    });
    const res = await POST(makeRequest({ ...BODY_VALID, isi: "pendek" }));

    expect(res.status).toBe(422);
    const json = (await res.json()) as { ok: boolean; fieldErrors: Record<string, string[]> };
    expect(json.ok).toBe(false);
    expect(json.fieldErrors.isi).toBeDefined();
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
    createMock.mockResolvedValue({ ok: true, id: "p1", kode: "PGD-ABC234" });
    let last: Response | undefined;
    for (let i = 0; i < 7; i++) {
      last = await POST(makeRequest(BODY_VALID, "8.8.4.4"));
    }
    expect(last!.status).toBe(429);
  });
});
