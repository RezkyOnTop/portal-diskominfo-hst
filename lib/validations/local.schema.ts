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

/**
 * ============================================================================
 *  Pengaduan & Aspirasi masyarakat
 * ============================================================================
 *  Warga mengirim lewat form di /kontak (tanpa perlu akun/email aktif) dan
 *  menerima kode lacak untuk memantau status + tanggapan petugas.
 */

/** Kategori pengaduan/aspirasi. */
export const KATEGORI_PENGADUAN = [
  "Layanan Publik & Perizinan",
  "Infrastruktur & Jaringan Internet",
  "Konten & Informasi Publik",
  "Saran / Aspirasi",
  "Lainnya",
] as const;

/** Status alur pengaduan. */
export const STATUS_PENGADUAN = ["BARU", "DIPROSES", "SELESAI"] as const;
export type StatusPengaduan = (typeof STATUS_PENGADUAN)[number];

/** Label bahasa Indonesia untuk tiap status pengaduan. */
export const LABEL_STATUS_PENGADUAN: Record<StatusPengaduan, string> = {
  BARU: "Baru",
  DIPROSES: "Sedang Diproses",
  SELESAI: "Selesai",
};

export const PengaduanInputSchema = z.object({
  nama: z.string().trim().min(2, "Nama minimal 2 karakter").max(120, "Nama maksimal 120 karakter"),
  kontak: z
    .string()
    .trim()
    .min(5, "Kontak minimal 5 karakter")
    .max(160, "Kontak maksimal 160 karakter"),
  kategori: z.enum(KATEGORI_PENGADUAN, { error: "Pilih kategori pengaduan" }),
  isi: z
    .string()
    .trim()
    .min(15, "Uraian minimal 15 karakter")
    .max(2000, "Uraian maksimal 2000 karakter"),
});

export type PengaduanInput = z.infer<typeof PengaduanInputSchema>;

/** Validasi input admin saat menanggapi pengaduan. */
export const TanggapiPengaduanSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(STATUS_PENGADUAN, { error: "Status tidak dikenal" }),
  tanggapan: z.string().trim().max(2000, "Tanggapan maksimal 2000 karakter").optional().or(z.literal("")),
});

export type TanggapiPengaduanInput = z.infer<typeof TanggapiPengaduanSchema>;

/** Kode lacak pengaduan, tanpa karakter yang mudah tertukar (0/O, 1/I/L). */
export function buatKodePengaduan(): string {
  const alfabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let kode = "";
  for (let i = 0; i < 6; i += 1) {
    kode += alfabet[Math.floor(Math.random() * alfabet.length)];
  }
  return `PGD-${kode}`;
}

/**
 * ============================================================================
 *  Data Pegawai (Staff)
 * ============================================================================
 *  Dikelola admin lewat /dashboard/pegawai, tampil publik di /profil/data-pegawai.
 *  Kolom yang dikelola: nama, NIP (opsional), jabatan, unit, foto, urutan, aktif.
 *  Unit mengikuti pengelompokan halaman resmi situs lama ("Data Pegawai").
 */

/** Unit kerja / kelompok pegawai. */
export const UNIT_PEGAWAI = [
  "Kepala Dinas",
  "Sekretaris",
  "Kepala Bidang & Sub Bagian",
  "Staf PNS",
  "Staf PPPK",
  "Tenaga Outsourcing",
] as const;
export type UnitPegawai = (typeof UNIT_PEGAWAI)[number];

/** Label singkat untuk kartu/filter publik. */
export const LABEL_UNIT_PEGAWAI: Record<UnitPegawai, string> = {
  "Kepala Dinas": "Pimpinan",
  Sekretaris: "Sekretariat",
  "Kepala Bidang & Sub Bagian": "Kabid & Kasubbag",
  "Staf PNS": "PNS",
  "Staf PPPK": "PPPK",
  "Tenaga Outsourcing": "Outsourcing",
};

const NamaPegawai = z.string().trim().min(2, "Nama minimal 2 karakter").max(160, "Nama maksimal 160 karakter");
const JabatanPegawai = z.string().trim().min(2, "Jabatan minimal 2 karakter").max(160, "Jabatan maksimal 160 karakter");
const NipPegawai = z
  .string()
  .trim()
  .max(40, "NIP maksimal 40 karakter")
  .optional()
  .or(z.literal(""));

/** Validasi input admin saat menambah pegawai baru. */
export const CreateStaffInputSchema = z.object({
  nama: NamaPegawai,
  nip: NipPegawai,
  jabatan: JabatanPegawai,
  unit: z.enum(UNIT_PEGAWAI, { error: "Pilih unit kerja" }),
  urutan: z
    .number({ error: "Urutan tampil harus berupa angka" })
    .int("Urutan tampil harus bilangan bulat")
    .min(0, "Urutan tampil minimal 0")
    .max(9999, "Urutan tampil maksimal 9999"),
});

export type CreateStaffInput = z.infer<typeof CreateStaffInputSchema>;

/** Validasi input admin saat mengubah data pegawai. */
export const UpdateStaffInputSchema = z.object({
  id: z.string().trim().min(1),
  nama: NamaPegawai,
  nip: NipPegawai,
  jabatan: JabatanPegawai,
  unit: z.enum(UNIT_PEGAWAI, { error: "Pilih unit kerja" }),
  urutan: z
    .number({ error: "Urutan tampil harus berupa angka" })
    .int("Urutan tampil harus bilangan bulat")
    .min(0, "Urutan tampil minimal 0")
    .max(9999, "Urutan tampil maksimal 9999"),
  aktif: z.boolean({ error: "Status aktif harus benar/salah" }),
});

export type UpdateStaffInput = z.infer<typeof UpdateStaffInputSchema>;

/** Validasi input admin saat menghapus pegawai (konfirmasi via id). */
export const DeleteStaffInputSchema = z.object({
  id: z.string().trim().min(1),
});

export type DeleteStaffInput = z.infer<typeof DeleteStaffInputSchema>;

/** Batas ukuran berkas foto pegawai (2 MB) dan tipe yang diizinkan. */
export const FOTO_PEGAWAI_MAX_BYTES = 2 * 1024 * 1024;
export const FOTO_PEGAWAI_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

/**
 * ============================================================================
 *  Slide Hero Beranda (HeroSlide)
 * ============================================================================
 *  Dikelola admin lewat /dashboard/hero, tampil publik di slideshow Hero.
 *  Foto slide umumnya lanskap — batas 4 MB (lebih longgar dari foto pegawai).
 */

/** Batas ukuran berkas foto slide hero (4 MB) dan tipe yang diizinkan. */
export const FOTO_HERO_MAX_BYTES = 4 * 1024 * 1024;
export const FOTO_HERO_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

const LabelSlideHero = z.string().trim().min(3, "Keterangan minimal 3 karakter").max(160, "Keterangan maksimal 160 karakter");
const UrutanSlideHero = z
  .number({ error: "Urutan tampil harus berupa angka" })
  .int("Urutan tampil harus bilangan bulat")
  .min(0, "Urutan tampil minimal 0")
  .max(9999, "Urutan tampil maksimal 9999");

/** Validasi input admin saat menambah slide hero baru. */
export const CreateHeroSlideInputSchema = z.object({
  label: LabelSlideHero,
  urutan: UrutanSlideHero,
});

export type CreateHeroSlideInput = z.infer<typeof CreateHeroSlideInputSchema>;

/** Validasi input admin saat mengubah slide hero. */
export const UpdateHeroSlideInputSchema = z.object({
  id: z.string().trim().min(1),
  label: LabelSlideHero,
  urutan: UrutanSlideHero,
  aktif: z.boolean({ error: "Status aktif harus benar/salah" }),
});

export type UpdateHeroSlideInput = z.infer<typeof UpdateHeroSlideInputSchema>;

/** Validasi input admin saat menghapus slide hero (konfirmasi via id). */
export const DeleteHeroSlideInputSchema = z.object({
  id: z.string().trim().min(1),
});

export type DeleteHeroSlideInput = z.infer<typeof DeleteHeroSlideInputSchema>;

/**
 * ============================================================================
 *  Akun Pengguna Dashboard (User) — "Kelola User"
 * ============================================================================
 *  Dikelola admin lewat /dashboard/pengguna. Mendukung tambah akun, ubah
 *  nama/email/peran, ganti password, aktif/nonaktif, dan hapus.
 *
 *  Peran:
 *    ADMIN  — akses penuh, termasuk kelola user.
 *    EDITOR — kelola konten (pegawai, hero, pengaduan, reservasi, survei)
 *             tanpa bisa membuka menu Kelola User.
 *
 *  Catatan keamanan: password TIDAK pernah disimpan polos; service menyimpan
 *  hash bcrypt (cost 12). Panjang minimal dibuat longgar (3) supaya akun uji
 *  seperti "admin / 123" tetap bisa dibuat — UI menandai password lemah.
 */

/** Peran akun pengguna dashboard. */
export const USER_ROLE = ["ADMIN", "EDITOR"] as const;
export type UserRole = (typeof USER_ROLE)[number];

/** Label bahasa Indonesia untuk tiap peran. */
export const LABEL_USER_ROLE: Record<UserRole, string> = {
  ADMIN: "Administrator",
  EDITOR: "Editor",
};

/** Deskripsi singkat peran (ditampilkan sebagai bantuan di form). */
export const DESC_USER_ROLE: Record<UserRole, string> = {
  ADMIN: "Akses penuh, termasuk kelola user.",
  EDITOR: "Kelola konten, tanpa akses kelola user.",
};

/** Panjang password minimal yang diterima. */
export const PASSWORD_MIN = 3;

/**
 * Identitas login: boleh email (admin@dinas.go.id) ATAU username singkat
 * (mis. "admin"). Huruf kecil, tanpa spasi. Dipakai sebagai kunci unik akun.
 */
const UsernamePengguna = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username minimal 3 karakter")
  .max(160, "Username maksimal 160 karakter")
  .regex(
    /^[a-z0-9][a-z0-9._@-]*$/,
    "Username hanya boleh huruf, angka, serta . _ @ - (tanpa spasi)",
  );
const NamaPengguna = z
  .string()
  .trim()
  .min(2, "Nama minimal 2 karakter")
  .max(120, "Nama maksimal 120 karakter");
const PasswordPengguna = z
  .string()
  .min(PASSWORD_MIN, `Password minimal ${PASSWORD_MIN} karakter`)
  .max(72, "Password maksimal 72 karakter");

/** Validasi input admin saat menambah akun pengguna baru. */
export const CreateUserInputSchema = z.object({
  nama: NamaPengguna,
  username: UsernamePengguna,
  password: PasswordPengguna,
  role: z.enum(USER_ROLE, { error: "Pilih peran akun" }),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

/** Validasi input admin saat mengubah nama/username/peran akun (tanpa password). */
export const UpdateUserInputSchema = z.object({
  id: z.string().trim().min(1),
  nama: NamaPengguna,
  username: UsernamePengguna,
  role: z.enum(USER_ROLE, { error: "Pilih peran akun" }),
  aktif: z.boolean({ error: "Status aktif harus benar/salah" }),
});

export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

/** Validasi input admin saat mengganti password akun. */
export const ChangePasswordInputSchema = z.object({
  id: z.string().trim().min(1),
  password: PasswordPengguna,
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;

/** Validasi input admin saat menghapus akun (konfirmasi via id). */
export const DeleteUserInputSchema = z.object({
  id: z.string().trim().min(1),
});

export type DeleteUserInput = z.infer<typeof DeleteUserInputSchema>;

/** Heuristik sederhana: tandai password lemah untuk peringatan di UI. */
export function passwordLemah(password: string): boolean {
  return password.length < 8 || /^[0-9]+$/.test(password) || /^(.)\1+$/.test(password);
}
