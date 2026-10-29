import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeInitScript } from "@/components/layout/ThemeProvider";
import { SITE } from "@/lib/config";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Diskominfo SP Hulu Sungai Tengah",
    template: "%s — Diskominfo SP HST",
  },
  description:
    "Portal resmi Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Hulu Sungai Tengah. Media center, berita, pengumuman, klarifikasi hoaks, layanan digital, dan Radio Swara Murakata.",
  keywords: [
    "Diskominfo HST",
    "Hulu Sungai Tengah",
    "Media Center HST",
    "berita Barabai",
    "PPID HST",
    "Open Data HST",
    "Radio Swara Murakata",
  ],
  icons: {
    icon: [{ url: "/brand/favicon.ico" }],
    shortcut: [{ url: "/brand/favicon.ico" }],
    apple: [{ url: "/brand/logo-hitam.png" }],
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Diskominfo SP HST",
    title: "Diskominfo SP Hulu Sungai Tengah",
    description:
      "Portal resmi Diskominfo SP Kabupaten Hulu Sungai Tengah — berita, pengumuman, klarifikasi hoaks, dan Radio Swara Murakata.",
    images: ["/brand/logo-hitam.png"],
  },
};

/**
 * Root layout: HANYA kerangka dokumen (html/body/font/tema).
 *
 * Kerangka tampilan sengaja tidak diletakkan di sini supaya area publik dan
 * area dashboard tidak saling mewarisi. Chrome publik (navbar, footer, radio,
 * preloader) ada di `app/(public)/layout.tsx`; kerangka admin (sidebar, header)
 * ada di `app/(admin)/layout.tsx`.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${sora.variable} ${dmSans.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <a
          href="#konten-utama"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Lompat ke konten utama
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
