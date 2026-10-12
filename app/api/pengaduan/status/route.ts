import { NextResponse } from "next/server";
import { getPengaduanByKode } from "@/lib/services/pengaduan";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/pengaduan/status?kode=PGD-XXXXXX — cek status pengaduan.
 * Hanya mengembalikan data publik (status + tanggapan), bukan identitas lengkap
 * pengadu lain. Rate-limited per IP untuk mencegah enumerasi kode.
 */
export async function GET(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`pengaduan-status:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, message: "Terlalu banyak permintaan. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const kode = new URL(request.url).searchParams.get("kode") ?? "";
  const row = await getPengaduanByKode(kode);
  if (!row) {
    return NextResponse.json(
      { ok: false, message: "Pengaduan dengan kode tersebut tidak ditemukan." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    pengaduan: {
      kode: row.kode,
      kategori: row.kategori,
      status: row.status,
      tanggapan: row.tanggapan,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
  });
}
