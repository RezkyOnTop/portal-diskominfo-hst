import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const getPrakiraanCuaca = vi.fn();
const bmkgPageUrl = vi.fn((adm4 = "63.07.06.1001") => `https://www.bmkg.go.id/cuaca/prakiraan-cuaca/${adm4}`);
const slotTerdekat = vi.fn((hari: { slot: { iso: string }[] }[]) => hari[0]?.slot[0] ?? null);

vi.mock("@/lib/api/bmkg", () => ({
  getPrakiraanCuaca: (...a: unknown[]) => getPrakiraanCuaca(...a),
  bmkgPageUrl: (...a: unknown[]) => bmkgPageUrl(...a as [string?]),
  slotTerdekat: (...a: unknown[]) => slotTerdekat(...a as [{ slot: { iso: string }[] }[]]),
}));

import { GET } from "./route";

const DATA = {
  desa: "Barabai Darat",
  kecamatan: "Barabai",
  kotkab: "Hulu Sungai Tengah",
  provinsi: "Kalimantan Selatan",
  adm4: "63.07.06.1001",
  analisis: "2026-09-27T12:00:00",
  hari: [
    {
      tanggal: "2026-09-28",
      label: "Hari ini",
      labelTanggal: "28 Sep",
      min: 23,
      max: 36,
      ringkas: "Cerah",
      slot: [
        { jam: "10:00", iso: "2026-09-28T10:00:00+08:00", suhu: 36, kode: 0, deskripsi: "Cerah", kelembapan: 55, angin: 12, arahAngin: "E", arahAnginText: "Timur", ikon: "" },
      ],
    },
  ],
};

const req = (ip = "1.2.3.4") =>
  new Request("http://localhost/api/cuaca?mini=1", { headers: { "x-forwarded-for": ip } });

describe("GET /api/cuaca", () => {
  beforeEach(() => {
    getPrakiraanCuaca.mockReset();
    slotTerdekat.mockClear();
    bmkgPageUrl.mockClear();
  });

  it("mengembalikan data + slot sekarang + tautan BMKG", async () => {
    getPrakiraanCuaca.mockResolvedValue({ data: DATA, degraded: false });
    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.desa).toBe("Barabai Darat");
    expect(body.sekarang.suhu).toBe(36);
    expect(body.degraded).toBe(false);
    expect(body.linkBmkg).toContain("bmkg.go.id");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("membalas ramah (200, degraded) saat BMKG gagal — tanpa error mentah", async () => {
    getPrakiraanCuaca.mockResolvedValue({ data: null, degraded: true });
    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeNull();
    expect(body.sekarang).toBeNull();
    expect(body.degraded).toBe(true);
    expect(JSON.stringify(body)).not.toMatch(/HTTP_|TIMEOUT|Error:|stack/i);
  });

  it("memperlakukan daftar hari kosong sebagai degradasi", async () => {
    getPrakiraanCuaca.mockResolvedValue({ data: { ...DATA, hari: [] }, degraded: false });
    const res = await GET(req());
    const body = await res.json();
    expect(body.data).toBeNull();
    expect(body.degraded).toBe(true);
  });

  it("membatasi laju permintaan per IP (429 setelah batas)", async () => {
    getPrakiraanCuaca.mockResolvedValue({ data: DATA, degraded: false });
    let terakhir = 0;
    for (let i = 0; i < 35; i++) {
      const res = await GET(req("9.9.9.9"));
      terakhir = res.status;
    }
    expect(terakhir).toBe(429);
  });
});
