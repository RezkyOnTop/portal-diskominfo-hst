import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/services/visitor", () => ({
  recordVisit: vi.fn(async () => ({ ok: true })),
}));

import { POST } from "./route";
import { recordVisit } from "@/lib/services/visitor";

const recordMock = recordVisit as unknown as ReturnType<typeof vi.fn>;

function makeRequest(body: unknown, ip = "10.0.0.1") {
  return new Request("http://localhost/api/visitor", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/visitor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mencatat kunjungan valid -> 202", async () => {
    const res = await POST(makeRequest({ path: "/berita" }));
    expect(res.status).toBe(202);
    expect(recordMock).toHaveBeenCalledOnce();
  });

  it("mengembalikan 400 saat body bukan JSON", async () => {
    const res = await POST(makeRequest("bukan-json"));
    expect(res.status).toBe(400);
  });

  it("mengembalikan 429 setelah melewati batas rate limit", async () => {
    let last: Response | undefined;
    for (let i = 0; i < 62; i++) {
      last = await POST(makeRequest({ path: "/" }, "9.9.9.9"));
    }
    expect(last!.status).toBe(429);
  });
});
