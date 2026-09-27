import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getBerita,
  getBeritaBySlug,
  getPengumuman,
  getKategori,
  getHoaks,
  MediaCenterError,
  __clearMediaCenterCache,
} from "./media-center";

const RAW_BERITA = [
  {
    id_berita: "1",
    tanggal: "2026-01-02 10:00:00",
    title: "Berita Baru",
    isi: "<p>baru</p>",
    foto: "a.jpg",
    link: "",
    slug: "berita-baru",
    author: "Redaksi",
    kategori_id: "Pemerintahan",
  },
  {
    id_berita: "2",
    tanggal: "2026-01-01 10:00:00",
    title: "Berita Lama",
    isi: "<p>lama</p>",
    foto: "",
    link: "",
    slug: "berita-lama",
    author: "",
    kategori_id: "Ekonomi",
  },
];

function mockJson(body: unknown, status = 200) {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
}

describe("media-center adapter (integrasi, fetch di-mock)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    __clearMediaCenterCache();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getBerita: sukses, menormalisasi, dan mengurutkan terbaru dulu", async () => {
    vi.stubGlobal("fetch", mockJson(RAW_BERITA));
    const res = await getBerita({ page: 1, limit: 10 });
    expect(res.meta.total).toBe(2);
    expect(res.data[0]!.slug).toBe("berita-baru");
    expect(res.data[0]!.imageUrl).toContain("/assets/foto_brt/a.jpg");
    // Host gambar BERBEDA dari host API (regresi pernah terjadi: 404).
    expect(res.data[0]!.imageUrl).toMatch(
      /^https:\/\/data-mediacenter\.hstkab\.go\.id\/assets\/foto_brt\//,
    );
    expect(res.data[1]!.imageUrl).toBeNull();
    expect(res.data[0]!.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("getBerita: filter kategori & paginasi", async () => {
    vi.stubGlobal("fetch", mockJson(RAW_BERITA));
    const res = await getBerita({ category: "Ekonomi", limit: 1 });
    expect(res.meta.total).toBe(1);
    expect(res.data[0]!.slug).toBe("berita-lama");
    expect(res.meta.totalPages).toBe(1);
  });

  it("melewati item cacat tanpa menggagalkan seluruh feed (parsing toleran)", async () => {
    vi.stubGlobal(
      "fetch",
      mockJson([RAW_BERITA[0], { id_berita: "x" /* tanpa title/slug */ }]),
    );
    const res = await getBerita({ limit: 10 });
    expect(res.meta.total).toBe(1);
    expect(res.data[0]!.slug).toBe("berita-baru");
  });

  it("getBeritaBySlug: mengembalikan item yang cocok, null bila tidak ada", async () => {
    vi.stubGlobal("fetch", mockJson(RAW_BERITA));
    expect((await getBeritaBySlug("berita-baru"))?.title).toBe("Berita Baru");
    expect(await getBeritaBySlug("tidak-ada")).toBeNull();
  });

  it("getPengumuman: menormalisasi respons pengumuman", async () => {
    vi.stubGlobal(
      "fetch",
      mockJson([
        {
          id_pengumuman: "48",
          tanggal: "2026-09-07 23:09:16",
          title: "GFS",
          slug: "gfs",
          isi: "<p>x</p>",
          link: "https://example.go.id",
        },
      ]),
    );
    const res = await getPengumuman();
    expect(res.meta.total).toBe(1);
    expect(res.data[0]!.link).toBe("https://example.go.id");
  });

  it("getKategori: mengembalikan daftar kategori unik & terurut", async () => {
    vi.stubGlobal("fetch", mockJson(RAW_BERITA));
    expect(await getKategori()).toEqual(["Ekonomi", "Pemerintahan"]);
  });

  it("getHoaks: mengembalikan daftar kosong bila tidak ada data hoaks", async () => {
    vi.stubGlobal("fetch", mockJson(RAW_BERITA));
    const res = await getHoaks();
    expect(res.data).toHaveLength(0);
    expect(res.meta.total).toBe(0);
  });

  it("memakai cache in-memory: panggilan kedua tidak memanggil fetch lagi", async () => {
    const fetchMock = mockJson(RAW_BERITA);
    vi.stubGlobal("fetch", fetchMock);
    await getBerita({ limit: 1 });
    await getBerita({ limit: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stale-while-error: menyajikan cache lama saat API gagal", async () => {
    const fetchMock = mockJson(RAW_BERITA);
    vi.stubGlobal("fetch", fetchMock);
    const first = await getBerita({ limit: 10 });
    expect(first.meta.total).toBe(2);
    // API mati pada panggilan berikutnya, tetapi cache masih segar.
    vi.stubGlobal("fetch", mockJson({}, 500));
    const second = await getBerita({ limit: 10 });
    expect(second.meta.total).toBe(2);
  });

  it("melempar MediaCenterError (HTTP_500) saat server error tanpa cache", async () => {
    vi.stubGlobal("fetch", mockJson({}, 500));
    await expect(getBerita()).rejects.toBeInstanceOf(MediaCenterError);
    await expect(getBerita()).rejects.toThrow(/tidak tersedia/i);
  });

  it("melempar MediaCenterError saat 404", async () => {
    vi.stubGlobal("fetch", mockJson({}, 404));
    await expect(getPengumuman()).rejects.toThrow(MediaCenterError);
  });

  it("melempar MediaCenterError saat JSON tidak valid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("bukan-json", { status: 200 })),
    );
    await expect(getBerita()).rejects.toThrow(MediaCenterError);
  });

  it("melempar MediaCenterError saat bentuk bukan array", async () => {
    vi.stubGlobal("fetch", mockJson({ data: [] }));
    await expect(getBerita()).rejects.toThrow(MediaCenterError);
  });

  it("melempar MediaCenterError (TIMEOUT) saat request dibatalkan", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const err = new Error("aborted");
        err.name = "AbortError";
        throw err;
      }),
    );
    await expect(getBerita()).rejects.toThrow(MediaCenterError);
  });

  it("melempar MediaCenterError (NETWORK) saat fetch gagal total", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    await expect(getBerita()).rejects.toThrow(MediaCenterError);
  });
});
