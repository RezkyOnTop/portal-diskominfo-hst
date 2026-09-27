import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/services/subscriber", () => ({
  createSubscriber: vi.fn(),
}));

import { POST } from "./route";
import { createSubscriber } from "@/lib/services/subscriber";

const createMock = createSubscriber as unknown as ReturnType<typeof vi.fn>;

function makeRequest(body: unknown, ip = "10.0.0.2") {
  return new Request("http://localhost/api/subscriber", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/subscriber", () => {
  beforeEach(() => vi.clearAllMocks());

  it("201 saat berhasil", async () => {
    createMock.mockResolvedValue({ ok: true, id: "s1" });
    const res = await POST(makeRequest({ name: "Budi", email: "a@b.com" }));
    expect(res.status).toBe(201);
  });

  it("422 saat input tidak valid", async () => {
    createMock.mockResolvedValue({ ok: false, reason: "INVALID", message: "x" });
    const res = await POST(makeRequest({ name: "B" }));
    expect(res.status).toBe(422);
  });

  it("409 saat duplikat", async () => {
    createMock.mockResolvedValue({ ok: false, reason: "DUPLICATE", message: "x" });
    const res = await POST(makeRequest({ name: "Budi", email: "a@b.com" }));
    expect(res.status).toBe(409);
  });

  it("503 saat layanan tidak tersedia", async () => {
    createMock.mockResolvedValue({ ok: false, reason: "UNAVAILABLE", message: "x" });
    const res = await POST(makeRequest({ name: "Budi", email: "a@b.com" }));
    expect(res.status).toBe(503);
  });

  it("400 saat body bukan JSON", async () => {
    const res = await POST(makeRequest("bukan-json"));
    expect(res.status).toBe(400);
  });

  it("429 setelah melewati batas rate limit", async () => {
    createMock.mockResolvedValue({ ok: true, id: "s1" });
    let last: Response | undefined;
    for (let i = 0; i < 7; i++) {
      last = await POST(makeRequest({ name: "Budi", email: "a@b.com" }, "8.8.8.8"));
    }
    expect(last!.status).toBe(429);
  });
});
