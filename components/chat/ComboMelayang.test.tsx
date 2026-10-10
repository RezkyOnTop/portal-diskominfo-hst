import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ComboMelayang } from "./ComboMelayang";

const CUACA = {
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
        slot: [
          {
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
          },
        ],
      },
    ],
  },
  sekarang: {
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
  },
  degraded: false,
  linkBmkg: "https://www.bmkg.go.id/cuaca/prakiraan-cuaca/63.07.06.1001",
};

function mockFetch(handler: (url: string, init?: RequestInit) => unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => handler(url, init)) as unknown as typeof fetch,
  );
}

describe("ComboMelayang", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("gelembung AI-utama dengan cuplikan cuaca", async () => {
    mockFetch(() => ({ ok: true, json: async () => CUACA }));
    render(<ComboMelayang />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Tanya AI Diskominfo. Cuaca Barabai Cerah, 36 derajat/i }),
      ).toBeInTheDocument();
    });
  });

  it("membuka panel: tab Asisten AI default + disclaimer privasi", async () => {
    mockFetch(() => ({ ok: true, json: async () => CUACA }));
    const user = userEvent.setup();
    render(<ComboMelayang />);
    const gelembung = await screen.findByRole("button", { name: /Tanya AI Diskominfo/i });
    await user.click(gelembung);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Jangan kirim data pribadi sensitif/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Asisten AI/i })).toHaveAttribute("aria-selected", "true");
  });

  it("kirim pesan -> tampilkan balasan AI (markdown aman)", async () => {
    mockFetch((url) => {
      if (url.includes("/api/chat")) {
        return { ok: true, json: async () => ({ ok: true, balasan: "Buka **/reservasi**.", ditolak: false }) };
      }
      return { ok: true, json: async () => CUACA };
    });
    const user = userEvent.setup();
    render(<ComboMelayang />);
    await user.click(await screen.findByRole("button", { name: /Tanya AI Diskominfo/i }));

    await user.type(screen.getByLabelText(/Pesan untuk asisten/i), "cara reservasi?");
    await user.click(screen.getByRole("button", { name: /Kirim pesan/i }));

    expect(await screen.findByText(/Buka/)).toBeInTheDocument();
    // Markdown di-escape lalu di-render aman: <strong> muncul, bukan tag mentah.
    // (ambil yang TERAKHIR — yang pertama milik sapaan pembuka.)
    await waitFor(() => {
      const semua = document.querySelectorAll(".space-y-1 strong");
      const el = semua[semua.length - 1];
      expect(el?.textContent).toBe("/reservasi");
    });
  });

  it("berpindah ke tab Cuaca menampilkan prakiraan BMKG", async () => {
    mockFetch(() => ({ ok: true, json: async () => CUACA }));
    const user = userEvent.setup();
    render(<ComboMelayang />);
    await user.click(await screen.findByRole("button", { name: /Tanya AI Diskominfo/i }));
    await user.click(screen.getByRole("tab", { name: /Cuaca/i }));
    expect(await screen.findByText(/Sumber: BMKG/i)).toBeInTheDocument();
  });

  it("menampilkan galat ramah saat /api/chat gagal (tanpa detail mentah)", async () => {
    mockFetch((url) => {
      if (url.includes("/api/chat")) {
        return { ok: false, status: 503, json: async () => ({ ok: false, message: "Asisten sedang sibuk." }) };
      }
      return { ok: true, json: async () => CUACA };
    });
    const user = userEvent.setup();
    render(<ComboMelayang />);
    await user.click(await screen.findByRole("button", { name: /Tanya AI Diskominfo/i }));
    await user.type(screen.getByLabelText(/Pesan untuk asisten/i), "halo");
    await user.click(screen.getByRole("button", { name: /Kirim pesan/i }));
    expect(await screen.findByText(/Asisten sedang sibuk/i)).toBeInTheDocument();
  });
});
