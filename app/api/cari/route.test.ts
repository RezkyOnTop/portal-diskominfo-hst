import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/services/search", () => ({
  cariGlobal: vi.fn(),
}));

import { GET } from "./route";
import { cariGlobal } from "@/lib/services/search";

const cariMock = cariGlobal as unknown as ReturnType<typeof vi.fn>;

function req(qs: string) {
  return new Request(`http://localhost/api/cari?${qs}`, {
    headers: { "x-forwarded-for": "1.2.3.4" },
  });
}

describe("GET /api/cari", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cariMock.mockResolvedValue({
      data: [],
      total: 0,
      counts: { berita: 0, pengumuman: 0, halaman: 0 },
      degraded: false,
    });
  });

  it("menolak q terlalu pendek (422)", async () => {
    const res = await GET(req("q=a"));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("menolak tanpa q (422)", async () => {
    const res = await GET(req(""));
    expect(res.status).toBe(422);
  });

  it("mengembalikan hasil untuk q valid", async () => {
    cariMock.mockResolvedValue({
      data: [{ kind: "berita", id: "b:1", title: "X", excerpt: "", href: "/berita/x" }],
      total: 1,
      counts: { berita: 1, pengumuman: 0, halaman: 0 },
      degraded: false,
    });
    const res = await GET(req("q=banjir"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.total).toBe(1);
  });

  it("mengurai parameter jenis & limit", async () => {
    await GET(req("q=banjir&jenis=berita,halaman&limit=5"));
    expect(cariMock).toHaveBeenCalledWith(
      expect.objectContaining({ q: "banjir", jenis: ["berita", "halaman"], limit: 5 }),
    );
  });

  it("membalas 502 (tanpa membocorkan error) saat service gagal", async () => {
    cariMock.mockRejectedValue(new Error("boom rahasia"));
    const res = await GET(req("q=banjir"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("rahasia");
  });

  it("membalas 429 saat melampaui batas laju", async () => {
    let last: Response | null = null;
    for (let i = 0; i < 35; i++) {
      last = await GET(req("q=banjir"));
    }
    expect(last!.status).toBe(429);
  });
});
