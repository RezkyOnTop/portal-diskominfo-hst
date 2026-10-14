# Panduan Menjalankan Portal Diskominfo SP HST di Komputer Sendiri

Panduan ini ditulis langkah demi langkah. Tidak perlu latar belakang teknis —
ikuti saja urutannya. Perkiraan waktu: **15–25 menit** (termasuk unduh paket).

---

## 1. Apa yang Anda butuhkan

| Kebutuhan | Keterangan |
|---|---|
| **Node.js versi 20 atau lebih baru** | Untuk menjalankan aplikasinya. Unduh di https://nodejs.org (pilih **LTS**). |
| **PostgreSQL** | Database lokal untuk survei, reservasi, dan statistik. **Opsional** — tanpa ini portal tetap jalan, hanya fitur tersebut yang tidak aktif. |
| **Koneksi internet** | Berita, data terbuka, cuaca, dan video diambil langsung dari sumber resmi (Media Center, Open Data, BMKG, YouTube). |
| **Peramban** | Chrome, Edge, Firefox, atau Safari. |

Cek Node.js sudah terpasang — buka Terminal (macOS/Linux) atau Command Prompt/PowerShell
(Windows), lalu ketik:

```bash
node -v
npm -v
```

Kalau muncul angka versi (mis. `v20.11.0`), berarti sudah siap.

---

## 2. Ekstrak dan masuk ke folder proyek

Ekstrak berkas zip, lalu masuk ke foldernya:

```bash
cd diskominfosp-hst
```

---

## 3. Pasang paket yang dibutuhkan

```bash
npm install
```

Proses ini mengunduh semua pustaka (sekali saja, butuh beberapa menit dan sekitar 800 MB
di dalam folder `node_modules`).

---

## 4. Siapkan berkas pengaturan

Salin contoh berkas pengaturan:

```bash
# macOS / Linux
cp .env.example .env.local

# Windows (Command Prompt)
copy .env.example .env.local

# Windows (PowerShell)
Copy-Item .env.example .env.local
```

Buka `.env.local` dengan editor teks apa pun (Notepad, VS Code), lalu **buat satu kunci
rahasia sesi**. Cara termudah — jalankan perintah ini dan salin hasilnya:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Tempelkan hasilnya ke baris `AUTH_SECRET` di `.env.local`, contoh:

```
AUTH_SECRET="hasil-salinan-tadi"
```

### Kunci chatbot AI (opsional)

Widget combo di pojok kanan bawah punya tab **Asisten AI** (Groq,
OpenAI-compatible — dulu Gemini, diganti karena Gemini memblokir IP
datacenter server ini: "User location is not supported").
Tanpa kunci, tab AI menampilkan pesan "belum diaktifkan" tetapi tab
**Cuaca** tetap jalan normal.

1. Ambil kunci gratis di https://console.groq.com/keys
2. Isi di `.env.local`:

```
GROQ_API_KEY="kunci-anda-di-sini"
GROQ_MODEL="llama-3.3-70b-versatile"
```

3. Restart server (`npm run start`).
4. **Jangan pernah** mengirim kunci lewat chat/email — hanya di file
   `.env.local` (tidak ikut commit/zip).

> **Penting:** biarkan `NEXTAUTH_URL="http://localhost:3000"` apa adanya selama dijalankan
> di komputer sendiri. Nilai ini harus sama dengan alamat yang Anda ketik di peramban.

---

## 5. Siapkan database (opsional tapi disarankan)

Tanpa langkah ini portal tetap bisa dibuka (berita, data terbuka, cuaca, radio tampil
normal). Yang tidak aktif: survei kepuasan, reservasi layanan, cek status, dan statistik
kunjungan.

### 5a. Kalau PostgreSQL sudah terpasang

Buat database dan pengguna:

```bash
sudo -u postgres psql -c "CREATE ROLE diskominfosp LOGIN PASSWORD 'PASSWORD_ANDA';"
sudo -u postgres createdb -O diskominfosp diskominfosp_hst
```

Lalu di `.env.local`, sesuaikan baris `DATABASE_URL`:

```
DATABASE_URL="postgresql://diskominfosp:PASSWORD_ANDA@localhost:5432/diskominfosp_hst"
```

Buat tabel-tabelnya:

```bash
npx prisma generate
npx prisma migrate deploy
```

Lalu isi data pegawai awal (41 nama dari publikasi resmi dinas):

```bash
npm run seed:pegawai
```

Setelah ini, data pegawai bisa ditambah/diubah/dihapus dari dashboard admin
(lihat langkah 8) — termasuk mengunggah foto tiap pegawai.

### 5b. Kalau PostgreSQL belum ada

- **Windows/macOS:** unduh installer dari https://www.postgresql.org/download/
- **Docker (paling cepat, kalau sudah ada Docker):**

```bash
docker run --name db-hst -e POSTGRES_PASSWORD=rahasia -e POSTGRES_DB=diskominfosp_hst -p 5432:5432 -d postgres:16
```

Lalu pakai `DATABASE_URL="postgresql://postgres:rahasia@localhost:5432/diskominfosp_hst"`
dan jalankan `npx prisma migrate deploy`.

---

## 6. Jalankan aplikasinya

### Mode cepat (untuk mencoba/demo)

```bash
npm run dev
```

Buka peramban ke **http://localhost:3000** — portal langsung tampil.
Untuk menghentikan: tekan `Ctrl + C` di terminal.

### Mode presentasi (lebih cepat & stabil, disarankan saat tampil di depan orang)

```bash
npm run build
npm run start
```

Buka **http://localhost:3000**. Mode ini memuat halaman jauh lebih cepat dan tidak
menampilkan pesan pengembangan.

---

## 7. Halaman yang bisa Anda tunjukkan

| Alamat | Isi |
|---|---|
| `/` | Beranda: berita terbaru, cuaca BMKG, radio, feed video |
| `/berita` | Daftar berita resmi + pencarian |
| `/profil/data-pegawai` | Data pegawai: kartu foto, pencarian, filter unit |
| `/layanan` | Ringkasan layanan digital |
| `/reservasi` | Formulir permohonan layanan (kunjungan, aula, narasumber, dll.) |
| `/reservasi/status` | Cek status permohonan memakai kode lacak |
| `/data-terbuka` | Katalog data daerah yang bisa dicari |
| `/radio` | Pemutar Radio Swara Murakata |
| `/survei` | Survei kepuasan layanan (IKM) |
| `/kontak` | Alamat, telepon, email, peta lokasi |
| `/masuk` | Halaman login administrator |
| `/dashboard/pegawai` | Kelola data pegawai (tambah/ubah/hapus/unggah foto) — admin |

---

## 8. Mengaktifkan halaman admin (opsional)

Halaman admin di `/dashboard` dilindungi login. Aktifkan akunnya:

```bash
node scripts/setup-admin.mjs
```

Script akan meminta **email** dan **password** Anda (password tidak terlihat saat diketik),
lalu menyimpannya dalam bentuk terenkripsi ke `.env.local`. Setelah itu **hentikan server
lalu jalankan ulang** (`Ctrl + C`, lalu `npm run start`), baru masuk di `/masuk`.

---

## 9. Kalau ada masalah

| Gejala | Penyebab & solusi |
|---|---|
| `npm: command not found` | Node.js belum terpasang. Pasang dari https://nodejs.org lalu buka ulang terminal. |
| Halaman berita/data kosong | Tidak ada koneksi internet, atau sumber resmi sedang tidak bisa diakses. Portal tetap tampil dengan pesan ramah — bukan error. |
| Fitur survei/reservasi error | Database belum disiapkan. Ulangi langkah 5. |
| Login admin gagal | Belum menjalankan langkah 8, atau server belum di-restart setelah mengaktifkan admin. |
| Port 3000 sedang dipakai | Jalankan di port lain: `npm run dev -- -p 3001`, lalu buka `http://localhost:3001`. |
| Muncul "site can't be reached" setelah login | `NEXTAUTH_URL` di `.env.local` tidak sama dengan alamat yang Anda buka. Samakan keduanya. |

---

## 10. Catatan keamanan

- Berkas `.env.local` berisi kunci rahasia. **Jangan** dibagikan atau diunggah ke internet.
- Berkas ini sudah otomatis dikecualikan dari Git (lihat `.gitignore`).
- Portal ini **tidak menyimpan kata sandi dalam bentuk asli** — hanya sidik jarinya (hash).

---

## Ringkasan perintah (salin-tempel)

```bash
# 1) Pasang paket
npm install

# 2) Siapkan pengaturan
cp .env.example .env.local     # Windows: copy .env.example .env.local
# -> buat AUTH_SECRET dengan:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# -> tempel hasilnya ke .env.local

# 3) (Opsional) Database
npx prisma generate
npx prisma migrate deploy
npm run seed:pegawai      # isi 41 data pegawai awal

# 4) Jalankan
npm run build
npm run start
# lalu buka http://localhost:3000
```
