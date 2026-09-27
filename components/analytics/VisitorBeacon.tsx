"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * VisitorBeacon — mencatat kunjungan ke `/api/visitor` sekali per perubahan
 * halaman (data lokal: VisitorStat).
 *
 * Sifatnya best-effort: kegagalan tidak boleh terlihat pengguna, jadi error
 * ditelan. Pengiriman memakai `keepalive` agar tetap terkirim saat pengguna
 * berpindah halaman tepat setelah muat.
 *
 * Area admin (`/dashboard`, `/masuk`) tidak dicatat — statistik hanya untuk
 * halaman publik.
 */
export function VisitorBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/masuk")) return;

    const body = JSON.stringify({
      path: pathname,
      referrer: document.referrer || "",
    });

    void fetch("/api/visitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* analytics bersifat pelengkap — abaikan kegagalan */
    });
  }, [pathname]);

  return null;
}
