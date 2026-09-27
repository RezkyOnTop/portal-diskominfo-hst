/**
 * Konfigurasi pusat: kontak resmi, tautan layanan eksternal, dan URL stream radio.
 * Semua tautan keluar dibatasi ke domain resmi (*.hstkab.go.id) atau lapor.go.id.
 */

export const SITE = {
  name: "Diskominfo SP Hulu Sungai Tengah",
  shortName: "Diskominfo SP HST",
  address:
    "Jl. Perintis Kemerdekaan, Benawa Tengah, Barabai, Hulu Sungai Tengah, Kalimantan Selatan 71314",
  email: "diskominfo@hstkab.go.id",
  phone: "(0517) 3790845",
  url: "https://diskominfosp.hstkab.go.id",
} as const;

export const LAYANAN = [
  {
    name: "PPID HST",
    description: "Permohonan dan layanan informasi publik.",
    href: "https://ppid.hstkab.go.id/",
  },
  {
    name: "Open Data HST",
    description: "Portal data terbuka daerah + Chatbot ONE DATA HST.",
    href: "https://opendata.hstkab.go.id/",
  },
  {
    name: "Lapor Bang Rizal",
    description: "Aplikasi pengaduan dan aspirasi masyarakat.",
    href: "https://www.lapor.go.id/instansi/dinas-komunikasi-dan-informasi-kabupaten-hulu-sungai-tengah/",
  },
  {
    name: "Radio HST",
    description: "Siaran radio pemerintah daerah.",
    href: "https://radio.hstkab.go.id",
  },
] as const;

export const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/berita", label: "Berita" },
  { href: "/pengumuman", label: "Pengumuman" },
  { href: "/hoaks", label: "Klarifikasi Hoaks" },
  { href: "/radio", label: "Radio" },
] as const;

/** URL stream radio (dari env, fallback ke halaman radio resmi). */
export function radioStreamUrl(): string {
  return process.env.RADIO_STREAM_URL ?? "https://radio.hstkab.go.id";
}
