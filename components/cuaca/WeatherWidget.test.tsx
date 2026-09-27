import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

const getPrakiraanCuaca = vi.fn();
vi.mock("@/lib/api/bmkg", () => ({
  getPrakiraanCuaca: (...a: unknown[]) => getPrakiraanCuaca(...a),
  bmkgPageUrl: (adm4 = "63.07.06.1001") =>
    `https://www.bmkg.go.id/cuaca/prakiraan-cuaca/${adm4}`,
  slotTerdekat: (
    hari: { slot: { iso: string }[] }[],
    now: Date = new Date(),
  ) => {
    const semua = hari.flatMap((h) => h.slot);
    if (semua.length === 0) return null;
    let best = semua[0]!;
    let diff = Infinity;
    for (const s of semua) {
      const d = Math.abs(new Date(s.iso).getTime() - now.getTime());
      if (d < diff) {
        diff = d;
        best = s;
      }
    }
    return best;
  },
}));

import { WeatherWidget } from "./WeatherWidget";

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
        { jam: "01:00", iso: "2026-09-28T01:00:00+08:00", suhu: 24, kode: 2, deskripsi: "Cerah Berawan", kelembapan: 94, angin: 5, arahAngin: "N", arahAnginText: "Utara", ikon: "" },
        { jam: "10:00", iso: "2026-09-28T10:00:00+08:00", suhu: 36, kode: 0, deskripsi: "Cerah", kelembapan: 55, angin: 12, arahAngin: "E", arahAnginText: "Timur", ikon: "" },
      ],
    },
    {
      tanggal: "2026-09-29",
      label: "Besok",
      labelTanggal: "29 Sep",
      min: 23,
      max: 35,
      ringkas: "Cerah Berawan",
      slot: [
        { jam: "10:00", iso: "2026-09-29T10:00:00+08:00", suhu: 35, kode: 2, deskripsi: "Cerah Berawan", kelembapan: 60, angin: 8, arahAngin: "SE", arahAnginText: "Tenggara", ikon: "" },
      ],
    },
  ],
};

describe("WeatherWidget", () => {
  beforeEach(() => {
    getPrakiraanCuaca.mockReset();
  });

  it("menampilkan lokasi, suhu, dan kondisi saat ini", async () => {
    getPrakiraanCuaca.mockResolvedValue({ data: DATA, degraded: false });
    // Waktu dipatok ke 01:00 WITA agar slot "sekarang" deterministik.
    vi.setSystemTime(new Date("2026-09-28T01:10:00+08:00"));
    render(await WeatherWidget());

    expect(screen.getByRole("heading", { name: /Barabai, Hulu Sungai Tengah/i })).toBeInTheDocument();
    expect(screen.getByText(/Barabai Darat/)).toBeInTheDocument();
    expect(screen.getByText("Sumber: BMKG")).toBeInTheDocument();
    // Suhu slot terdekat (01:00) = 24.
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText(/Kelembapan 94%/)).toBeInTheDocument();
    expect(screen.getByText(/Angin 5 km\/j dari Utara/)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("menampilkan kartu prakiraan untuk setiap hari", async () => {
    getPrakiraanCuaca.mockResolvedValue({ data: DATA, degraded: false });
    render(await WeatherWidget());

    expect(screen.getByText(/Prakiraan 2 Hari/)).toBeInTheDocument();
    expect(screen.getByText("Hari ini")).toBeInTheDocument();
    expect(screen.getByText("Besok")).toBeInTheDocument();
    expect(screen.getByText("28 Sep")).toBeInTheDocument();
    expect(screen.getByText("29 Sep")).toBeInTheDocument();
  });

  it("menyediakan tautan sumber ke BMKG", async () => {
    getPrakiraanCuaca.mockResolvedValue({ data: DATA, degraded: false });
    render(await WeatherWidget());
    const link = screen.getByRole("link", { name: /Lihat di BMKG/i });
    expect(link).toHaveAttribute(
      "href",
      "https://www.bmkg.go.id/cuaca/prakiraan-cuaca/63.07.06.1001",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("menampilkan fallback ramah saat data tidak tersedia (tanpa error mentah)", async () => {
    getPrakiraanCuaca.mockResolvedValue({ data: null, degraded: true });
    render(await WeatherWidget());

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/Informasi Cuaca Barabai/i);
    expect(alert).toHaveTextContent(/tidak dapat dimuat/i);
    expect(alert).not.toHaveTextContent(/HTTP_|TIMEOUT|Error:|stack/i);
    expect(screen.getByRole("link", { name: /Buka BMKG/i })).toHaveAttribute(
      "href",
      expect.stringContaining("bmkg.go.id"),
    );
  });

  it("memberi catatan 'data terakhir' saat degraded tapi ada data", async () => {
    getPrakiraanCuaca.mockResolvedValue({ data: DATA, degraded: true });
    render(await WeatherWidget());
    expect(screen.getByText(/Menampilkan data terakhir/i)).toBeInTheDocument();
  });

  it("menampilkan fallback bila daftar hari kosong", async () => {
    getPrakiraanCuaca.mockResolvedValue({
      data: { ...DATA, hari: [] },
      degraded: false,
    });
    render(await WeatherWidget());
    expect(screen.getByRole("alert")).toHaveTextContent(/tidak dapat dimuat/i);
  });
});
