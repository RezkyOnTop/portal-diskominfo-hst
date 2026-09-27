import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RadioPlayerProvider } from "@/components/layout/RadioPlayerProvider";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://diskominfosp.hstkab.go.id"),
  title: {
    default: "Diskominfo SP Hulu Sungai Tengah",
    template: "%s — Diskominfo SP HST",
  },
  description:
    "Portal resmi Dinas Komunikasi, Informatika, Statistik, dan Persandian Kabupaten Hulu Sungai Tengah. Media center, berita, pengumuman, klarifikasi hoaks, dan radio pemerintah daerah.",
  keywords: [
    "Diskominfo HST",
    "Hulu Sungai Tengah",
    "Media Center HST",
    "berita Barabai",
    "PPID HST",
    "Open Data HST",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Diskominfo SP HST",
    title: "Diskominfo SP Hulu Sungai Tengah",
    description:
      "Portal resmi Diskominfo SP Kabupaten Hulu Sungai Tengah — berita, pengumuman, klarifikasi hoaks, dan radio pemerintah daerah.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${jakarta.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <a
          href="#konten-utama"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Lompat ke konten utama
        </a>
        <RadioPlayerProvider>
          <Navbar />
          <main id="konten-utama" className="flex-1 pb-16">
            {children}
          </main>
          <Footer />
        </RadioPlayerProvider>
      </body>
    </html>
  );
}
