import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/api/media-center", () => ({
  getBerita: vi.fn(),
  getPengumuman: vi.fn(),
}));

import { getBerita, getPengumuman } from "@/lib/api/media-center";
import { cariGlobal, HALAMAN_STATIS } from "./search";

const beritaMock = getBerita as unknown as ReturnType<typeof vi.fn>;
const pengumumanMock = getPengumuman as unknown as ReturnType<typeof vi.fn>;

function wrap<T>(data: T[]) {
  return {
    data,
    meta: { page: 1, perPage: data.length, total: data.length, totalPages: 1 },
  };
}

const B1 = {
  id: "1",
  slug: "banjir-hst",
  title: "Banjir di Barabai",
  excerpt: "Banjir melanda Barabai",
  content: "<p>Banjir</p>",
  imageUrl: null,
  category: "Bencana",
  publishedAt: "2026-01-10T00:00:00.000Z",
  sourceUrl: "https://mediacenter.hstkab.go.id/berita/banjir-hst",
  author: "Redaksi",
};

describe("cariGlobal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    beritaMock.mockResolvedValue(wrap([B1]));
    pengumumanMock.mockResolvedValue(
      wrap([
        {
          id: "p1",
          slug: "pengumuman-1",
          title: "Pengumuman Banjir",
          body: "<p>Waspada banjir</p>",
          publishedAt: "2026-01-11T00:00:00.000Z",
          link: null,
        },
      ]),
    );
  });

  it("mengembalikan kosong bila kata kunci terlalu pendek", async () => {
    const res = await cariGlobal({ q: "a" });
    expect(res.total).toBe(0);
    expect(beritaMock).not.toHaveBeenCalled();
  });

  it("menemukan berita, pengumuman, dan halaman sekaligus", async () => {
    const res = await cariGlobal({ q: "banjir" });
    const kinds = res.data.map((d) => d.kind);
    expect(kinds).toContain("berita");
    expect(kinds).toContain("pengumuman");
    expect(res.counts.berita).toBe(1);
    expect(res.counts.pengumuman).toBe(1);
  });

  it("mencari halaman statis (mis. 'visi')", async () => {
    const res = await cariGlobal({ q: "visi misi" });
    expect(res.counts.halaman).toBeGreaterThan(0);
    expect(res.data.some((d) => d.href === "/profil/visi-misi")).toBe(true);
  });

  it("tidak case-sensitive & tahan spasi berlebih", async () => {
    const res = await cariGlobal({ q: "  BANJIR  " });
    expect(res.counts.berita).toBe(1);
  });

  it("membatasi jenis hasil sesuai filter", async () => {
    const res = await cariGlobal({ q: "banjir", jenis: ["berita"] });
    expect(res.counts.pengumuman).toBe(0);
    expect(res.counts.berita).toBe(1);
  });

  it("memfilter kategori berita", async () => {
    const ok = await cariGlobal({ q: "banjir", kategori: "Bencana" });
    expect(ok.counts.berita).toBe(1);
    const no = await cariGlobal({ q: "banjir", kategori: "Ekonomi" });
    expect(no.counts.berita).toBe(0);
  });

  it("memfilter rentang tanggal", async () => {
    const ok = await cariGlobal({ q: "banjir", dari: "2026-01-01", sampai: "2026-01-31" });
    expect(ok.counts.berita).toBe(1);
    const no = await cariGlobal({ q: "banjir", dari: "2027-01-01" });
    expect(no.counts.berita).toBe(0);
  });

  it("tetap mengembalikan halaman statis saat upstream gagal (degraded)", async () => {
    beritaMock.mockRejectedValue(new Error("upstream down"));
    pengumumanMock.mockRejectedValue(new Error("upstream down"));
    const res = await cariGlobal({ q: "visi" });
    expect(res.degraded).toBe(true);
    expect(res.counts.halaman).toBeGreaterThan(0);
  });

  it("menghormati limit hasil", async () => {
    const res = await cariGlobal({ q: "banjir", limit: 1 });
    expect(res.data.length).toBe(1);
  });

  it("menyusun daftar halaman statis yang valid", () => {
    expect(HALAMAN_STATIS.length).toBeGreaterThan(5);
    for (const h of HALAMAN_STATIS) {
      expect(h.href.startsWith("/")).toBe(true);
      expect(h.title.length).toBeGreaterThan(0);
    }
  });
});
