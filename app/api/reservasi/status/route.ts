import { NextResponse } from "next/server";
import { getReservationByKode } from "@/lib/services/reservation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/reservasi/status?kode=RSV-XXXXXX — cek status permohonan.
 * Hanya mengembalikan field yang aman ditampilkan (tanpa email/telepon penuh).
 * Rate-limited untuk mencegah penebakan kode.
 */
export async function GET(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`reservasi-status:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, message: "Terlalu banyak permintaan. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const kode = new URL(request.url).searchParams.get("kode") ?? "";
  if (!/^RSV-[A-Z0-9]{6}$/i.test(kode.trim())) {
    return NextResponse.json(
      { ok: false, message: "Format kode tidak valid (contoh: RSV-7K2M9Q)." },
      { status: 400 },
    );
  }

  const row = await getReservationByKode(kode);
  if (!row) {
    return NextResponse.json(
      { ok: false, message: "Permohonan dengan kode tersebut tidak ditemukan." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      kode: row.kode,
      nama: row.nama,
      layanan: row.layanan,
      tanggal: row.tanggal,
      waktuMulai: row.waktuMulai,
      waktuSelesai: row.waktuSelesai,
      jumlahPeserta: row.jumlahPeserta,
      status: row.status,
      catatanAdmin: row.catatanAdmin,
      createdAt: row.createdAt,
    },
  });
}
