import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/services/survey", () => ({
  createSurvey: vi.fn(),
}));

import { POST } from "./route";
import { createSurvey } from "@/lib/services/survey";

const createMock = createSurvey as unknown as ReturnType<typeof vi.fn>;

function req(body: unknown, ip = "1.2.3.4") {
  return new Request("http://localhost/api/survei", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/survei", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("membalas 201 dengan id, ikm, mutu saat berhasil", async () => {
    createMock.mockResolvedValue({ ok: true, id: "s1", ikm: 100, mutu: "A" });
    const res = await POST(req({ layanan: "X" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.ikm).toBe(100);
    expect(body.mutu).toBe("A");
  });

  it("membalas 422 saat service menandai INVALID", async () => {
    createMock.mockResolvedValue({ ok: false, reason: "INVALID", message: "Data tidak valid." });
    const res = await POST(req({}));
    expect(res.status).toBe(422);
    expect((await res.json()).ok).toBe(false);
  });

  it("membalas 503 saat database tidak tersedia", async () => {
    createMock.mockResolvedValue({
      ok: false,
      reason: "UNAVAILABLE",
      message: "Layanan sedang tidak tersedia.",
    });
    const res = await POST(req({ layanan: "X" }));
    expect(res.status).toBe(503);
  });

  it("membalas 400 saat body bukan JSON", async () => {
    const bad = new Request("http://localhost/api/survei", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "9.9.9.9" },
      body: "bukan-json",
    });
    const res = await POST(bad);
    expect(res.status).toBe(400);
  });

  it("membalas 429 setelah melampaui batas laju (3/menit)", async () => {
    createMock.mockResolvedValue({ ok: true, id: "s", ikm: 100, mutu: "A" });
    let last: Response | null = null;
    for (let i = 0; i < 5; i++) {
      last = await POST(req({ layanan: "X" }, "5.5.5.5"));
    }
    expect(last!.status).toBe(429);
  });
});
