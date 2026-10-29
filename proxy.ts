import { NextResponse, type NextRequest } from "next/server";

/**
 * ============================================================================
 *  proxy.ts — BERKAS KONVENSI FRAMEWORK. JANGAN DIPINDAH.
 * ============================================================================
 *
 * Di Next.js 16, berkas ini adalah pengganti `middleware.ts` dan WAJIB berada
 * di root proyek agar dikenali (sama seperti `next.config.ts`). Ia bukan util
 * biasa, jadi jangan "dirapikan" ke dalam folder lain — memindahkannya membuat
 * pengalihan area admin berhenti bekerja tanpa error yang jelas.
 *
 * Perannya: penjaga lapis pertama (murah, tanpa query database).
 *   - /dashboard/*  tanpa cookie sesi  -> redirect ke /masuk?callbackUrl=…
 *   - /api/admin/*  tanpa cookie sesi  -> 401 JSON (bukan halaman HTML)
 *
 * Lapis kedua ada di app/(admin)/layout.tsx yang memanggil auth() untuk
 * memvalidasi sesi sungguhan, dan di tiap route/aksi admin untuk memeriksa
 * peran ADMIN. Cookie yang dipalsukan akan lolos lapis ini tetapi gagal di
 * lapis kedua.
 */

const KUNCI_SESI = ["authjs.session-token", "__Secure-authjs.session-token"] as const;

function punyaSesi(request: NextRequest): boolean {
  return KUNCI_SESI.some((nama) => request.cookies.has(nama));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (punyaSesi(request)) return NextResponse.next();

  if (pathname.startsWith("/dashboard")) {
    const url = new URL("/masuk", request.nextUrl);
    // Sertakan query string agar filter/paginasi tidak hilang setelah login.
    url.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json(
      { error: "Tidak terautentikasi." },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*"],
};
