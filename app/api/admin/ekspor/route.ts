import { auth } from "@/lib/auth";
import { listSubscribers } from "@/lib/services/subscriber";
import { listReservations } from "@/lib/services/reservation";
import { listSurveys } from "@/lib/services/survey";
import { csvHeaders, namaBerkasCsv, toCsv } from "@/lib/utils/csv";
import { IKM_UNSUR } from "@/lib/validations/local.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JenisEkspor = "subscriber" | "survei" | "reservasi";

function isJenis(v: string): v is JenisEkspor {
  return v === "subscriber" || v === "survei" || v === "reservasi";
}

/**
 * GET /api/admin/ekspor?jenis=subscriber|survei|reservasi
 * Unduh data lokal sebagai CSV. HANYA untuk sesi admin (Auth.js).
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Tidak diizinkan. Silakan masuk sebagai admin.", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const jenis = new URL(request.url).searchParams.get("jenis") ?? "";
  if (!isJenis(jenis)) {
    return new Response("Parameter `jenis` harus subscriber, survei, atau reservasi.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (jenis === "subscriber") {
    const rows = await listSubscribers();
    const csv = toCsv(
      ["Nama", "Email", "Telepon", "Status", "Terdaftar"],
      rows.map((s) => [
        s.name,
        s.email,
        s.phone ?? "",
        s.isActive ? "Aktif" : "Nonaktif",
        s.subscribedAt,
      ]),
    );
    return new Response(csv, { headers: csvHeaders(namaBerkasCsv("subscriber")) });
  }

  if (jenis === "survei") {
    const rows = await listSurveys(10000);
    const csv = toCsv(
      [
        "Layanan",
        ...IKM_UNSUR.map((u) => u.label),
        "IKM",
        "Mutu",
        "Saran",
        "Nama",
        "Kontak",
        "Waktu",
      ],
      rows.map((s) => [
        s.layanan,
        s.u1,
        s.u2,
        s.u3,
        s.u4,
        s.u5,
        s.u6,
        s.u7,
        s.u8,
        s.u9,
        s.ikm,
        s.mutu,
        s.saran ?? "",
        s.nama ?? "",
        s.kontak ?? "",
        s.createdAt,
      ]),
    );
    return new Response(csv, { headers: csvHeaders(namaBerkasCsv("survei-ikm")) });
  }

  const rows = await listReservations();
  const csv = toCsv(
    [
      "Kode",
      "Nama",
      "Instansi",
      "Email",
      "Telepon",
      "Layanan",
      "Tanggal",
      "Mulai",
      "Selesai",
      "Peserta",
      "Keperluan",
      "Status",
      "Catatan Admin",
      "Diajukan",
    ],
    rows.map((r) => [
      r.kode,
      r.nama,
      r.instansi ?? "",
      r.email,
      r.telepon,
      r.layanan,
      r.tanggal,
      r.waktuMulai,
      r.waktuSelesai ?? "",
      r.jumlahPeserta,
      r.keperluan,
      r.status,
      r.catatanAdmin ?? "",
      r.createdAt,
    ]),
  );
  return new Response(csv, { headers: csvHeaders(namaBerkasCsv("reservasi")) });
}
