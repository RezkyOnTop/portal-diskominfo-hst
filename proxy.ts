import { NextResponse, type NextRequest } from "next/server";

/**
 * proxy (pengganti `middleware` di Next.js 16) — pengalihan awal untuk area
 * admin. Ini hanya lapisan pertama; otorisasi sesungguhnya diverifikasi di
 * app/(admin)/layout.tsx via auth().
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
