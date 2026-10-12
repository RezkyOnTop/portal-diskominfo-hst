import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const tanyaAI = vi.fn();
const bersihkanInputChat = vi.fn((s: string) => s.trim());

vi.mock("@/lib/api/ai-chat", () => ({
  CHAT_MAX_HISTORY: 6,
  CHAT_MAX_INPUT: 1000,
  bersihkanInputChat: (...a: unknown[]) => bersihkanInputChat(...(a as [string])),
  tanyaAI: (...a: unknown[]) => tanyaAI(...(a as [])),
}));

import { POST } from "./route";

const req = (body: unknown, ip = "1.2.3.4") =>
  new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });

describe("POST /api/chat", () => {
  beforeEach(() => {
    tanyaAI.mockReset();
    bersihkanInputChat.mockClear();
  });

  it("meneruskan pesan bersih ke AI dan membalas balasan", async () => {
    tanyaAI.mockResolvedValue({ balasan: "Reservasi lewat /reservasi.", ditolak: false });
    const res = await POST(req({ pesan: "cara reservasi?" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.balasan).toContain("/reservasi");
    expect(bersihkanInputChat).toHaveBeenCalled();
  });

  it("menolak body tak valid (400) dan pesan tak valid (422)", async () => {
    const buruk = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "x-forwarded-for": "1.2.3.4" },
        body: "bukan-json{{{",
      }),
    );
    expect(buruk.status).toBe(400);

    const kosong = await POST(req({ pesan: "" }));
    expect(kosong.status).toBe(422);

    const pendek = await POST(req({ pesan: "x" }));
    expect(pendek.status).toBe(422);
    expect(tanyaAI).not.toHaveBeenCalled();
  });

  it("membalas 503 generik saat AI gagal — tanpa bocor detail", async () => {
    tanyaAI.mockRejectedValue(new Error("quota habis key=rahasia-123"));
    const res = await POST(req({ pesan: "halo" }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toMatch(/quota|rahasia|stack/i);
  });

  it("memberi tahu bila AI belum dikonfigurasi (tanpa key)", async () => {
    tanyaAI.mockRejectedValue(new Error("AI belum dikonfigurasi."));
    const res = await POST(req({ pesan: "halo" }));
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.message).toContain("GROQ_API_KEY");
  });

  it("membatasi 10 pesan/menit per IP (429 setelah batas)", async () => {
    tanyaAI.mockResolvedValue({ balasan: "ok", ditolak: false });
    let terakhir = 0;
    for (let i = 0; i < 12; i++) {
      const res = await POST(req({ pesan: "halo" }, "9.9.9.9"));
      terakhir = res.status;
    }
    expect(terakhir).toBe(429);
  });
});
