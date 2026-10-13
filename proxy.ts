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
 * Fungsi: pengalihan awal untuk area admin. Ini hanya lapisan pertama;
 * otorisasi sesungguhnya diverifikasi di app/(admin)/layout.tsx via auth().
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  if (pathname.startsWith("/dashboard") && !hasSession) {
    const url = new URL("/masuk", request.nextUrl);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
