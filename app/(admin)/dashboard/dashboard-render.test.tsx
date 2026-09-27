import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// --- Mock prasyarat server ---
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => ({ user: { email: "admin@example.com" } })) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("server-only", () => ({}));

// --- Mock service layer (data lokal) ---
vi.mock("@/lib/services/visitor", () => ({
  getStatistikRingkas: vi.fn(async () => ({
    total: 1234,
    hariIni: 56,
    perHari: [],
    halamanPopuler: [{ path: "/berita", jumlah: 400 }],
  })),
}));
vi.mock("@/lib/services/subscriber", () => ({ countSubscribers: vi.fn(async () => 42) }));
vi.mock("@/lib/services/survey", () => ({
  countSurveys: vi.fn(async () => 7),
  listSurveys: vi.fn(async () => [
    {
      id: "s1",
      layanan: "Layanan Informasi Publik (PPID)",
      u1: 4, u2: 4, u3: 3, u4: 4, u5: 4, u6: 4, u7: 4, u8: 3, u9: 4,
      ikm: 86.11,
      mutu: "B",
      saran: "Tingkatkan kecepatan layanan.",
      nama: "Ani",
      kontak: "ani@example.com",
      createdAt: new Date("2026-09-20T00:00:00.000Z"),
    },
  ]),
  getRingkasanSurvei: vi.fn(async () => ({
    responden: 7,
    ikm: 86.11,
    mutu: "B",
    perUnsur: [{ key: "u1", nrr: 3.8 }],
  })),
}));
vi.mock("@/lib/services/reservation", () => ({
  countReservations: vi.fn(async () => ({
    total: 5,
    menunggu: 2,
    disetujui: 2,
    ditolak: 0,
    selesai: 1,
  })),
  listReservations: vi.fn(async () => [
    {
      id: "r1",
      kode: "RSV-ABC234",
      nama: "Budi Santoso",
      instansi: "SMAN 1 Barabai",
      email: "budi@example.com",
      telepon: "081234567890",
      layanan: "Kunjungan / Studi Tiru",
      tanggal: new Date("2026-10-05T00:00:00.000Z"),
      waktuMulai: "09:00",
      waktuSelesai: "11:00",
      jumlahPeserta: 25,
      keperluan: "Studi tiru pengelolaan media center daerah.",
      status: "MENUNGGU",
      catatanAdmin: null,
      createdAt: new Date("2026-09-28T02:00:00.000Z"),
      updatedAt: new Date("2026-09-28T02:00:00.000Z"),
    },
  ]),
}));

import DashboardPage from "./page";
import ReservasiAdminPage from "./reservasi/page";
import SurveiAdminPage from "./survei/page";

describe("halaman dashboard admin (render dengan data lokal)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("ringkasan menampilkan angka kunjungan, subscriber, reservasi, dan survei", async () => {
    const html = renderToStaticMarkup(await DashboardPage());

    expect(html).toContain("1.234"); // total kunjungan (format id-ID)
    expect(html).toContain("42"); // subscriber
    expect(html).toContain("Reservasi menunggu");
    expect(html).toContain("Jawaban survei IKM");
    // Nilai IKM + halaman terpopuler
    expect(html).toContain("86.11");
    expect(html).toContain("/berita");
    // Tombol ekspor CSV tersedia
    expect(html).toContain("/api/admin/ekspor?jenis=reservasi");
    expect(html).toContain("/api/admin/ekspor?jenis=survei");
  });

  it("halaman reservasi menampilkan permohonan, kartu status, dan tombol ekspor", async () => {
    const html = renderToStaticMarkup(await ReservasiAdminPage({ searchParams: Promise.resolve({}) }));

    expect(html).toContain("RSV-ABC234");
    expect(html).toContain("Budi Santoso");
    expect(html).toContain("Kunjungan / Studi Tiru");
    expect(html).toContain("5 Oktober 2026"); // tanggal date-only, tidak bergeser
    expect(html).toContain("Menunggu Verifikasi");
    expect(html).toContain("Ekspor CSV");
  });

  it("halaman survei menampilkan nilai IKM, mutu, dan saran", async () => {
    const html = renderToStaticMarkup(await SurveiAdminPage());

    expect(html).toContain("86.11");
    expect(html).toContain("Mutu B");
    expect(html).toContain("Tingkatkan kecepatan layanan.");
    expect(html).toContain("Ekspor CSV");
  });
});
