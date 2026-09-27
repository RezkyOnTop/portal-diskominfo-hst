import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getDatasets,
  getFilterDataset,
  openDataBaseUrl,
  OpenDataError,
  __clearOpenDataCache,
} from "./opendata";

const RAW = {
  success: true,
  data: [
    {
      id: "5ce0",
      judul: "Jumlah Penduduk Menurut Agama",
      slug: "jumlah-penduduk-menurut-agama",
      deskripsi: "<p>Data <b>penduduk</b> &amp; agama.</p>",
      instansi: "Dinas Kependudukan dan Pencatatan Sipil",
      kategori: "Kependudukan",
      tahun: "2025",
      jenis_data: "xlsx",
      file_url: "",
      updated_at: "2026-03-31T03:40:21.899812+00:00",
      views: "116",
      status: "aktif",
    },
    {
      id: "a1b2",
      judul: "Produksi Perikanan",
      slug: "produksi-perikanan",
      deskripsi: null,
      instansi: "  ",
      kategori: null,
      tahun: 2024,
      jenis_data: "csv",
      updated_at: null,
      views: 5,
    },
  ],
  metadata: { total: 301, page: 1, limit: 12, total_pages: 26 },
  filters: {
    kategori: ["Kependudukan", "Ekonomi"],
    instansi: ["Dinas Pendidikan"],
  },
};

function mockJson(body: unknown, status = 200) {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
}

describe("opendata adapter (fetch di-mock)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    __clearOpenDataCache();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getDatasets: menormalisasi item, metadata, dan filter", async () => {
    vi.stubGlobal("fetch", mockJson(RAW));
    const res = await getDatasets({ page: 1, limit: 12 });
    expect(res.degraded).toBe(false);
    expect(res.meta.total).toBe(301);
    expect(res.meta.totalPages).toBe(26);
    expect(res.filters.kategori).toEqual(["Kependudukan", "Ekonomi"]);

    const first = res.data[0]!;
    expect(first.judul).toContain("Penduduk");
    // HTML dibersihkan & entitas di-decode.
    expect(first.deskripsi).toBe("Data penduduk & agama.");
    expect(first.jenisData).toBe("xlsx");
    expect(first.tahun).toBe("2025");
    expect(first.views).toBe(116);
    // URL menunjuk ke halaman detail portal Open Data.
    expect(first.url).toMatch(/^https:\/\/opendata\.hstkab\.go\.id\/public\/datasets\//);
    expect(first.url).toContain("jumlah-penduduk-menurut-agama");
  });

  it("memakai id sebagai fallback URL saat slug kosong (jangan buang data)", async () => {
    vi.stubGlobal(
      "fetch",
      mockJson({
        ...RAW,
        data: [
          { ...RAW.data[0], slug: null },
          { ...RAW.data[1], slug: "" },
        ],
      }),
    );
    const res = await getDatasets();
    // Kedua dataset TETAP ditampilkan (slug kosong bukan alasan membuang).
    expect(res.data).toHaveLength(2);
    expect(res.data[0]!.slug).toBe("");
    expect(res.data[0]!.url).toBe("https://opendata.hstkab.go.id/public/datasets/5ce0");
    expect(res.data[1]!.url).toContain("a1b2");
  });

  it("membuang kalimat pembuka bergaya AI pada deskripsi", async () => {
    vi.stubGlobal(
      "fetch",
      mockJson({
        ...RAW,
        data: [
          {
            ...RAW.data[0],
            deskripsi:
              "<p>Berikut adalah kode HTML rapi dari teks yang diberikan: Penjelasan Variabel</p>",
          },
        ],
      }),
    );
    const res = await getDatasets();
    expect(res.data[0]!.deskripsi).toBe("Penjelasan Variabel");
  });

  it("mengisi default untuk field kosong (instansi/kategori)", async () => {
    vi.stubGlobal("fetch", mockJson(RAW));
    const res = await getDatasets();
    const second = res.data[1]!;
    expect(second.instansi).toBe("Pemerintah Kabupaten HST");
    expect(second.kategori).toBe("Lainnya");
    expect(second.tahun).toBe("2024");
    expect(second.deskripsi).toBe("");
  });

  it("mengirim parameter filter ke URL", async () => {
    const fetchMock = mockJson(RAW);
    vi.stubGlobal("fetch", fetchMock);
    await getDatasets({
      page: 2,
      limit: 6,
      kategori: "Kesehatan",
      search: "penduduk",
      tahun: "2025",
      instansi: "Dinas Kesehatan",
    });
    const calls = fetchMock.mock.calls as unknown as [string][];
    const called = calls[0]![0];
    expect(called).toContain("page=2");
    expect(called).toContain("limit=6");
    expect(called).toContain("kategori=Kesehatan");
    expect(called).toContain("search=penduduk");
    expect(called).toContain("tahun=2025");
    expect(called).toContain("instansi=Dinas+Kesehatan");
  });

  it("melewati dataset cacat tanpa menggagalkan halaman (parsing toleran)", async () => {
    vi.stubGlobal(
      "fetch",
      mockJson({ ...RAW, data: [RAW.data[0], { id: "x" /* tanpa judul/slug */ }] }),
    );
    const res = await getDatasets();
    expect(res.data).toHaveLength(1);
    expect(res.data[0]!.slug).toBe("jumlah-penduduk-menurut-agama");
  });

  it("memakai cache in-memory: panggilan identik tidak fetch ulang", async () => {
    const fetchMock = mockJson(RAW);
    vi.stubGlobal("fetch", fetchMock);
    await getDatasets({ page: 1, limit: 12 });
    await getDatasets({ page: 1, limit: 12 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("degraded=true dengan data kosong saat gagal tanpa cache", async () => {
    vi.stubGlobal("fetch", mockJson({}, 500));
    const res = await getDatasets();
    expect(res.degraded).toBe(true);
    expect(res.data).toHaveLength(0);
    expect(res.meta.total).toBe(0);
  });

  it("stale-while-error: menyajikan cache lama saat API gagal setelah TTL lewat", async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal("fetch", mockJson(RAW));
      const first = await getDatasets({ page: 1, limit: 12 });
      expect(first.data).toHaveLength(2);
      // Lewati TTL cache (1 jam) supaya entri kadaluarsa tetapi masih tersimpan.
      vi.advanceTimersByTime(3_700_000);
      vi.stubGlobal("fetch", mockJson({}, 500));
      const second = await getDatasets({ page: 1, limit: 12 });
      expect(second.degraded).toBe(true);
      expect(second.data).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("degraded=true saat JSON tidak valid", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("bukan-json", { status: 200 })));
    const res = await getDatasets();
    expect(res.degraded).toBe(true);
  });

  it("degraded=true saat bentuk respons salah (tanpa data array)", async () => {
    vi.stubGlobal("fetch", mockJson({ foo: "bar" }));
    const res = await getDatasets();
    expect(res.degraded).toBe(true);
  });

  it("degraded=true saat fetch melempar error jaringan", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const res = await getDatasets();
    expect(res.degraded).toBe(true);
  });

  it("getFilterDataset mengembalikan kategori & instansi", async () => {
    vi.stubGlobal("fetch", mockJson(RAW));
    const f = await getFilterDataset();
    expect(f.kategori).toContain("Ekonomi");
    expect(f.instansi).toContain("Dinas Pendidikan");
  });

  it("openDataBaseUrl menghormati env override", () => {
    const prev = process.env.OPENDATA_API_BASE_URL;
    process.env.OPENDATA_API_BASE_URL = "https://contoh.go.id/";
    expect(openDataBaseUrl()).toBe("https://contoh.go.id");
    if (prev === undefined) delete process.env.OPENDATA_API_BASE_URL;
    else process.env.OPENDATA_API_BASE_URL = prev;
  });

  it("OpenDataError menyimpan kode & pesan generik", () => {
    const err = new OpenDataError("HTTP_500");
    expect(err.code).toBe("HTTP_500");
    expect(err.message).toMatch(/tidak dapat dimuat/i);
    expect(err).toBeInstanceOf(Error);
  });
});
