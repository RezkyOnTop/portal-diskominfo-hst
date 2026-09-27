import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/media-center", () => ({
  getBerita: vi.fn(),
}));

import { getBerita } from "@/lib/api/media-center";
import { getGaleri } from "./galeri";

const beritaMock = getBerita as unknown as ReturnType<typeof vi.fn>;

function wrap(data: unknown[]) {
  return {
    data,
    meta: { page: 1, perPage: data.length, total: data.length, totalPages: 1 },
  };
}

function b(id: string, category: string, hasPhoto = true) {
  return {
    id,
    slug: `slug-${id}`,
    title: `Judul ${id}`,
    excerpt: "ringkasan",
    content: "<p>x</p>",
    imageUrl: hasPhoto ? `https://data-mediacenter.hstkab.go.id/assets/foto_brt/${id}.jpg` : null,
    category,
    publishedAt: "2026-01-01T00:00:00.000Z",
    sourceUrl: "https://mediacenter.hstkab.go.id/berita/x",
    author: "Redaksi",
  };
}

describe("getGaleri", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    beritaMock.mockResolvedValue(
      wrap([b("1", "Sosial"), b("2", "Ekonomi"), b("3", "Sosial"), b("4", "Ekonomi", false)]),
    );
  });

  it("hanya menyertakan berita yang punya foto", async () => {
    const res = await getGaleri();
    expect(res.meta.total).toBe(3);
    expect(res.data.every((f) => f.imageUrl)).toBe(true);
  });

  it("mengumpulkan daftar album unik & terurut", async () => {
    const res = await getGaleri();
    expect(res.albums).toEqual(["Ekonomi", "Sosial"]);
  });

  it("memfilter berdasarkan album", async () => {
    const res = await getGaleri({ album: "Sosial" });
    expect(res.meta.total).toBe(2);
    expect(res.data.every((f) => f.album === "Sosial")).toBe(true);
  });

  it("memfilter album tanpa peduli huruf besar/kecil", async () => {
    const res = await getGaleri({ album: "ekonomi" });
    expect(res.meta.total).toBe(1);
  });

  it("membagi halaman dengan benar", async () => {
    const res = await getGaleri({ limit: 2, page: 2 });
    expect(res.data).toHaveLength(1);
    expect(res.meta.page).toBe(2);
    expect(res.meta.totalPages).toBe(2);
  });

  it("membatasi halaman melebihi total", async () => {
    const res = await getGaleri({ limit: 2, page: 99 });
    expect(res.meta.page).toBe(2);
  });

  it("menautkan tiap foto ke halaman berita", async () => {
    const res = await getGaleri();
    expect(res.data[0].href).toBe("/berita/slug-1");
  });

  it("mengembalikan galeri kosong (tanpa melempar) saat upstream gagal", async () => {
    beritaMock.mockRejectedValue(new Error("upstream down"));
    const res = await getGaleri();
    expect(res.data).toEqual([]);
    expect(res.meta.total).toBe(0);
    expect(res.albums).toEqual([]);
  });
});
