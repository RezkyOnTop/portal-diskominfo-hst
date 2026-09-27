/**
 * Konfigurasi pusat: identitas, kontak resmi, struktur navigasi, layanan,
 * tautan terkait, dan URL stream radio.
 *
 * Nilai identitas & kontak diambil dari situs resmi (diskominfosp.hstkab.go.id).
 */

export const SITE = {
  name: "Dinas Komunikasi, Informatika, Statistik dan Persandian",
  shortName: "Diskominfo SP HST",
  fullName:
    "Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Hulu Sungai Tengah",
  address:
    "Jl. Perintis Kemerdekaan, Benawa Tengah, Kecamatan Barabai, Kabupaten Hulu Sungai Tengah, Provinsi Kalimantan Selatan, Kode Pos 71314",
  email: "diskominfosp@hstkab.go.id",
  phone: "085179577447",
  url: "https://diskominfosp.hstkab.go.id",
} as const;

/**
 * Koordinat kantor (terverifikasi dari Google Maps).
 * Plus Code C92V+JFH — Jl. Perintis Kemerdekaan, Benawa Tengah, Barabai.
 */
export const OFFICE_COORDS = {
  lat: -2.5986915,
  lng: 115.3938058,
} as const;

/**
 * URL embed Google Maps (tanpa API key) — pola yang sama dipakai situs lama.
 * Mode `q=lat,lng&output=embed` di-redirect Google ke /maps/embed dan dapat
 * dibingkai di iframe.
 */
export function googleMapsEmbedUrl(zoom = 16): string {
  const { lat, lng } = OFFICE_COORDS;
  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&hl=id&output=embed`;
}

/** URL petunjuk arah (dibuka di tab baru). */
export function googleMapsDirectionsUrl(): string {
  const { lat, lng } = OFFICE_COORDS;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** URL tempat di Google Maps (dibuka di tab baru). */
export function googleMapsPlaceUrl(): string {
  const { lat, lng } = OFFICE_COORDS;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** Tagline hero. */
export const HERO = {
  region: "Kabupaten Hulu Sungai Tengah",
  title: "Selamat Datang",
  subtitle:
    "Dinas Komunikasi, Informatika, Statistik dan Persandian",
} as const;

export interface NavItem {
  label: string;
  href?: string;
  external?: boolean;
  children?: NavItem[];
}

/** Struktur menu utama (mega-menu) — mengikuti situs resmi. */
export const NAV_MENU: NavItem[] = [
  { label: "Beranda", href: "/" },
  {
    label: "Profil",
    children: [
      { label: "Visi & Misi", href: "/profil/visi-misi" },
      { label: "Tugas & Fungsi", href: "/profil/tugas-fungsi" },
      { label: "Maklumat Pelayanan", href: "/profil/maklumat-pelayanan" },
      { label: "Sejarah", href: "/profil/sejarah" },
    ],
  },
  {
    label: "Berita",
    children: [
      { label: "Berita Terbaru", href: "/berita" },
      { label: "Pengumuman", href: "/pengumuman" },
      { label: "Klarifikasi Hoaks", href: "/hoaks" },
      {
        label: "Berita Mediacenter",
        href: "https://mediacenter.hstkab.go.id",
        external: true,
      },
      {
        label: "Berita Video",
        href: "https://www.youtube.com/@mediacenterhst",
        external: true,
      },
    ],
  },
  {
    label: "Layanan",
    children: [
      { label: "Daftar Layanan", href: "/layanan" },
      { label: "Radio Swara Murakata", href: "/radio" },
      { label: "Survei Kepuasan Layanan", href: "/survei" },
      {
        label: "PPID HST",
        href: "https://ppid.hstkab.go.id/",
        external: true,
      },
      {
        label: "SP4N Lapor!",
        href: "https://www.lapor.go.id",
        external: true,
      },
    ],
  },
  {
    label: "Data",
    children: [
      { label: "Data Terbuka (Open Data)", href: "/data-terbuka" },
      {
        label: "Portal Open Data HST",
        href: "https://opendata.hstkab.go.id/",
        external: true,
      },
      {
        label: "Titik Internet & Metronet",
        href: "https://sipetir.hstkab.go.id/",
        external: true,
      },
      {
        label: "Rantaimas",
        href: "https://rantaimas.hstkab.go.id/",
        external: true,
      },
    ],
  },
  { label: "Kontak", href: "/kontak" },
];
/** Layanan digital terkait (dipakai di section & footer). */
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
    name: "Titik Internet & Metronet",
    description: "Peta titik akses internet publik (SIPETIR).",
    href: "https://sipetir.hstkab.go.id/",
  },
] as const;

/** Empat unit kerja di Diskominfo SP HST: Sekretariat + tiga bidang. */
export const BIDANG = [
  {
    name: "Sekretariat",
    description:
      "Menyelenggarakan pelayanan administrasi umum, kepegawaian, keuangan, perencanaan, dan ketatausahaan untuk mendukung kelancaran tugas dan fungsi dinas.",
    icon: "briefcase",
  },
  {
    name: "Bidang Informatika dan Persandian",
    description:
      "Menyediakan solusi teknologi untuk mendukung digitalisasi dalam pengelolaan layanan SKPD melalui pengembangan sistem informasi dan aplikasi internal yang terintegrasi.",
    icon: "code",
  },
  {
    name: "Bidang Komunikasi dan Informasi Publik",
    description:
      "Menyelenggarakan layanan reservasi kegiatan dan permohonan publikasi untuk meningkatkan akses informasi kepada masyarakat melalui berbagai platform dan statistik yang transparan.",
    icon: "megaphone",
  },
  {
    name: "Bidang Data dan Statistik",
    description:
      "Menyediakan layanan pengelolaan, analisis, dan penyajian data statistik yang akurat dan akuntabel sebagai dasar pengambilan kebijakan dan pemenuhan kebutuhan informasi publik.",
    icon: "chart",
  },
] as const;

/** Tautan terkait (footer) — mengikuti situs resmi. */
export const LINK_TERKAIT = [
  { name: "Kementerian Komdigi", href: "https://www.komdigi.go.id/" },
  { name: "Media Center Kalsel", href: "https://mediacenter.kalselprov.go.id/" },
  { name: "Media Center HST", href: "https://mediacenter.hstkab.go.id/" },
  { name: "Portal Kabupaten HST", href: "https://hstkab.go.id/" },
  { name: "Diskominfo Kalsel", href: "https://diskominfo.kalselprov.go.id/" },
  { name: "SP4N Lapor!", href: "https://www.lapor.go.id/" },
] as const;

/** Media sosial resmi. */
export const SOSIAL = [
  { name: "Instagram", href: "https://www.instagram.com/diskominfosp.hst/" },
  { name: "Facebook", href: "https://www.facebook.com/diskominfosp.hst" },
  { name: "YouTube", href: "https://www.youtube.com/@mediacenterhst" },
] as const;

/** URL stream radio (dari env, fallback ke halaman radio resmi). */
export function radioStreamUrl(): string {
  return process.env.RADIO_STREAM_URL ?? "https://radio.hstkab.go.id";
}

/** Nama radio pemerintah daerah. */
export const RADIO_NAME = "Radio Swara Murakata";
