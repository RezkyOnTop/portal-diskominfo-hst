import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CuacaMelayang } from "./CuacaMelayang";

const SEKARANG = {
  jam: "10:00",
  iso: "2026-09-28T10:00:00+08:00",
  suhu: 36,
  kode: 0,
  deskripsi: "Cerah",
  kelembapan: 55,
  angin: 12,
  arahAngin: "E",
  arahAnginText: "Timur",
  ikon: "",
};

const PAYLOAD = {
  data: {
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
        slot: [SEKARANG],
      },
      {
        tanggal: "2026-09-29",
        label: "Besok",
        labelTanggal: "29 Sep",
        min: 23,
        max: 35,
        ringkas: "Berawan",
        slot: [
          { ...SEKARANG, jam: "10:00", iso: "2026-09-29T10:00:00+08:00", suhu: 35, kode: 3, deskripsi: "Berawan" },
        ],
      },
    ],
  },
  sekarang: SEKARANG,
  degraded: false,
  linkBmkg: "https://www.bmkg.go.id/cuaca/prakiraan-cuaca/63.07.06.1001",
};

function mockFetch(payload: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok, json: async () => payload })) as unknown as typeof fetch,
  );
}

describe("CuacaMelayang", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("menampilkan gelembung mini berisi suhu saat ini", async () => {
    mockFetch(PAYLOAD);
    render(<CuacaMelayang />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Cuaca Barabai: Cerah, 36 derajat/i })).toBeInTheDocument();
    });
  });

  it("klik gelembung membuka panel prakiraan; tab hari mengganti rincian", async () => {
    mockFetch(PAYLOAD);
    const user = userEvent.setup();
    render(<CuacaMelayang />);
    const tombol = await screen.findByRole("button", { name: /Cuaca Barabai/i });
    await user.click(tombol);

    expect(screen.getByRole("dialog", { name: /Prakiraan cuaca Barabai/i })).toBeInTheDocument();
    expect(screen.getAllByText("Cerah").length).toBeGreaterThanOrEqual(1);

    // Pindah ke tab "Besok" -> rincian per 3 jam ikut berubah.
    await user.click(screen.getByRole("tab", { name: /Besok/i }));
    expect(screen.getByText("Berawan")).toBeInTheDocument();
  });

  it("menampilkan fallback ramah saat API gagal", async () => {
    mockFetch(null, false);
    const user = userEvent.setup();
    render(<CuacaMelayang />);
    const tombol = await screen.findByRole("button", { name: /Cuaca Barabai/i });
    await user.click(tombol);
    expect(await screen.findByText(/tidak dapat dimuat/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Buka BMKG/i })).toHaveAttribute(
      "href",
      expect.stringContaining("bmkg.go.id"),
    );
  });
});
