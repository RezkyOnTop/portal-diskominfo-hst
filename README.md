# Portal Diskominfo SP HST

> Portal resmi **Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Hulu Sungai Tengah** — satu pintu untuk informasi publik, layanan digital, data terbuka, dan kanal pengaduan masyarakat.

Rebuild modern dari situs `diskominfosp.hstkab.go.id`: cepat, aksesibel (WCAG AA), responsif, dan mendukung mode terang/gelap. Konten berita & pengumuman tetap bersumber dari **Media Center HST** (tanpa menduplikasi data), sementara data operasional portal disimpan di basis data lokal. Area publik dan dashboard admin punya kerangka tampilan yang terpisah: pengunjung tidak pernah mengunduh kode sidebar, dan pengelola tidak pernah melihat navbar publik.

<p align="left">
  <img src="https://img.shields.io/badge/status-aktif-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/lisensi-MIT-blue" alt="Lisensi MIT">
  <img src="https://img.shields.io/badge/tests-441%20lulus-success" alt="Tes">
  <img src="https://img.shields.io/badge/coverage-93.88%25-brightgreen" alt="Coverage">
  <img src="https://img.shields.io/badge/CI-pnpm%20hijau-2ea44f?logo=githubactions&logoColor=white" alt="CI">
  <img src="https://img.shields.io/badge/Node.js-22.19%2B-5FA04E?logo=nodedotjs&logoColor=white" alt="Node.js">
</p>

---

## 📸 Tangkapan Layar

<p align="center">
  <img src="docs/screenshots/beranda.webp" alt="Beranda Portal Diskominfo SP HST — tampilan penuh mode gelap" width="100%">
</p>

<sub align="center">Tampilan penuh beranda dalam mode gelap — hero, sorotan berita, profil dinas, statistik, layanan, pengumuman, kontak, hingga footer.</sub>

> **Demo langsung:** `http://43.156.250.212:3010` *(lingkungan pratinjau; alamat produksi mengikuti domain resmi instansi)*

---

## ✨ Fitur Utama

- **📰 Berita, Pengumuman & Klarifikasi Hoaks** — bersumber langsung dari API Media Center HST, dilengkapi cache *stale-while-revalidate* dan deduplikasi permintaan agar halaman berpindah seketika.
- **🔍 Pencarian Global** (`/cari`) — menelusuri berita, pengumuman, dan halaman statis sekaligus dengan pencocokan berbasis token.
- **📊 Data Terbuka** (`/data-terbuka`) — katalog **301 dataset** dari portal Open Data HST (angka diverifikasi dari `metadata.total` API): pencarian, filter kategori & tahun, serta paginasi.
- **📝 Survei Kepuasan Layanan** (`/survei`) — menghitung **Indeks Kepuasan Masyarakat (IKM)** atas 9 unsur sesuai **PermenPANRB 14/2017**; nilai IKM dan mutu (A/B/C/D) dihitung di sisi server.
- **📅 Reservasi Layanan** (`/reservasi`) — permohonan kunjungan, studi tiru, publikasi, penggunaan aula, narasumber, dan peminjaman multimedia. Setiap permohonan memperoleh **kode lacak** (`RSV-XXXXXX`) yang dapat dipantau di `/reservasi/status`.
- **📣 Pengaduan & Aspirasi** (`/kontak`) — kanal pengaduan tanpa perlu akun, dengan kode lacak `PGD-XXXXXX` dan pemantauan status secara transparan.
- **🌤️ Widget Cuaca Interaktif** — prakiraan resmi **BMKG** (kondisi saat ini + 3 hari) langsung di beranda.
- **📻 Radio Swara Murakata** — pemutar audio persisten yang tidak terputus saat berpindah halaman, plus formulir langganan.
- **🤖 Asisten AI "Tanya AI"** — widget tanya-jawab seputar layanan dinas, ditenagai **Groq**. Kunci API hanya tersimpan di server (proxy backend), dilengkapi sanitasi input/output, pembatasan 10 permintaan/menit per IP, serta system prompt ketat anti *prompt injection*.
- **🌓 Mode Terang/Gelap** — persisten tanpa kedip (*no flash*), kontras teks terjamin ≥ 4.5:1 di kedua mode. Tersedia di situs publik **dan** di dashboard admin.
- **📈 Analitik Kunjungan** — pencatatan kunjungan halaman publik secara anonim (sekali per perubahan halaman, area admin dikecualikan).
- **🎬 Animasi Loading Modern** — preloader khas DISKOMINFOSP + bilah progres navigasi yang halus dan menghormati `prefers-reduced-motion`.

---

## 🔐 Dashboard Admin

Masuk lewat `/masuk`. Semua rute `/dashboard/*` dijaga dua lapis: `proxy.ts` menolak permintaan tanpa cookie sesi (pengalihan `307` dengan `callbackUrl` yang mempertahankan query, atau `401` JSON untuk `/api/admin/*`), lalu layout admin memverifikasi sesi lewat `auth()`.

| Halaman | Isi |
|---|---|
| `/dashboard` | Ringkasan: total kunjungan, kunjungan hari ini, subscriber, reservasi menunggu, pengaduan baru, jawaban IKM, IKM & mutu, halaman terpopuler, aksi cepat, ekspor CSV |
| `/dashboard/statistik` | Statistik kunjungan per hari dan halaman |
| `/dashboard/subscriber` | Pendaftar Radio Swara Murakata |
| `/dashboard/reservasi` | Verifikasi/penolakan permohonan layanan |
| `/dashboard/pengaduan` | Tanggapan pengaduan & aspirasi |
| `/dashboard/hero` | Slideshow hero beranda |
| `/dashboard/pegawai` | Data & foto pegawai |
| `/dashboard/survei` | Rekap jawaban survei IKM |
| `/dashboard/pengguna` | **Kelola User** — tambah akun, ubah peran, ganti password, aktif/nonaktif (khusus Administrator) |
| `/dashboard/audit` | **Jejak Audit** — catatan aktivitas admin/editor, filter aksi/pelaku/kata kunci + paginasi (khusus Administrator) |

**Peran.** `ADMIN` melihat seluruh menu; `EDITOR` mengelola konten tetapi menu Kelola User dan Jejak Audit tidak pernah dikirim ke perambannya (disaring di server, bukan disembunyikan lewat CSS).

**Jejak audit.** Setiap aksi sensitif dicatat best-effort ke tabel `AuditLog`: masuk/keluar, login gagal, unggah/hapus foto, ekspor CSV (termasuk penolakan akses), dan perubahan akun. Nama serta peran pelaku **disalin** ke baris log, sehingga riwayat tetap terbaca setelah akunnya dihapus. Kegagalan mencatat tidak pernah menggagalkan aksi utama.

**Ekspor CSV.** `/api/admin/ekspor?jenis=subscriber|reservasi|survei|pengguna` mengeluarkan CSV siap Excel Indonesia (pemisah `;`, BOM UTF-8); ekspor data pengguna dibatasi untuk Administrator dan ikut tercatat di audit.

**Tampilan.** Dashboard memakai sistem token sendiri (`app/(admin)/tokens.css`, prefix `--adm-*`) dengan palet tenang dan mode gelap yang lebih kaya, logo yang sama dengan situs publik, sidebar berikon berkelompok, serta tombol ganti tema di header.

---

## 🧰 Tech Stack

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-16.4-000000?logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Zod-4.6-3E67B1?logo=zod&logoColor=white" alt="Zod">
  <img src="https://img.shields.io/badge/Auth.js-v5-000000?logo=auth0&logoColor=white" alt="Auth.js">
  <img src="https://img.shields.io/badge/Vitest-5-6E9F18?logo=vitest&logoColor=white" alt="Vitest">
  <img src="https://img.shields.io/badge/pnpm-9.15-F69220?logo=pnpm&logoColor=white" alt="pnpm">
</p>

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 16.4 (App Router, route group `(public)` / `(admin)`) · React 19.2 |
| Bahasa | TypeScript 5.9 (strict) |
| Styling | Tailwind CSS v4 · lucide-react |
| Basis data | PostgreSQL 16 · Prisma 6.19 (9 migrasi) |
| Validasi | Zod v4 |
| Autentikasi | Auth.js (NextAuth v5) · bcryptjs (cost 12) |
| Pengujian | Vitest 5 · Testing Library — 441 tes di 52 berkas |
| HTTP klien | undici `request()` (butuh Node ≥ 22.19) |
| AI | Groq (OpenAI-compatible API) |
| Gambar | sharp · undici |

---

## 📁 Struktur Direktori

```
app/
├── layout.tsx                 # Kerangka dokumen saja: html/body, font, ThemeProvider
├── (public)/                  # Chrome publik (navbar, footer, radio, preloader) + halaman
│   ├── layout.tsx
│   ├── page.tsx               # Beranda
│   ├── berita/ · pengumuman/ · hoaks/
│   ├── profil/                # sejarah, visi-misi, tugas-fungsi, data-pegawai, maklumat
│   ├── layanan/ · data-terbuka/ · cari/ · radio/
│   ├── survei/ · reservasi/ (status) · kontak/
├── (admin)/
│   ├── layout.tsx             # Header + sidebar admin (guard auth), tanpa chrome publik
│   ├── tokens.css             # Token tampilan dashboard (--adm-*): terang & gelap
│   ├── admin.css              # focus-visible, :active, reduced-motion, seleksi teks
│   └── dashboard/             # ringkasan, statistik, subscriber, reservasi, pengaduan,
│                              # hero, pegawai, survei, pengguna, audit
├── masuk/                     # Halaman login (tanpa chrome publik)
├── api/                       # 15 route handler: auth, cari, chat, cuaca, gambar,
│                              # visitor, subscriber, survei, reservasi, pengaduan,
│                              # admin/ekspor, foto pegawai & hero
└── globals.css                # Sistem tampilan situs publik

components/
├── admin/                     # Kit dashboard: ui.tsx, AdminSidebarNav, AdminThemeToggle
├── layout/                    # Navbar, Footer, ThemeProvider, ThemeToggle, preloader
├── analytics/ · chat/ · cuaca/ · news/ · pengaduan/ · reservasi/ · search/ · survei/ · ui/

lib/
├── api/                       # ADAPTER — satu-satunya pemanggil API eksternal:
│                              # media-center, opendata, bmkg, youtube, gambar, ai-chat
├── services/                  # Logika data lokal + audit.ts (jejak audit)
├── actions/                   # Server Actions (langganan radio, survei)
├── validations/               # Skema Zod (+ rumus IKM & reservasi)
├── storage/                   # Penyimpanan berkas (foto pegawai, hero)
├── types/ · utils/            # Tipe bersama, sanitasi HTML, format, CSV, markdown
└── auth.ts · rate-limit.ts    # Konfigurasi Auth.js + pembatas laju berlapis

proxy.ts                       # Penjaga rute (pengganti middleware.ts di Next 16)
prisma/                        # schema.prisma + 9 migrasi
scripts/                       # setup-lokal, setup-admin, seed-pegawai, seed-user
docs/                          # SETUP.md, SECURITY.md, screenshots/
.github/workflows/ci.yml       # CI: pnpm install → prisma generate → lint → typecheck → test → build
```

---

## 🚀 Cara Instalasi & Menjalankan

### Prasyarat

- **Node.js ≥ 22.19** (wajib — `undici@8` yang dipakai adapter gambar menolak versi lebih lama) dan **pnpm 9**
- **PostgreSQL ≥ 14** *(opsional: portal tetap jalan tanpanya, fitur berbasis basis data menampilkan fallback yang ramah, bukan error)*
- Git

### 1. Clone repositori

```bash
git clone https://github.com/RezkyOnTop/portal-diskominfo-hst.git
cd portal-diskominfo-hst
```

### 2. Pasang dependensi

```bash
corepack enable          # sekali saja, mengaktifkan pnpm
pnpm install --frozen-lockfile
```

> Repositori ini hanya memakai **satu lockfile**: `pnpm-lock.yaml`. `package-lock.json` dihapus dan diabaikan Git — CI akan gagal bila keduanya hidup berdampingan.

### 3. Siapkan variabel lingkungan

```bash
cp .env.example .env.local
node scripts/setup-lokal.mjs     # membuat .env.local + AUTH_SECRET otomatis
```

Variabel yang dibaca kode:

| Variabel | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | opsional | Koneksi PostgreSQL, mis. `postgresql://user:***@localhost:5432/diskominfosp_hst` |
| `AUTH_SECRET` | ya (admin) | Kunci sesi Auth.js; dibuat otomatis oleh `setup-lokal.mjs` (`NEXTAUTH_SECRET` masih diterima sebagai cadangan) |
| `NEXTAUTH_URL` / `AUTH_URL` | ya | URL publik aplikasi, mis. `http://localhost:3010` atau `https://domain-instansi.go.id`. **Harus sama dengan alamat yang diketik di browser.** |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` | ya (admin) | Akun administrator utama; dibuat oleh `setup-admin.mjs`. Menjadi cadangan bila tabel `User` kosong |
| `MEDIA_CENTER_API_BASE_URL` | ya | `https://mediacenter.hstkab.go.id` |
| `MEDIA_CENTER_IMAGE_BASE_URL` | ya | `https://data-mediacenter.hstkab.go.id` (host gambar berbeda dari host API) |
| `OPENDATA_API_BASE_URL` | ya | `https://opendata.hstkab.go.id` |
| `RADIO_STREAM_URL` | opsional | URL stream Radio Swara Murakata |
| `BMKG_ADM4` / `BMKG_API_BASE_URL` | opsional | Kode wilayah BMKG (default `63.07.06.1001`) |
| `GROQ_API_KEY` / `GROQ_MODEL` | opsional | Mengaktifkan widget "Tanya AI" |
| `TRUSTED_PROXY_HOPS` | opsional | Jumlah hop reverse proxy di depan aplikasi (biasanya `1`); menentukan akurasi pembatas laju per-IP |

> ⚠️ **Jangan pernah meng-commit `.env.local`.** Berkas `.env*` diabaikan Git kecuali `.env.example` (hanya placeholder).

### 4. Siapkan basis data *(bila memakai PostgreSQL)*

```bash
# Buat role & database (sekali saja)
sudo -u postgres psql -c "CREATE ROLE diskominfosp LOGIN PASSWORD 'GANTI_PASSWORD';"
sudo -u postgres createdb -O diskominfosp diskominfosp_hst

# Terapkan skema (9 migrasi)
pnpm exec prisma generate
pnpm exec prisma migrate deploy
```

### 5. Jalankan aplikasi

```bash
# Mode pengembangan
pnpm dev

# Mode produksi
pnpm build
PORT=3010 pnpm start
```

Buka **http://localhost:3010**.

> Di mesin dengan RAM kecil (≤ 2 GB), build bisa kehabisan memori. Pakai `NODE_OPTIONS=--max-old-space-size=1400 pnpm build`.

### Perintah lain

| Perintah | Fungsi |
|---|---|
| `pnpm lint` | Pemeriksaan ESLint |
| `pnpm typecheck` | Pemeriksaan tipe (`next typegen && tsc --noEmit`) |
| `pnpm test` | Menjalankan seluruh tes (441 tes / 52 berkas) |
| `pnpm test:coverage` | Tes + laporan cakupan (ambang 80% baris/fungsi/cabang/pernyataan) |
| `pnpm build` | Build produksi |
| `pnpm prisma:migrate` | Migrasi basis data saat pengembangan |
| `pnpm seed:pegawai` | Mengisi data pegawai |
| `pnpm seed:user` | Membuat akun dashboard contoh |

### Mengaktifkan dashboard admin

```bash
node scripts/setup-admin.mjs
# Masukkan email & password saat diminta, lalu restart server
```

Skrip menulis `ADMIN_EMAIL` dan `ADMIN_PASSWORD_HASH` (bcrypt) ke `.env.local` bermode `600`. Password tidak pernah masuk repositori. Setelah masuk, akun tambahan dibuat lewat menu **Kelola User**.

---

## 💡 Cara Penggunaan

**Menelusuri berita**

```
Buka /berita → pilih kategori → klik judul untuk membaca detail di /berita/[slug]
```

**Mengajukan reservasi layanan**

```
Buka /reservasi → isi formulir → kirim → simpan kode lacak (RSV-XXXXXX)
Pantau statusnya kapan saja di /reservasi/status
```

**Mengirim pengaduan**

```
Buka /kontak → isi formulir pengaduan → simpan kode lacak (PGD-XXXXXX)
```

**Mengisi survei kepuasan**

```
Buka /survei → nilai 9 unsur layanan → kirim → nilai IKM & mutu dihitung otomatis
```

**Masuk sebagai administrator**

```
Buka /masuk → masukkan username & password → dashboard di /dashboard
Menu yang tampil mengikuti peran: Administrator melihat seluruh menu, Editor hanya konten.
```

**Mengelola akun dashboard**

```
Administrator → /dashboard/pengguna → tambah akun, ubah peran (ADMIN/EDITOR),
ganti password, aktif/nonaktif, atau hapus.
```

**Memeriksa aktivitas pengelola**

```
Administrator → /dashboard/audit → filter berdasarkan aksi, pelaku, atau kata kunci
Contoh: aksi=MASUK_GAGAL untuk melihat percobaan login yang gagal.
```

**Mengganti mode terang/gelap**

```
Klik ikon bulan/matahari di header dashboard (atau di navbar publik).
Pilihan disimpan di localStorage dan dipasang sebelum halaman dilukis, jadi tidak ada kedip.
```

**Mengekspor data**

```
/dashboard → Ekspor CSV, atau langsung:
/api/admin/ekspor?jenis=subscriber | reservasi | survei | pengguna
```

**Menambah adapter API baru**

```ts
// lib/api/media-center.ts — SATU-SATUNYA berkas yang boleh memanggil domain Media Center.
// UI tidak pernah memanggil API eksternal secara langsung.
// Setiap respons divalidasi dengan Zod, dibungkus try/catch, dan
// tidak pernah mengembalikan pesan error mentah dari server upstream.
```

---

## 🛡️ Keamanan

- **Pembatas laju berlapis** — login dibatasi 15 permintaan/menit per IP dan 8/menit per akun; setiap fitur punya ember global sebagai jaring pengaman bila `X-Forwarded-For` dipalsukan.
- **Penjaga rute** — `proxy.ts` menolak `/dashboard/*` tanpa cookie sesi (`307` + `callbackUrl`) dan `/api/admin/*` tanpa sesi (`401` JSON); layout admin memverifikasi ulang lewat `auth()`.
- **Jejak audit** — aksi sensitif dicatat best-effort; password, token, dan isi berkas **tidak pernah** masuk log.
- **Sanitasi** — seluruh HTML dari API eksternal dibersihkan sebelum dirender; masukan formulir divalidasi Zod di server.
- **Pembatasan per fitur** — tiap endpoint punya kuota sendiri per IP (chat 10/menit, survei 3, pengaduan & reservasi & subscriber 5, cari & cuaca 30, gambar 120, visitor 60).

Rincian lengkap, termasuk sisa risiko yang belum ditutup (HTTPS/`Secure` cookie, CSP, `TRUSTED_PROXY_HOPS`), ada di **[docs/SECURITY.md](docs/SECURITY.md)**.

---

## 🤝 Kontribusi

Kontribusi, laporan bug, dan usulan fitur sangat dihargai.

1. **Fork** repositori ini.
2. Buat cabang fitur: `git checkout -b fitur/nama-fitur`.
3. Tulis kode beserta tesnya, lalu pastikan seluruh pemeriksaan lulus:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build
   ```
4. Commit dengan pesan yang jelas: `git commit -m "feat: menambahkan ..."`.
5. Push dan buka **Pull Request**.

**Standar proyek:** TypeScript ketat · cakupan tes ≥ 80% (baris, fungsi, cabang, pernyataan) · aksesibilitas WCAG AA (kontras ≥ 4.5:1) · seluruh respons API eksternal divalidasi Zod · berkas `.env*` tidak boleh di-commit.

**CI** (`.github/workflows/ci.yml`) menjalankan urutan yang sama dengan `pnpm`: `install --frozen-lockfile` → `prisma generate` → `lint` → `typecheck` → `test:coverage` → `build`. Push berturut-turut pada cabang yang sama otomatis membatalkan run sebelumnya.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah **MIT License** — lihat berkas [LICENSE](LICENSE) untuk keterangan lengkap.

---

## 🏛️ Informasi Proyek

| | |
|---|---|
| **Nama Proyek** | Portal Diskominfo SP HST |
| **Instansi** | Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Hulu Sungai Tengah |
| **Deskripsi** | Portal resmi satu pintu untuk informasi publik, layanan digital, data terbuka, dan pengaduan masyarakat |
| **Alamat** | Jl. Perintis Kemerdekaan, Benawa Tengah, Kec. Barabai, Kab. Hulu Sungai Tengah, Kalimantan Selatan 71314 |
| **Email** | diskominfosp@hstkab.go.id |
| **Telepon / WhatsApp** | 0851-7957-7447 |
| **Jam Layanan** | Senin–Jumat, 08.00–16.00 WITA |
| **Situs Resmi** | https://diskominfosp.hstkab.go.id |

**Sumber data eksternal**

| Data | Sumber | API Key |
|---|---|---|
| Berita & Pengumuman | Media Center HST | — |
| Data Terbuka (301 dataset) | Open Data HST | — |
| Cuaca | BMKG | — |
| Video | YouTube (RSS) | — |
| Asisten AI | Groq | ✅ |

<sub>Dokumentasi penyiapan lengkap ada di [docs/SETUP.md](docs/SETUP.md); catatan keamanan di [docs/SECURITY.md](docs/SECURITY.md).</sub>
