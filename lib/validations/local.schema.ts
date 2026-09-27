import { z } from "zod";

/** Validasi input form pendaftaran subscriber radio. */
export const SubscriberInputSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(120),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, "Nomor telepon tidak valid")
    .optional()
    .or(z.literal("")),
});

export type SubscriberInput = z.infer<typeof SubscriberInputSchema>;

/** Validasi pencatatan kunjungan (VisitorStat). */
export const VisitorInputSchema = z.object({
  path: z.string().trim().min(1).max(512),
  referrer: z.string().trim().max(1024).optional().or(z.literal("")),
});

export type VisitorInput = z.infer<typeof VisitorInputSchema>;

/**
 * ============================================================================
 *  Survei Kepuasan Masyarakat (IKM) — PermenPANRB No. 14 Tahun 2017
 * ============================================================================
 *  9 unsur pelayanan, masing-masing dinilai 1–4:
 *    1 = Tidak Baik, 2 = Kurang Baik, 3 = Baik, 4 = Sangat Baik
 *
 *  Rumus IKM:
 *    NRR (Nilai Rata-Rata)   = jumlah nilai per unsur / jumlah responden
 *    IKM Unit Layanan        = (total NRR tertimbang) × 25
 *      dengan bobot tiap unsur = 1/9 ≈ 0,111
 *
 *  Mutu pelayanan:
 *    A (Sangat Baik)  : 88,31 – 100,00
 *    B (Baik)         : 76,61 – 88,30
 *    C (Kurang Baik)  : 65,00 – 76,60
 *    D (Tidak Baik)   : 25,00 – 64,99
 */

/** Label tiap unsur IKM (urut u1..u9). */
export const IKM_UNSUR = [
  { key: "u1", label: "Persyaratan", desc: "Kemudahan persyaratan layanan" },
  { key: "u2", label: "Prosedur", desc: "Kemudahan alur/prosedur layanan" },
  { key: "u3", label: "Waktu Penyelesaian", desc: "Kecepatan waktu pelayanan" },
  { key: "u4", label: "Biaya/Tarif", desc: "Kewajaran biaya layanan" },
  { key: "u5", label: "Produk Layanan", desc: "Kesesuaian hasil layanan" },
  { key: "u6", label: "Kompetensi Pelaksana", desc: "Kemampuan petugas melayani" },
  { key: "u7", label: "Perilaku Pelaksana", desc: "Keramahan dan kesopanan petugas" },
  { key: "u8", label: "Penanganan Pengaduan", desc: "Respons terhadap keluhan" },
  { key: "u9", label: "Sarana & Prasarana", desc: "Kualitas fasilitas pendukung" },
] as const;

export const IKM_SKALA = [
  { value: 1, label: "Tidak Baik" },
  { value: 2, label: "Kurang Baik" },
  { value: 3, label: "Baik" },
  { value: 4, label: "Sangat Baik" },
] as const;

/** Pilihan layanan yang bisa dinilai. */
export const LAYANAN_SURVEI = [
  "Layanan Publikasi & Dokumentasi",
  "Layanan Informasi Publik (PPID)",
  "Layanan Radio Swara Murakata",
  "Layanan Data & Statistik",
  "Layanan Pengaduan & Aspirasi",
  "Layanan Jaringan & Infrastruktur TIK",
] as const;

/** Skor 1–4 untuk satu unsur. */
const SkorUnsur = z
  .number({ error: "Nilai harus berupa angka" })
  .int("Nilai harus bilangan bulat")
  .min(1, "Nilai minimal 1")
  .max(4, "Nilai maksimal 4");

export const ServiceSurveyInputSchema = z.object({
  layanan: z
    .string()
    .trim()
    .min(3, "Pilih layanan yang dinilai")
    .max(120, "Nama layanan terlalu panjang"),
  u1: SkorUnsur,
  u2: SkorUnsur,
  u3: SkorUnsur,
  u4: SkorUnsur,
  u5: SkorUnsur,
  u6: SkorUnsur,
  u7: SkorUnsur,
  u8: SkorUnsur,
  u9: SkorUnsur,
  saran: z.string().trim().max(1000, "Saran maksimal 1000 karakter").optional().or(z.literal("")),
  nama: z.string().trim().max(120).optional().or(z.literal("")),
  kontak: z
    .string()
    .trim()
    .max(120, "Kontak maksimal 120 karakter")
    .optional()
    .or(z.literal("")),
});

export type ServiceSurveyInput = z.infer<typeof ServiceSurveyInputSchema>;

/** Hitung nilai IKM (0–100) dari sembilan skor unsur. */
export function hitungIkm(skor: number[]): number {
  if (skor.length === 0) return 0;
  const total = skor.reduce((a, b) => a + b, 0);
  const nrr = total / skor.length; // rata-rata 1–4
  // (NRR / 4) × 100  ≡  NRR × 25
  return Math.round(nrr * 25 * 100) / 100;
}

/** Tentukan mutu pelayanan (A/B/C/D) dari nilai IKM. */
export function mutuPelayanan(ikm: number): "A" | "B" | "C" | "D" {
  if (ikm >= 88.31) return "A";
  if (ikm >= 76.61) return "B";
  if (ikm >= 65) return "C";
  return "D";
}

/** Label panjang mutu pelayanan. */
export function labelMutu(mutu: string): string {
  switch (mutu) {
    case "A":
      return "Sangat Baik";
    case "B":
      return "Baik";
    case "C":
      return "Kurang Baik";
    default:
      return "Tidak Baik";
  }
}

/**
 * ============================================================================
 *  Reservasi Layanan (ServiceReservation)
 * ============================================================================
 *  Permohonan kunjungan/studi tiru, publikasi, penggunaan aula, narasumber,
 *  dan peminjaman peralatan. Setiap permohonan menerima kode lacak singkat.
 */

/** Jenis layanan yang bisa direservasi. */
export const LAYANAN_RESERVASI = [
  "Kunjungan / Studi Tiru",
  "Permohonan Publikasi & Dokumentasi",
  "Penggunaan Aula / Ruang Rapat",
  "Permohonan Narasumber / Pemateri",
  "Peminjaman Peralatan Multimedia",
] as const;

/** Status alur permohonan reservasi. */
export const STATUS_RESERVASI = ["MENUNGGU", "DISETUJUI", "DITOLAK", "SELESAI"] as const;
export type StatusReservasi = (typeof STATUS_RESERVASI)[number];

/** Label bahasa Indonesia untuk tiap status. */
export const LABEL_STATUS_RESERVASI: Record<StatusReservasi, string> = {
  MENUNGGU: "Menunggu Verifikasi",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  SELESAI: "Selesai",
};

/** Format tanggal & jam. */
const TANGGAL_RE = /^\d{4}-\d{2}-\d{2}$/;
const JAM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const ServiceReservationInputSchema = z
  .object({
    nama: z.string().trim().min(2, "Nama minimal 2 karakter").max(120),
    instansi: z.string().trim().max(160).optional().or(z.literal("")),
    email: z.string().trim().toLowerCase().email("Email tidak valid"),
    telepon: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s()]{7,20}$/, "Nomor telepon tidak valid"),
    layanan: z.enum(LAYANAN_RESERVASI, { error: "Pilih jenis layanan" }),
    /** Tanggal kegiatan dalam format YYYY-MM-DD (waktu lokal). */
    tanggal: z
      .string()
      .trim()
      .regex(TANGGAL_RE, "Format tanggal harus YYYY-MM-DD")
      .refine((s) => {
        const d = new Date(`${s}T00:00:00`);
        return !Number.isNaN(d.getTime());
      }, "Tanggal tidak valid"),
    waktuMulai: z.string().trim().regex(JAM_RE, "Format jam harus HH:MM"),
    waktuSelesai: z
      .string()
      .trim()
      .regex(JAM_RE, "Format jam harus HH:MM")
      .optional()
      .or(z.literal("")),
    jumlahPeserta: z
      .number({ error: "Jumlah peserta harus berupa angka" })
      .int("Jumlah peserta harus bilangan bulat")
      .min(1, "Minimal 1 peserta")
      .max(2000, "Maksimal 2000 peserta"),
    keperluan: z
      .string()
      .trim()
      .min(10, "Uraian keperluan minimal 10 karakter")
      .max(1000, "Uraian keperluan maksimal 1000 karakter"),
  })
  .refine(
    (d) => !d.waktuSelesai || d.waktuSelesai > d.waktuMulai,
    { error: "Jam selesai harus setelah jam mulai", path: ["waktuSelesai"] },
  );

export type ServiceReservationInput = z.infer<typeof ServiceReservationInputSchema>;

/** Kode lacak singkat, tanpa karakter yang mudah tertukar (0/O, 1/I/L). */
export function buatKodeReservasi(): string {
  const alfabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let kode = "";
  for (let i = 0; i < 6; i += 1) {
    kode += alfabet[Math.floor(Math.random() * alfabet.length)];
  }
  return `RSV-${kode}`;
}

/** Validasi input admin saat mengubah status permohonan. */
export const UpdateReservasiStatusSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(STATUS_RESERVASI, { error: "Status tidak dikenal" }),
  catatanAdmin: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type UpdateReservasiStatusInput = z.infer<typeof UpdateReservasiStatusSchema>;
