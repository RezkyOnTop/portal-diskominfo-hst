import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/services/subscriber", () => ({ listSubscribers: vi.fn() }));
vi.mock("@/lib/services/reservation", () => ({ listReservations: vi.fn() }));
vi.mock("@/lib/services/survey", () => ({ listSurveys: vi.fn() }));
vi.mock("@/lib/services/staff", () => ({ listStaffAdmin: vi.fn() }));

import { GET } from "./route";
import { auth } from "@/lib/auth";
import { listSubscribers } from "@/lib/services/subscriber";
import { listReservations } from "@/lib/services/reservation";
import { listSurveys } from "@/lib/services/survey";
import { listStaffAdmin } from "@/lib/services/staff";

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const subsMock = listSubscribers as unknown as ReturnType<typeof vi.fn>;
const resvMock = listReservations as unknown as ReturnType<typeof vi.fn>;
const surveiMock = listSurveys as unknown as ReturnType<typeof vi.fn>;
const staffMock = listStaffAdmin as unknown as ReturnType<typeof vi.fn>;

function makeRequest(jenis: string) {
  return new Request(`http://localhost/api/admin/ekspor?jenis=${jenis}`);
}

describe("GET /api/admin/ekspor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { email: "admin@example.com" } });
  });

  it("menolak tanpa sesi -> 401", async () => {
    authMock.mockResolvedValue(null);
    const res = await GET(makeRequest("subscriber"));
    expect(res.status).toBe(401);
    expect(subsMock).not.toHaveBeenCalled();
  });

  it("menolak jenis yang tidak dikenal -> 400", async () => {
    const res = await GET(makeRequest("rahasia"));
    expect(res.status).toBe(400);
  });

  it("mengekspor subscriber sebagai CSV", async () => {
    subsMock.mockResolvedValue([
      { name: "Budi", email: "budi@example.com", phone: "0812", isActive: true, subscribedAt: new Date("2026-09-01T00:00:00.000Z") },
    ]);
    const res = await GET(makeRequest("subscriber"));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    const body = await res.text();
    expect(body).toContain("Nama");
    expect(body).toContain("Budi");
  });

  it("mengekspor reservasi sebagai CSV dengan kolom kode & status", async () => {
    resvMock.mockResolvedValue([
      {
        kode: "RSV-ABC234",
        nama: "Budi",
        instansi: "SMAN 1",
        email: "budi@example.com",
        telepon: "0812",
        layanan: "Kunjungan / Studi Tiru",
        tanggal: new Date("2026-10-05T00:00:00.000Z"),
        waktuMulai: "09:00",
        waktuSelesai: "11:00",
        jumlahPeserta: 25,
        keperluan: "Studi tiru.",
        status: "MENUNGGU",
        catatanAdmin: null,
        createdAt: new Date("2026-09-28T02:00:00.000Z"),
      },
    ]);
    const res = await GET(makeRequest("reservasi"));

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("RSV-ABC234");
    expect(body).toContain("MENUNGGU");
  });

  it("mengekspor survei sebagai CSV dengan nilai IKM", async () => {
    surveiMock.mockResolvedValue([
      {
        layanan: "Layanan Informasi Publik (PPID)",
        u1: 4, u2: 4, u3: 3, u4: 4, u5: 4, u6: 4, u7: 4, u8: 3, u9: 4,
        ikm: 87.5,
        mutu: "B",
        saran: "Tingkatkan kecepatan.",
        nama: "Ani",
        kontak: "ani@example.com",
        createdAt: new Date("2026-09-20T00:00:00.000Z"),
      },
    ]);
    const res = await GET(makeRequest("survei"));

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("IKM");
    expect(body).toContain("87.5");
    // Ekspor survei mengambil seluruh baris, bukan hanya 100 pertama.
    expect(surveiMock).toHaveBeenCalledWith(10000);
  });

  it("menyertakan header unduhan (Content-Disposition)", async () => {
    subsMock.mockResolvedValue([]);
    const res = await GET(makeRequest("subscriber"));
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
  });

  it("mengekspor pegawai sebagai CSV dengan nama & unit", async () => {
    staffMock.mockResolvedValue([
      {
        id: "s1",
        nama: "Budi Santoso, S.Kom",
        nip: "19900101 202001 1 001",
        jabatan: "Pranata Komputer Ahli Pertama",
        unit: "Staf PPPK",
        fotoUrl: null,
        urutan: 10,
        aktif: true,
      },
    ]);
    const res = await GET(makeRequest("pegawai"));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    const body = await res.text();
    expect(body).toContain("Budi Santoso");
    expect(body).toContain("Staf PPPK");
    expect(body).toContain("NIP");
  });
});
