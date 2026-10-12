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
    sessionStorage.clear();
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

    // Markdown di-escape lalu di-render aman: <strong> muncul, bukan tag mentah.
    // Cari di dalam area percakapan agar tidak bentrok dengan tautan "Buka BMKG".
    await waitFor(() => {
      const area = screen.getByLabelText(/Percakapan dengan asisten/i);
      const el = area.querySelectorAll("strong");
      expect(el[el.length - 1]?.textContent).toBe("/reservasi");
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

  it("tab Cuaca menampilkan nama daerah (desa · kecamatan)", async () => {
    mockFetch(() => ({ ok: true, json: async () => CUACA }));
    const user = userEvent.setup();
    render(<ComboMelayang />);
    await user.click(await screen.findByRole("button", { name: /Tanya AI Diskominfo/i }));
    await user.click(screen.getByRole("tab", { name: /Cuaca/i }));
    expect(await screen.findByText(/Barabai Darat · Kec\. Barabai/i)).toBeInTheDocument();
  });

  it("sumber BMKG hanya muncul SEKALI (tidak dobel)", async () => {
    mockFetch(() => ({ ok: true, json: async () => CUACA }));
    const user = userEvent.setup();
    render(<ComboMelayang />);
    await user.click(await screen.findByRole("button", { name: /Tanya AI Diskominfo/i }));
    await user.click(screen.getByRole("tab", { name: /Cuaca/i }));
    await screen.findByText(/Barabai Darat/i);
    // Teks sumber hanya satu; footer lama "Sumber cuaca: BMKG" sudah dibuang.
    expect(screen.getAllByText(/Sumber: BMKG/i)).toHaveLength(1);
    expect(screen.queryByText(/Sumber cuaca/i)).not.toBeInTheDocument();
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

  it("kirim ganda cepat hanya menghasilkan SATU request (kunci ref)", async () => {
    let chatCalls = 0;
    let lepas!: (v: unknown) => void;
    const tertahan = new Promise((res) => {
      lepas = res as (v: unknown) => void;
    });
    mockFetch((url) => {
      if (url.includes("/api/chat")) {
        chatCalls++;
        return tertahan.then(() => ({
          ok: true,
          json: async () => ({ ok: true, balasan: "ok", ditolak: false }),
        }));
      }
      return { ok: true, json: async () => CUACA };
    });
    const user = userEvent.setup();
    render(<ComboMelayang />);
    await user.click(await screen.findByRole("button", { name: /Tanya AI Diskominfo/i }));
    await user.type(screen.getByLabelText(/Pesan untuk asisten/i), "halo layanan");
    const kirim = screen.getByRole("button", { name: /Kirim pesan/i });
    // Dua klik sebelum fetch selesai — tanpa kunci ref ini jadi 2 pesan.
    await user.click(kirim);
    await user.click(kirim);
    lepas(null);
    await waitFor(() => expect(chatCalls).toBe(1));
  });

  it("riwayat chat TIDAK hilang saat pindah ke tab Cuaca lalu kembali", async () => {
    mockFetch((url) => {
      if (url.includes("/api/chat")) {
        return { ok: true, json: async () => ({ ok: true, balasan: "Baik, siap.", ditolak: false }) };
      }
      return { ok: true, json: async () => CUACA };
    });
    const user = userEvent.setup();
    render(<ComboMelayang />);
    await user.click(await screen.findByRole("button", { name: /Tanya AI Diskominfo/i }));
    await user.type(screen.getByLabelText(/Pesan untuk asisten/i), "halo apa kabar");
    await user.click(screen.getByRole("button", { name: /Kirim pesan/i }));
    await screen.findByText(/Baik, siap/i);

    // Pindah ke Cuaca, lalu kembali ke Asisten AI.
    await user.click(screen.getByRole("tab", { name: /Cuaca/i }));
    await user.click(screen.getByRole("tab", { name: /Asisten AI/i }));

    // Pertanyaan user + balasan harus masih ada.
    const area = screen.getByLabelText(/Percakapan dengan asisten/i);
    expect(area.textContent).toContain("halo apa kabar");
    expect(area.textContent).toContain("Baik, siap");
  });

  it("riwayat chat dipulihkan dari sessionStorage (simulasi refresh)", async () => {
    mockFetch(() => ({ ok: true, json: async () => CUACA }));
    sessionStorage.setItem(
      "diskominfosp:riwayat-chat",
      JSON.stringify([
        { role: "assistant", content: "Halo! Saya **Asisten AI Diskominfo SP HST** — tanya apa pun soal layanan kami: reservasi, profil, berita, data terbuka, kontak. Psst, saya juga tahu **cuaca Barabai** terkini. 🙂" },
        { role: "user", content: "pesan tersimpan sebelumnya" },
        { role: "assistant", content: "jawaban tersimpan sebelumnya" },
      ]),
    );
    const user = userEvent.setup();
    render(<ComboMelayang />);
    await user.click(await screen.findByRole("button", { name: /Tanya AI Diskominfo/i }));

    const area = await screen.findByLabelText(/Percakapan dengan asisten/i);
    await waitFor(() => expect(area.textContent).toContain("pesan tersimpan sebelumnya"));
    expect(area.textContent).toContain("jawaban tersimpan sebelumnya");
  });

  it("tombol Bersihkan mengosongkan riwayat kembali ke sapaan", async () => {
    mockFetch((url) => {
      if (url.includes("/api/chat")) {
        return { ok: true, json: async () => ({ ok: true, balasan: "Baik.", ditolak: false }) };
      }
      return { ok: true, json: async () => CUACA };
    });
    const user = userEvent.setup();
    render(<ComboMelayang />);
    await user.click(await screen.findByRole("button", { name: /Tanya AI Diskominfo/i }));
    await user.type(screen.getByLabelText(/Pesan untuk asisten/i), "halo halo");
    await user.click(screen.getByRole("button", { name: /Kirim pesan/i }));
    await screen.findByText(/Baik\./);

    await user.click(screen.getByRole("button", { name: /Bersihkan/i }));
    const area = screen.getByLabelText(/Percakapan dengan asisten/i);
    await waitFor(() => expect(area.textContent).not.toContain("halo halo"));
    expect(sessionStorage.getItem("diskominfosp:riwayat-chat")).toBeNull();
  });
});
