/**
 * Kontrak tipe untuk data cuaca (sumber: BMKG — api.bmkg.go.id).
 *
 * PENTING: tipe di sini adalah bentuk NORMALISASI internal yang dipakai UI.
 * Bentuk mentah BMKG berbeda dan hanya boleh disentuh oleh adapter
 * (lib/api/bmkg.ts). UI tidak pernah tahu bentuk mentah.
 */

/** Satu slot prakiraan cuaca (per 3 jam). */
export interface CuacaSlot {
  /** Waktu lokal (WITA, Asia/Makassar) siap tampil, mis. "10:00". */
  jam: string;
  /** ISO lokal penuh (mis. "2026-09-28T10:00:00+08:00") untuk atribut <time>. */
  iso: string;
  /** Suhu udara (°C). */
  suhu: number;
  /** Kode cuaca WMO/BMKG (mis. 0 = cerah, 3 = hujan ringan). */
  kode: number;
  /** Deskripsi Bahasa Indonesia, mis. "Cerah Berawan". */
  deskripsi: string;
  /** Kelembapan relatif (%). */
  kelembapan: number;
  /** Kecepatan angin (km/jam). */
  angin: number;
  /** Arah angin singkat, mis. "N" (dari arah Utara). */
  arahAngin: string;
  /** Arah angin lengkap Bahasa Indonesia, mis. "Utara". */
  arahAnginText: string;
  /** URL ikon resmi BMKG (SVG) — di-host BMKG, bukan aset lokal. */
  ikon: string;
}

/** Prakiraan satu hari. */
export interface CuacaHari {
  /** Tanggal lokal, mis. "2026-09-28". */
  tanggal: string;
  /** Label hari Bahasa Indonesia, mis. "Senin" atau "Hari ini". */
  label: string;
  /** Label tanggal pendek, mis. "28 Sep". */
  labelTanggal: string;
  /** Slot prakiraan sepanjang hari (biasanya 8 slot × 3 jam). */
  slot: CuacaSlot[];
  /** Suhu minimum hari itu (°C). */
  min: number;
  /** Suhu maksimum hari itu (°C). */
  max: number;
  /** Deskripsi cuaca yang paling sering muncul (ringkasan hari). */
  ringkas: string;
}

/** Hasil lengkap prakiraan cuaca untuk satu wilayah. */
export interface PrakiraanCuaca {
  /** Nama wilayah tingkat IV, mis. "Barabai Darat". */
  desa: string;
  /** Kecamatan, mis. "Barabai". */
  kecamatan: string;
  /** Kabupaten/kota, mis. "Hulu Sungai Tengah". */
  kotkab: string;
  /** Provinsi, mis. "Kalimantan Selatan". */
  provinsi: string;
  /** Kode wilayah BMKG (adm4), mis. "63.07.06.1001". */
  adm4: string;
  /** Waktu analisis BMKG (ISO lokal) — kapan prakiraan ini disusun. */
  analisis: string;
  /** Prakiraan harian berurutan (hari ini, besok, lusa). */
  hari: CuacaHari[];
}
