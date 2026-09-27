import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Gambar berita berasal dari API Media Center HST (assets/foto_brt).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mediacenter.hstkab.go.id",
        pathname: "/assets/**",
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
