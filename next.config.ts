import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      {
        // Thumbnail video YouTube (kanal Media Center HST).
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
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
