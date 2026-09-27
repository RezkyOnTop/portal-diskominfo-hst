import { describe, it, expect } from "vitest";
import { rateLimit, clientIp } from "./rate-limit";

describe("rateLimit", () => {
  it("mengizinkan permintaan di bawah batas", () => {
    const key = `test-${Math.random()}`;
    const first = rateLimit(key, 3, 60_000);
    expect(first.ok).toBe(true);
    expect(first.remaining).toBe(2);
  });

  it("memblokir setelah batas terlampaui", () => {
    const key = `test-${Math.random()}`;
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    const third = rateLimit(key, 2, 60_000);
    expect(third.ok).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });
});

describe("clientIp", () => {
  it("mengambil IP pertama dari x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(clientIp(req)).toBe("1.2.3.4");
  });
  it("fallback ke 'unknown' bila header tidak ada", () => {
    expect(clientIp(new Request("http://localhost"))).toBe("unknown");
  });
});
