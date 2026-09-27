import { NextResponse } from "next/server";
import { createSubscriber } from "@/lib/services/subscriber";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/subscriber — pendaftaran subscriber radio (data lokal: RadioSubscriber).
 * Rate-limited per IP. Validasi Zod dilakukan di service layer.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`subscriber:${ip}`, 5, 60_000);
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

  const result = await createSubscriber(body);
  if (result.ok) {
    return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
  }
  const status = result.reason === "INVALID" ? 422 : result.reason === "DUPLICATE" ? 409 : 503;
  return NextResponse.json({ ok: false, message: result.message }, { status });
}
