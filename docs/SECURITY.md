# Catatan Keamanan — Portal Diskominfo SP HST

Hasil audit kode + uji langsung pada server (Node 22.23.4, Next.js 16.4.3),
29 Oktober 2026. Dokumen ini mencatat apa yang sudah diperbaiki dan apa yang
masih terbuka, supaya tidak diaudit ulang dari nol.

## 1. Yang sudah diperbaiki

| # | Temuan | Dampak | Perbaikan |
|---|---|---|---|
| 1 | `undici@8` butuh Node ≥ 22.19, server jalan di Node 20.20.2 | `/api/gambar` **500** untuk semua foto berita (error ditelan `catch` → 502 generik) | server dijalankan dengan Node 22 (`~/.local/node`) |
| 2 | `fetch(url, { dispatcher })` memakai `Agent` dari paket undici proyek | di Node 22 selalu `UND_ERR_INVALID_ARG` → `fetch failed` (bahkan `new Agent()` kosong) karena Node punya salinan undici internal sendiri | `lib/api/gambar.ts` memakai `request()` dari paket undici proyek |
| 3 | `next@16.3.6` — 2 critical + 3 high + 5 moderate (`pnpm audit`) | RCE pra-auth di Image Optimization API, RCE `use cache`, SSRF image optimizer, DoS server actions | `next` + `eslint-config-next` → **16.4.3** (sisa 1 high: `deepmerge-ts` lewat Prisma CLI, hanya alat dev, tidak ikut runtime) |
| 4 | Endpoint login `/api/auth/callback/credentials` tanpa batas | brute force password tak terbatas | `lib/auth.ts` — 15 percobaan/menit per IP + 8/menit per akun sebelum bcrypt dijalankan |
| 5 | Rate limiter hanya per-IP dari `X-Forwarded-For` | header bisa diputar tiap request → batas per-IP tembus | `lib/rate-limit.ts` — ember **global per fitur** (limit × 10, minimal 50) sebagai penjaga; pemalsuan header hanya membagi kuota, tidak menghapusnya |
| 6 | `Map` ember rate limit tidak pernah dibersihkan | kebocoran memori pelan | pembersihan otomatis saat > 5000 ember |

Bukti uji setelah perbaikan:

- `/api/gambar` → `200 image/webp`, 400×500, 20 KB (dari 187 KB JPEG), cache hit 10 ms.
- SSRF: `169.254.169.254`, `http://`, domain asing → **422**.
- Rate limit: 60 request dengan `X-Forwarded-For` berputar → 50 lolos, 10 ditolak **429**.
- Login: percobaan ke-9 dan seterusnya berhenti di ±7 ms (limiter), bukan ±430 ms (bcrypt).
- Login sah tetap berhasil (302 → `/`, `/dashboard` 200).
- `typecheck`, `eslint`, `vitest` (428 tes) hijau; `next build` bersih.

## 2. Yang masih terbuka (butuh keputusan pemilik sistem)

1. **Belum ada HTTPS.** Sesi admin dikirim lewat HTTP polos di `:3010`, cookie
   belum bertanda `Secure` — token bisa disadap di jaringan. Wajib dipasang
   Nginx/Caddy + sertifikat sebelum dipublikasikan.
2. **Belum ada header CSP.** XSS sudah dicegah di level sanitasi HTML, tetapi
   CSP adalah lapisan kedua yang murah.
3. **`TRUSTED_PROXY_HOPS` masih 0.** Batas per-IP baru akurat setelah ada
   reverse proxy; lihat komentar di `.env.example`.
4. **EDITOR dapat mengekspor** pengaduan, subscriber, dan reservasi lewat
   `/api/admin/ekspor` (hanya daftar user yang dibatasi ADMIN). Bila data
   pengadu dianggap sensitif, batasi seluruh ekspor ke ADMIN.
5. **`.admin-kredensial.txt`** masih menyimpan kredensial admin dalam teks biasa
   di disk (mode 600, sudah di-`.gitignore`). Hapus bila sudah tidak diperlukan.
6. **Rate limiter bersifat per-proses.** Bila nanti dijalankan multi-instance,
   pindahkan ke Redis.

## 3. Jejak audit (AuditLog)

Sejak 29 Oktober 2026 dashboard mencatat aktivitas admin/editor ke tabel
`AuditLog` (migrasi `20261029030000_add_audit_log`). Halaman: **`/dashboard/audit`**
(hanya Administrator).

Yang dicatat: masuk & keluar dashboard, percobaan masuk gagal, tambah/ubah/hapus
pegawai dan slide hero, unggah/hapus foto, ubah status pengaduan & reservasi,
kelola akun (tambah/ubah/ganti password/hapus), dan ekspor CSV (termasuk
percobaan ekspor yang ditolak).

Sifat pencatatan:

- **Best-effort** — jika penulisan log gagal, aksi utama tetap berjalan;
  kegagalan hanya muncul di log server (`[audit] gagal mencatat`).
- Nama & peran pelaku **disalin** ke baris log, jadi riwayat tetap terbaca
  walau akunnya kemudian dihapus atau diubah.
- IP diambil dari `X-Forwarded-For` / `X-Real-IP`. Tanpa reverse proxy nilai
  itu dapat dipalsukan klien (lihat bagian 2 nomor 3).
- Event keluar (logout) tidak punya IP karena bukan permintaan HTTP biasa.
- Retensi belum otomatis; baris lama bisa dipangkas manual
  (`DELETE FROM "AuditLog" WHERE "createdAt" < now() - interval '180 days';`).

### 3.1 Pengerasan setelah audit fitur (29 Okt 2026)

Diuji langsung dengan akun ADMIN & EDITOR sementara:

- **XSS**: teks kiriman penyerang (`<script>`, `<img onerror>`) dirender React
  sebagai entitas (`&lt;script&gt;`) — 0 tag mentah di HTML. Aman.
- **Kontrol akses**: EDITOR membuka `/dashboard/audit` hanya mendapat pesan
  penolakan; tabel, nama pelaku, dan detail tidak dikirim sama sekali di HTML.
  Tanpa sesi → 307 ke `/masuk`.
- **SQL injection** lewat `q`/`aktor`/`aksi`: tidak berlaku (Prisma
  berparameter), permintaan tetap 200.
- **Diperbaiki — `halaman` ekstrem** (`999999999999999999999`) membuat Prisma
  melempar `Unable to fit value 5e+22 into a 64-bit integer` → HTTP 500.
  Sekarang dibatasi maksimum 10.000.
- **Diperbaiki — `q` tanpa batas panjang** (5.000 karakter = full-scan
  `contains`). Sekarang dipotong 100 karakter.
- **Diperbaiki — teks ANONIM masuk dropdown "Pelaku"**: baris login gagal
  membawa `actorName` kiriman penyerang, dan dulu ikut tampil sebagai opsi
  filter. Sekarang dropdown hanya memuat pelaku dengan `actorId` nyata.
- **Diperbaiki — karakter kendali** (`\r\n\t`) di `detail`/`actorName` bisa
  memalsukan baris di tabel. Sekarang dibuang dan dirapikan jadi satu spasi.
- **Diperbaiki — banjir log**: 12 percobaan login gagal = 12 baris. Sekarang
  dibatasi 5 baris / 5 menit per IP (diuji: 12 percobaan → 5 baris).

Sisa risiko yang diterima: IP masih bisa dipalsukan tanpa reverse proxy;
pencatatan best-effort bisa bolong bila database sedang gagal; baris audit bisa
dihapus langsung oleh pemilik database (tidak ada trigger append-only).
