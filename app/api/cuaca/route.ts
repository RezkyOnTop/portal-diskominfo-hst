import { NextResponse } from "next/server";
import { getPrakiraanCuaca, bmkgPageUrl, slotTerdekat } from "@/lib/api/bmkg";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cuaca — prakiraan cuaca untuk widget interaktif (sumber BMKG).
 *
 * Adapter `lib/api/bmkg.ts` tetap satu-satunya pemanggil api.bmkg.go.id;
 * route ini hanya menjembatani Client Component agar tidak memanggil BMKG
 * langsung dari browser (menghindari CORS & kebocoran bentuk upstream).
 * Rate-limited per IP; kegagalan upstream dibalas ramah (200 + degraded).
 */
export async function GET(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`cuaca:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, message: "Terlalu banyak permintaan." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const { data, degraded } = await getPrakiraanCuaca();
  if (!data || data.hari.length === 0) {
    return NextResponse.json(
      { data: null, sekarang: null, degraded: true, linkBmkg: bmkgPageUrl() },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      data,
      sekarang: slotTerdekat(data.hari),
      degraded,
      linkBmkg: bmkgPageUrl(data.adm4),
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
