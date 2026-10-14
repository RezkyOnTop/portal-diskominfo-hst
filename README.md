# Portal Diskominfo SP HST

> Portal resmi **Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Hulu Sungai Tengah** — satu pintu untuk informasi publik, layanan digital, data terbuka, dan kanal pengaduan masyarakat.

Rebuild modern dari situs `diskominfosp.hstkab.go.id` dengan desain **Digital Civic** yang orisinal: cepat, aksesibel (WCAG AA), responsif, dan mendukung mode terang/gelap. Konten berita & pengumuman tetap bersumber dari **Media Center HST** (tanpa menduplikasi data), sementara data operasional portal disimpan di basis data lokal.

<p align="left">
  <img src="https://img.shields.io/badge/status-aktif-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/lisensi-MIT-blue" alt="Lisensi MIT">
  <img src="https://img.shields.io/badge/tests-398%20lulus-success" alt="Tes">
  <img src="https://img.shields.io/badge/coverage-93.92%25-brightgreen" alt="Coverage">
</p>

---

## 📸 Tangkapan Layar

### Beranda
![Beranda Portal Diskominfo SP HST](docs/screenshots/beranda.png)

### Berita
![Daftar berita dari Media Center HST](docs/screenshots/berita.png)

### Data Terbuka
![Katalog dataset Open Data HST](docs/screenshots/data-terbuka.png)

### Survei Kepuasan Layanan
![Survei Indeks Kepuasan Masyarakat](docs/screenshots/survei.png)

> **Demo langsung:** `http://43.173.8.233:3010` *(lingkungan pratinjau; alamat produksi mengikuti domain resmi instansi)*

---

## ✨ Fitur Utama

- **📰 Berita, Pengumuman & Klarifikasi Hoaks** — bersumber langsung dari API Media Center HST, dilengkapi cache *stale-while-revalidate* dan deduplikasi permintaan agar halaman berpindah seketika.
- **🔍 Pencarian Global** (`/cari`) — menelusuri berita, pengumuman, dan halaman statis sekaligus dengan pencocokan berbasis token.
- **📊 Data Terbuka** (`/data-terbuka`) — katalog 301 dataset dari portal Open Data HST: pencarian, filter kategori & tahun, serta paginasi.
- **📝 Survei Kepuasan Layanan** (`/survei`) — menghitung **Indeks Kepuasan Masyarakat (IKM)** atas 9 unsur sesuai **PermenPANRB 14/2017**; nilai IKM dan mutu (A/B/C/D) dihitung di sisi server.
- **📅 Reservasi Layanan** (`/reservasi`) — permohonan kunjungan, studi tiru, publikasi, penggunaan aula, narasumber, dan peminjaman multimedia. Setiap permohonan memperoleh **kode lacak** (`RSV-XXXXXX`) yang dapat dipantau di `/reservasi/status`.
- **📣 Pengaduan & Aspirasi** (`/kontak`) — kanal pengaduan tanpa perlu akun, dengan kode lacak `PGD-XXXXXX` dan pemantauan status secara transparan.
- **🌤️ Widget Cuaca Interaktif** — prakiraan resmi **BMKG** (kondisi saat ini + 3 hari) langsung di beranda.
- **📻 Radio Swara Murakata** — pemutar audio persisten yang tidak terputus saat berpindah halaman, plus formulir langganan.
- **🤖 Asisten AI "Tanya AI"** — widget tanya-jawab seputar layanan dinas, ditenagai **Groq**. Kunci API hanya tersimpan di server (proxy backend), dilengkapi sanitasi input/output, pembatasan 10 permintaan/menit per IP, serta system prompt ketat anti *prompt injection*.
- **🌓 Mode Terang/Gelap** — persisten tanpa kedip (*no flash*), kontras teks terjamin ≥ 4.5:1 di kedua mode.
- **📈 Analitik Kunjungan** — pencatatan kunjungan halaman publik secara anonim (sekali per perubahan halaman, area admin dikecualikan).
- **🔐 Dashboard Admin** (`/dashboard`, login di `/masuk`) — ringkasan statistik, pengelolaan slideshow hero, data pegawai, pengaduan, reservasi, survei, dan subscriber; **ekspor CSV** siap Excel Indonesia.
- **🎬 Animasi Loading Modern** — preloader khas DISKOMINFOSP + bilah progres navigasi yang halus dan menghormati `prefers-reduced-motion`.

---

## 🧰 Tech Stack

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-16.3-000000?logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Zod-4.6-3E67B1?logo=zod&logoColor=white" alt="Zod">
  <img src="https://img.shields.io/badge/Auth.js-v5-000000?logo=auth0&logoColor=white" alt="Auth.js">
  <img src="https://img.shields.io/badge/Vitest-5.0-6E9F18?logo=vitest&logoColor=white" alt="Vitest">
  <img src="https://img.shields.io/badge/Node.js-22%2B-5FA04E?logo=nodedotjs&logoColor=white" alt="Node.js">
</p>

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 |
| Bahasa | TypeScript 5 |
| Styling | Tailwind CSS v4 · lucide-react |
| Basis data | PostgreSQL 16 · Prisma 6 |
| Validasi | Zod v4 |
| Autentikasi | Auth.js (NextAuth v5) · bcryptjs |
| Pengujian | Vitest 5 · Testing Library |
| AI | Groq (OpenAI-compatible API) |
| Gambar | sharp · undici |

---

## 📁 Struktur Direktori

```
app/
├── (public)/              # Halaman publik: beranda, berita, pengumuman, hoaks,
│                          # radio, cari, data-terbuka, survei, reservasi, kontak, profil, layanan
├── (admin)/dashboard/     # Panel admin: statistik, hero, pegawai, pengaduan,
│                          # reservasi, survei, subscriber (dilindungi Auth.js)
├── masuk/                 # Halaman login administrator
└── api/                   # Route handler: cari, chat, cuaca, gambar, visitor,
                           # subscriber, survei, reservasi, pengaduan, admin/ekspor, auth

components/                # Komponen UI: layout/, news/, search/, survei/,
                           # cuaca/, reservasi/, chat/, pengaduan/, analytics/

lib/
├── api/                   # ADAPTER — satu-satunya pemanggil API eksternal:
│                          # media-center.ts, opendata.ts, bmkg.ts, youtube.ts, gambar.ts, ai-chat.ts
├── services/              # Logika data lokal (visitor, subscriber, survei, reservasi, pengaduan, hero, staff)
├── actions/               # Server Actions (langganan radio, survei)
├── validations/           # Skema Zod (+ rumus IKM & reservasi)
├── storage/               # Penyimpanan berkas (foto pegawai, hero)
├── types/                 # Tipe TypeScript bersama
└── utils/                 # Pembantu: sanitasi HTML, format, CSV, markdown, BMKG

prisma/schema.prisma       # Model: VisitorStat, RadioSubscriber, SocialMediaCache,
                           # ServiceSurvey, ServiceReservation, Staff, Pengaduan, HeroSlide
scripts/                   # setup-lokal.mjs, setup-admin.mjs, seed-pegawai.mjs
docs/                      # SETUP.md, screenshots/
```

---

## 🚀 Cara Instalasi & Menjalankan

### Prasyarat

- **Node.js ≥ 22** (disarankan 22 LTS atau lebih baru) dan **npm ≥ 10**
- **PostgreSQL ≥ 14** *(opsional — portal tetap jalan tanpanya; fitur berbasis basis data akan menampilkan fallback yang ramah, bukan error)*
- Git

### 1. Clone repositori

```bash
git clone https://github.com/RezkyOnTop/portal-diskominfo-hst.git
cd portal-diskominfo-hst
```

### 2. Pasang dependensi

```bash
npm install
```

### 3. Siapkan variabel lingkungan

```bash
cp .env.example .env.local
```

Cara tercepat: jalankan skrip penyiapan otomatis (membuat `.env.local` + kunci sesi).

```bash
node scripts/setup-lokal.mjs
```

Isi variabel yang diperlukan di `.env.local`:

| Variabel | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | opsional | Koneksi PostgreSQL, mis. `postgresql://user:pass@localhost:5432/diskominfosp_hst` |
| `AUTH_SECRET` | ya (admin) | Kunci sesi Auth.js — dibuat otomatis oleh `setup-lokal.mjs` |
| `NEXTAUTH_URL` | ya | URL publik aplikasi, mis. `http://localhost:3010` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` | ya (admin) | Kredensial dashboard — dibuat oleh `setup-admin.mjs` |
| `MEDIA_CENTER_API_BASE_URL` | ya | `https://mediacenter.hstkab.go.id` |
| `MEDIA_CENTER_IMAGE_BASE_URL` | ya | `https://data-mediacenter.hstkab.go.id` |
| `OPENDATA_API_BASE_URL` | ya | `https://opendata.hstkab.go.id` |
| `RADIO_STREAM_URL` | opsional | URL stream Radio Swara Murakata |
| `BMKG_ADM4` | opsional | Kode wilayah BMKG (default `63.07.06.1001`) |
| `GROQ_API_KEY` / `GROQ_MODEL` | opsional | Mengaktifkan widget "Tanya AI" |

> ⚠️ **Jangan pernah meng-commit `.env.local`.** Berkas `.env*` sudah diabaikan Git kecuali `.env.example` (hanya berisi placeholder).

### 4. Siapkan basis data *(bila memakai PostgreSQL)*

```bash
# Buat role & database (sekali saja)
sudo -u postgres psql -c "CREATE ROLE diskominfosp LOGIN PASSWORD 'GANTI_PASSWORD';"
sudo -u postgres createdb -O diskominfosp diskominfosp_hst

# Terapkan skema
npx prisma generate
npx prisma migrate deploy
```

### 5. Jalankan aplikasi

```bash
# Mode pengembangan
npm run dev

# Mode produksi
npm run build
npm run start -- -p 3010
```

Buka **http://localhost:3010**.

### Perintah lain

| Perintah | Fungsi |
|---|---|
| `npm run lint` | Pemeriksaan ESLint |
| `npm run typecheck` | Pemeriksaan tipe (`next typegen && tsc --noEmit`) |
| `npm run test` | Menjalankan seluruh tes |
| `npm run test:coverage` | Tes + laporan cakupan (ambang 80%) |
| `npm run prisma:migrate` | Migrasi basis data saat pengembangan |
| `npm run seed:pegawai` | Mengisi data pegawai |

### Mengaktifkan dashboard admin

```bash
node scripts/setup-admin.mjs
# Masukkan email & password saat diminta, lalu restart server
```

Skrip menulis `ADMIN_EMAIL` dan `ADMIN_PASSWORD_HASH` (bcrypt) ke `.env.local` bermode `600`. Password tidak pernah masuk repositori.

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
Buka /masuk → masukkan email & password admin → kelola konten di /dashboard
```

**Menambah adapter API baru**

```ts
// lib/api/media-center.ts — SATU-SATUNYA berkas yang boleh memanggil domain Media Center.
// UI tidak pernah memanggil API eksternal secara langsung.
// Setiap respons divalidasi dengan Zod, dibungkus try/catch, dan
// tidak pernah mengembalikan pesan error mentah dari server upstream.
```

---

## 🤝 Kontribusi

Kontribusi, laporan bug, dan usulan fitur sangat kami hargai.

1. **Fork** repositori ini.
2. Buat cabang fitur: `git checkout -b fitur/nama-fitur`.
3. Tulis kode beserta tesnya, lalu pastikan seluruh pemeriksaan lulus:
   ```bash
   npm run lint && npm run typecheck && npm run test:coverage && npm run build
   ```
4. Commit dengan pesan yang jelas: `git commit -m "feat: menambahkan ..."`.
5. Push dan buka **Pull Request**.

**Standar proyek:** TypeScript ketat · cakupan tes ≥ 80% untuk `lib/` dan `app/api/` · aksesibilitas WCAG AA (kontras ≥ 4.5:1) · seluruh respons API eksternal divalidasi Zod · berkas `.env*` tidak boleh di-commit.

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
| Data Terbuka | Open Data HST | — |
| Cuaca | BMKG | — |
| Video | YouTube (RSS) | — |
| Asisten AI | Groq | ✅ |

<sub>Dokumentasi penyiapan lengkap tersedia di [docs/SETUP.md](docs/SETUP.md).</sub>
