import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sembunyikan "X-Powered-By: Next.js" (kurangi info disclosure).
  poweredByHeader: false,
  // `sharp` dipakai untuk memproses gambar berita di /api/gambar.
  // `undici` dipakai untuk koneksi TLS khusus ke host gambar Media Center.
  serverExternalPackages: ["sharp", "undici"],
  images: {
    // Gambar berita berasal dari host DATA Media Center HST (assets/foto_brt),
    // yang BERBEDA dari host API. Lihat lib/api/media-center.ts (imageBaseUrl).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "data-mediacenter.hstkab.go.id",
        pathname: "/assets/**",
      },
      {
        protocol: "https",
        hostname: "mediacenter.hstkab.go.id",
        pathname: "/assets/**",
      },
      // Thumbnail video feed YouTube (SocialFeed) — i.ytimg.com / iN.ytimg.com.
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      { protocol: "https", hostname: "i1.ytimg.com", pathname: "/vi/**" },
      { protocol: "https", hostname: "i2.ytimg.com", pathname: "/vi/**" },
      { protocol: "https", hostname: "i3.ytimg.com", pathname: "/vi/**" },
      { protocol: "https", hostname: "i4.ytimg.com", pathname: "/vi/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
