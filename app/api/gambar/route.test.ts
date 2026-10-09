import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const ambilGambarBerita = vi.fn();
const hostGambarDiizinkan = vi.fn(
  (u: string) => /^https:\/\/data-mediacenter\.hstkab\.go\.id\//.test(u),
);

vi.mock("@/lib/api/gambar", () => ({
  ambilGambarBerita: (...a: unknown[]) => ambilGambarBerita(...a),
  hostGambarDiizinkan: (...a: unknown[]) => hostGambarDiizinkan(...(a as [string])),
}));

import { GET } from "./route";

const SRC = "https://data-mediacenter.hstkab.go.id/assets/foto_brt/a.jpg";
const req = (q: string, ip = "1.2.3.4") =>
  new Request(`http://localhost/api/gambar?${q}`, {
    headers: { "x-forwarded-for": ip },
  });

describe("GET /api/gambar", () => {
  beforeEach(() => {
    ambilGambarBerita.mockReset();
    hostGambarDiizinkan.mockClear();
  });

  it("menyajikan WebP dengan cache panjang", async () => {
    ambilGambarBerita.mockResolvedValue({ isi: Buffer.from([1, 2, 3]), mime: "image/webp" });
    const res = await GET(req(`url=${encodeURIComponent(SRC)}&w=800`));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");
    expect(res.headers.get("Cache-Control")).toContain("max-age=604800");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(ambilGambarBerita).toHaveBeenCalledWith(SRC, 800);
  });

  it("menolak host di luar allowlist (422) tanpa memanggil pengambil", async () => {
    const res = await GET(req(`url=${encodeURIComponent("https://jahat.example.com/x.jpg")}`));
    expect(res.status).toBe(422);
    expect(ambilGambarBerita).not.toHaveBeenCalled();
  });

  it("menolak parameter tidak valid (422)", async () => {
    const res = await GET(req("w=abc"));
    expect(res.status).toBe(422);
    expect(ambilGambarBerita).not.toHaveBeenCalled();
  });

  it("membalas 502 generik saat pengambilan gagal — tanpa bocor detail", async () => {
    ambilGambarBerita.mockRejectedValue(new Error("HTTP_500 TLS boom"));
    const res = await GET(req(`url=${encodeURIComponent(SRC)}`));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toMatch(/HTTP_|TLS|stack|boom/i);
  });

  it("membatasi laju permintaan per IP (429 setelah batas)", async () => {
    ambilGambarBerita.mockResolvedValue({ isi: Buffer.from([1]), mime: "image/webp" });
    let terakhir = 0;
    for (let i = 0; i < 130; i++) {
      const res = await GET(req(`url=${encodeURIComponent(SRC)}`, "7.7.7.7"));
      terakhir = res.status;
    }
    expect(terakhir).toBe(429);
  });
});
