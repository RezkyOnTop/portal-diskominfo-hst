import { NextResponse } from "next/server";
import { createReservation } from "@/lib/services/reservation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/reservasi — permohonan reservasi layanan (data lokal: ServiceReservation).
 * Rate-limited per IP. Validasi Zod dilakukan di service layer.
 * Membalas kode lacak yang bisa dicek pemohon di /reservasi/status.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`reservasi:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, message: "Terlalu banyak permintaan. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Body tidak valid." }, { status: 400 });
  }

  const result = await createReservation(body);
  if (result.ok) {
    return NextResponse.json({ ok: true, id: result.id, kode: result.kode }, { status: 201 });
  }
  const status = result.reason === "INVALID" ? 422 : 503;
  return NextResponse.json(
    { ok: false, message: result.message, fieldErrors: result.fieldErrors },
    { status },
  );
}
