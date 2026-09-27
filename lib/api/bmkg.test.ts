import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getPrakiraanCuaca,
  bmkgBaseUrl,
  bmkgAdm4,
  bmkgPageUrl,
  slotTerdekat,
  CuacaError,
  DEFAULT_ADM4,
  __clearCuacaCache,
} from "./bmkg";

/** Respons BMKG asli (diringkas): 2 hari, lokasi Barabai Darat. */
const RAW = {
  lokasi: {
    adm1: "63",
    adm2: "63.07",
    adm3: "63.07.06",
    adm4: "63.07.06.1001",
    provinsi: "Kalimantan Selatan",
    kotkab: "Hulu Sungai Tengah",
    kecamatan: "Barabai",
    desa: "Barabai Darat",
    lon: 115.3851490968,
    lat: -2.592090734,
    timezone: "Asia/Makassar",
  },
  data: [
    {
      lokasi: {
        adm4: "63.07.06.1001",
        provinsi: "Kalimantan Selatan",
        kotkab: "Hulu Sungai Tengah",
        kecamatan: "Barabai",
        desa: "Barabai Darat",
      },
      cuaca: [
        [
          {
            datetime: "2026-09-27T17:00:00Z",
            t: 24,
            tcc: 85,
            tp: 0,
            weather: 2,
            weather_desc: "Cerah Berawan",
            wd_deg: 32,
            wd: "N",
            wd_to: "S",
            ws: 5,
            hu: 94,
            vs: null,
            vs_text: null,
            time_index: "4-5",
            analysis_date: "2026-09-27T12:00:00",
            image: "https://api-apps.bmkg.go.id/storage/icon/cuaca/cerah berawan-pm.svg",
            utc_datetime: "2026-09-27 17:00:00",
            local_datetime: "2026-09-28 01:00:00",
          },
          {
            datetime: "2026-09-27T20:00:00Z",
            t: 27,
            weather: 1,
            weather_desc: "Cerah",
            wd: "NE",
            ws: 8,
            hu: 80,
            image: "https://api-apps.bmkg.go.id/storage/icon/cuaca/cerah.svg",
            local_datetime: "2026-09-28 04:00:00",
          },
        ],
        [
          {
            t: "25",
            weather: "2",
            weather_desc: "Cerah Berawan",
            wd: "n", // huruf kecil — harus tetap dipetakan
            ws: 4,
            hu: 90,
            image: null,
            local_datetime: "2026-09-29 01:00:00",
          },
        ],
      ],
    },
  ],
};

function mockJson(body: unknown, status = 200) {
  return vi.fn(async (input: RequestInfo | URL) => {
    void input;
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  });
}

describe("bmkg adapter (fetch di-mock)", () => {
  beforeEach(() => {
    __clearCuacaCache();
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("memakai base URL & adm4 default yang benar", () => {
    expect(bmkgBaseUrl()).toBe("https://api.bmkg.go.id");
    expect(bmkgAdm4()).toBe(DEFAULT_ADM4);
    expect(DEFAULT_ADM4).toBe("63.07.06.1001"); // Barabai Darat
  });

  it("menghormati override env BMKG_API_BASE_URL & BMKG_ADM4", () => {
    vi.stubEnv("BMKG_API_BASE_URL", "https://bmkg.test/");
    vi.stubEnv("BMKG_ADM4", "63.07.06.1003");
    expect(bmkgBaseUrl()).toBe("https://bmkg.test");
    expect(bmkgAdm4()).toBe("63.07.06.1003");
  });

  it("mengabaikan BMKG_ADM4 yang tidak valid (fallback ke default)", () => {
    vi.stubEnv("BMKG_ADM4", "bukan-kode!");
    expect(bmkgAdm4()).toBe(DEFAULT_ADM4);
    vi.stubEnv("BMKG_ADM4", "   ");
    expect(bmkgAdm4()).toBe(DEFAULT_ADM4);
  });

  it("menormalkan respons BMKG: lokasi, hari, slot, arah angin", async () => {
    vi.stubGlobal("fetch", mockJson(RAW));
    const { data, degraded } = await getPrakiraanCuaca();

    expect(degraded).toBe(false);
    expect(data).not.toBeNull();
    expect(data!.desa).toBe("Barabai Darat");
    expect(data!.kecamatan).toBe("Barabai");
    expect(data!.kotkab).toBe("Hulu Sungai Tengah");
    expect(data!.adm4).toBe("63.07.06.1001");
    expect(data!.analisis).toBe("2026-09-27T12:00:00");

    expect(data!.hari).toHaveLength(2);
    const [hari0, hari1] = data!.hari;

    // Label hari manusiawi.
    expect(hari0!.label).toBe("Hari ini");
    expect(hari1!.label).toBe("Besok");
    expect(hari0!.labelTanggal).toBe("28 Sep");

    // Rentang suhu dihitung dari slot.
    expect(hari0!.min).toBe(24);
    expect(hari0!.max).toBe(27);
    // Ringkasan = deskripsi tersering ("Cerah Berawan" muncul 2×).
    expect(hari0!.ringkas).toBe("Cerah Berawan");

    // Slot pertama: jam lokal, suhu dibulatkan, arah angin dipetakan.
    const s0 = hari0!.slot[0]!;
    expect(s0.jam).toBe("01:00");
    expect(s0.iso).toBe("2026-09-28T01:00:00+08:00");
    expect(s0.suhu).toBe(24);
    expect(s0.kelembapan).toBe(94);
    expect(s0.angin).toBe(5);
    expect(s0.arahAngin).toBe("N");
    expect(s0.arahAnginText).toBe("Utara");
    expect(s0.deskripsi).toBe("Cerah Berawan");
    expect(s0.ikon).toContain("bmkg.go.id");

    const s1 = hari0!.slot[1]!;
    expect(s1.arahAnginText).toBe("Timur Laut"); // NE
  });

  it("mentoleransi angka sebagai string & arah angin huruf kecil", async () => {
    vi.stubGlobal("fetch", mockJson(RAW));
    const { data } = await getPrakiraanCuaca();
    const besok = data!.hari[1]!.slot[0]!;
    expect(besok.suhu).toBe(25); // "25" -> 25
    expect(besok.kelembapan).toBe(90);
    expect(besok.arahAnginText).toBe("Utara"); // "n" -> Utara
    expect(besok.ikon).toBe(""); // image null -> string kosong
    expect(data!.hari[1]!.labelTanggal).toBe("29 Sep");
  });

  it("mengirim adm4 sebagai query param", async () => {
    const f = mockJson(RAW);
    vi.stubGlobal("fetch", f);
    await getPrakiraanCuaca("63.07.06.1005");
    expect(f).toHaveBeenCalledOnce();
    expect(String(f.mock.calls[0]![0])).toContain("adm4=63.07.06.1005");
  });

  it("memakai cache: panggilan kedua tidak fetch lagi", async () => {
    const f = mockJson(RAW);
    vi.stubGlobal("fetch", f);
    await getPrakiraanCuaca();
    await getPrakiraanCuaca();
    expect(f).toHaveBeenCalledOnce();
  });

  it("degraded (tanpa data) saat fetch gagal & tidak ada cache", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 500 })),
    );
    const { data, degraded } = await getPrakiraanCuaca();
    expect(degraded).toBe(true);
    expect(data).toBeNull();
  });

  it("stale-while-error: pakai cache lama setelah TTL lewat", async () => {
    vi.useFakeTimers();
    const ok = mockJson(RAW);
    vi.stubGlobal("fetch", ok);
    const first = await getPrakiraanCuaca();
    expect(first.degraded).toBe(false);

    // Lewati TTL (30 menit) lalu buat fetch gagal.
    vi.advanceTimersByTime(31 * 60 * 1000);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const second = await getPrakiraanCuaca();
    expect(second.degraded).toBe(true);
    expect(second.data).not.toBeNull(); // data lama tetap dipakai
    expect(second.data!.desa).toBe("Barabai Darat");
  });

  it("melempar CuacaError saat bentuk respons tidak sesuai", async () => {
    vi.stubGlobal("fetch", mockJson({ lokasi: {}, data: [] }));
    const { data, degraded } = await getPrakiraanCuaca();
    expect(data).toBeNull();
    expect(degraded).toBe(true);
  });

  it("CuacaError punya pesan generik (tanpa bocoran upstream)", () => {
    const err = new CuacaError("HTTP_500");
    expect(err.name).toBe("CuacaError");
    expect(err.code).toBe("HTTP_500");
    expect(err.message).toMatch(/tidak dapat dimuat/i);
    expect(err.message).not.toContain("500");
  });

  it("membuang hari tanpa slot valid", async () => {
    const slot = RAW.data[0]!.cuaca[1]![0]!;
    vi.stubGlobal(
      "fetch",
      mockJson({
        lokasi: RAW.lokasi,
        data: [
          {
            lokasi: RAW.lokasi,
            cuaca: [[], [slot]] as unknown as (typeof slot)[][],
          },
        ],
      }),
    );
    const { data } = await getPrakiraanCuaca();
    expect(data!.hari).toHaveLength(1);
    // Hari kosong dibuang, tetapi label mengikuti posisi hari sebenarnya:
    // slot yang tersisa bertanggal 29 Sep -> "Besok".
    expect(data!.hari[0]!.label).toBe("Besok");
    expect(data!.hari[0]!.labelTanggal).toBe("29 Sep");
  });

  it("memberi label hari ke-3 dengan nama hari (lusa)", async () => {
    const slot = RAW.data[0]!.cuaca[0]![0]!;
    vi.stubGlobal(
      "fetch",
      mockJson({
        lokasi: RAW.lokasi,
        data: [
          {
            lokasi: RAW.lokasi,
            cuaca: [[slot], [slot], [slot]] as unknown as (typeof slot)[][],
          },
        ],
      }),
    );
    const { data } = await getPrakiraanCuaca();
    // 2026-09-28 adalah hari Senin (dihitung dari tanggal kalender, bukan
    // dari instan UTC — lihat komentar labelHari()).
    expect(data!.hari[2]!.label).toBe("Senin");
  });

  it("label hari tidak bergeser oleh zona waktu server (TZ=UTC vs WITA)", async () => {
    const slot = RAW.data[0]!.cuaca[0]![0]!;
    vi.stubGlobal(
      "fetch",
      mockJson({
        lokasi: RAW.lokasi,
        data: [
          {
            lokasi: RAW.lokasi,
            cuaca: [[slot], [slot], [slot]] as unknown as (typeof slot)[][],
          },
        ],
      }),
    );
    // Beberapa TZ berbeda harus memberi label yang sama.
    for (const tz of ["UTC", "Asia/Makassar", "America/New_York"]) {
      process.env.TZ = tz;
      __clearCuacaCache();
      const { data } = await getPrakiraanCuaca();
      expect(data!.hari[2]!.label, `TZ=${tz}`).toBe("Senin");
    }
    process.env.TZ = "UTC";
  });

  it("degraded saat respons bukan JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("<html>bukan json</html>", {
            status: 200,
            headers: { "content-type": "text/html" },
          }),
      ),
    );
    const { data, degraded } = await getPrakiraanCuaca();
    expect(data).toBeNull();
    expect(degraded).toBe(true);
  });
});

describe("helper cuaca", () => {
  it("bmkgPageUrl menunjuk halaman prakiraan BMKG", () => {
    expect(bmkgPageUrl("63.07.06.1001")).toBe(
      "https://www.bmkg.go.id/cuaca/prakiraan-cuaca/63.07.06.1001",
    );
    expect(bmkgPageUrl()).toContain(DEFAULT_ADM4);
  });

  it("slotTerdekat memilih slot paling dekat dengan waktu sekarang", () => {
    const hari = [
      {
        tanggal: "2026-09-28",
        label: "Hari ini",
        labelTanggal: "28 Sep",
        min: 24,
        max: 27,
        ringkas: "Cerah Berawan",
        slot: [
          { jam: "01:00", iso: "2026-09-28T01:00:00+08:00", suhu: 24, kode: 2, deskripsi: "Cerah Berawan", kelembapan: 94, angin: 5, arahAngin: "N", arahAnginText: "Utara", ikon: "" },
          { jam: "10:00", iso: "2026-09-28T10:00:00+08:00", suhu: 30, kode: 0, deskripsi: "Cerah", kelembapan: 60, angin: 9, arahAngin: "E", arahAnginText: "Timur", ikon: "" },
        ],
      },
    ];
    // Pukul 09:30 WITA -> paling dekat slot 10:00.
    const jam0930 = new Date("2026-09-28T09:30:00+08:00");
    expect(slotTerdekat(hari, jam0930)!.jam).toBe("10:00");
    // Pukul 00:30 WITA -> paling dekat slot 01:00.
    const jam0030 = new Date("2026-09-28T00:30:00+08:00");
    expect(slotTerdekat(hari, jam0030)!.jam).toBe("01:00");
  });

  it("slotTerdekat mengembalikan null untuk daftar kosong", () => {
    expect(slotTerdekat([])).toBeNull();
  });
});
