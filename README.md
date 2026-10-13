# Diskominfo SP HST — Rebuild

Portal resmi **Dinas Komunikasi, Informatika, Statistik, dan Persandian Kabupaten Hulu Sungai Tengah**.

Dokumentasi kontrak kerja ada di `~/diskominfosp-hst-docs/` (PRD, ARCHITECTURE, DESIGN, SECURITY, TESTING, DEPLOYMENT, TASK_INSTRUCTION).

## Arsitektur sumber data (penting)

- **Berita, pengumuman, hoaks** → diambil dari **API Media Center HST** (`https://mediacenter.hstkab.go.id`).
  **Tidak ada tabel `News`/`HoaxReport` dan tidak ada CRUD berita.** Hanya `lib/api/media-center.ts` yang boleh memanggil domain tersebut.
- **Data terbuka** → katalog dataset dari **API publik Open Data HST** (`https://opendata.hstkab.go.id/api/public/datasets`), tanpa API key.
  Hanya `lib/api/opendata.ts` yang boleh memanggil domain tersebut.
- **Cuaca** → prakiraan resmi dari **API publik BMKG** (`https://api.bmkg.go.id/publik/prakiraan-cuaca`), tanpa API key.
  Hanya `lib/api/bmkg.ts` yang boleh memanggil domain tersebut.
- **Data lokal (PostgreSQL)** → hanya `VisitorStat`, `RadioSubscriber`, `SocialMediaCache`, `ServiceSurvey`, `ServiceReservation`.
- **Feed video** → kanal YouTube resmi Media Center HST lewat **RSS keyless** (`youtube.com/feeds/videos.xml`), di-cache ke `SocialMediaCache`. Hanya `lib/api/youtube.ts` yang boleh memanggil domain tersebut.

### Bentuk API Media Center (hasil verifikasi langsung)

| Endpoint | Bentuk respons |
|---|---|
| `GET /api/berita` | array polos: `{ id_berita, tanggal, title, isi(HTML), foto, link, slug, author, kategori_id }` |
| `GET /api/pengumuman` | array polos: `{ id_pengumuman, tanggal, title, slug, isi(HTML), link }` |
| `GET /api/hoaks` | **404 — belum tersedia** |
| Gambar | `https://data-mediacenter.hstkab.go.id/assets/foto_brt/{foto}` ⚠️ host gambar ≠ host API |
| Halaman detail | `https://mediacenter.hstkab.go.id/berita/{slug}` |

Adapter menormalisasi bentuk mentah ini ke tipe internal (`Berita`, `Pengumuman`) dan memvalidasi dengan Zod. Bila tim Media Center menambah `/api/hoaks`, cukup ubah `getHoaks()` — UI tidak berubah.

### Bentuk API Open Data (hasil verifikasi langsung)

| Endpoint | Bentuk respons |
|---|---|
| `GET /api/public/datasets` | `{ success, data[], metadata{total,page,limit,total_pages}, filters{kategori,instansi} }` |
| Parameter | `page`, `limit`, `kategori`, `instansi`, `tahun`, `search` |
| Item dataset | `{ id, judul, slug, deskripsi(HTML), instansi, kategori, tahun, jenis_data, file_url, updated_at, views, status }` |
| Halaman detail | `https://opendata.hstkab.go.id/public/datasets/{slug}` — **fallback ke `{id}`** |

⚠️ **Sekitar 24% dataset tidak punya `slug`** (null/kosong). Adapter **tidak membuang** dataset tersebut: URL detail memakai `id` sebagai fallback (portal menerima keduanya).

### Bentuk API BMKG (hasil verifikasi langsung)

| Endpoint | Bentuk respons |
|---|---|
| `GET /publik/prakiraan-cuaca?adm4={kode}` | `{ lokasi{provinsi,kotkab,kecamatan,desa,lat,lon}, data[0].cuaca[hari][slot] }` |
| Slot cuaca | `{ local_datetime, t(°C), hu(%), ws(km/j), wd(arah), weather(kode), weather_desc, image(ikon SVG) }` |
| Halaman sumber | `https://www.bmkg.go.id/cuaca/prakiraan-cuaca/{adm4}` |

**Kode wilayah (adm4) default `63.07.06.1001` = Barabai Darat**, kelurahan terdekat dari kantor (≈1,2 km).
Kelurahan Benawa Tengah (lokasi kantor) **belum terdaftar di BMKG**, sehingga Barabai Darat dipakai sebagai
representasi prakiraan wilayah kantor. Ubah lewat env `BMKG_ADM4` bila perlu — tanpa mengubah kode.

## Fitur

- **Berita / Pengumuman / Hoaks** — bersumber dari Media Center HST (adapter + cache TTL + stale-while-error).
- **Pencarian global** (`/cari`, `/api/cari`) — lintas berita, pengumuman, dan halaman statis; pencocokan berbasis token.
- **Mode terang/gelap** — berbasis kelas `.dark` (pilihan pengguna persisten, tanpa flicker).
- **Data Terbuka** (`/data-terbuka`) — katalog 301 dataset dari Open Data HST; pencarian, filter kategori/tahun, paginasi.
- **Survei Kepuasan Layanan** (`/survei`) — Indeks Kepuasan Masyarakat (IKM), 9 unsur sesuai **PermenPANRB 14/2017**; nilai IKM & mutu (A/B/C/D) dihitung di server; ringkasan publik.
- **Reservasi Layanan** (`/reservasi`) — permohonan kunjungan/studi tiru, publikasi, penggunaan aula, narasumber, dan peminjaman peralatan multimedia. Setiap permohonan menerima **kode lacak** (`RSV-XXXXXX`) untuk dipantau di `/reservasi/status`.
- **Peta lokasi** — Google Maps embed di `/kontak` (tanpa API key), koordinat kantor terverifikasi.
- **Cuaca Barabai** — widget prakiraan resmi **BMKG** (3 hari + kondisi saat ini) di beranda & `/kontak`; sumber data terpisah dari konten lain, gagal upstream → fallback ramah + tautan BMKG.
- **Radio Swara Murakata** — pemutar persisten lintas halaman + form subscriber.
- **Media sosial** — feed video kanal YouTube Media Center HST (RSS keyless, di-cache lokal).
- **Analitik kunjungan** — beacon mencatat kunjungan halaman publik ke `VisitorStat` (sekali per perubahan halaman; area admin dikecualikan).
- **Dashboard admin** (`/dashboard`, login di `/masuk`) — ringkasan kunjungan, subscriber, reservasi, dan survei IKM (Auth.js); kelola reservasi & subscriber; **ekspor CSV** untuk ketiga data lokal. Konten berita tetap dikelola di Media Center, bukan di sini.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma 6 · PostgreSQL · Zod v4 · Auth.js (NextAuth v5) · Vitest + Testing Library.

## Menjalankan

> **Baru pertama kali?** Baca **[SETUP.md](./docs/SETUP.md)** — panduan langkah demi langkah
> untuk pemula (termasuk memasang Node.js & PostgreSQL, serta menjalankan mode presentasi).
> Cara cepat: `node scripts/setup-lokal.mjs` untuk membuat `.env.local` + kunci sesi otomatis.

```bash
cp .env.example .env.local   # isi DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH
npm install
npx prisma generate
npx prisma migrate deploy    # buat tabel lokal (VisitorStat, RadioSubscriber, SocialMediaCache, ServiceSurvey, ServiceReservation)
npm run dev
```

Buat hash password admin: `node -e "console.log(require('bcryptjs').hashSync('PASSWORD_ANDA',10))"`.

### Mengaktifkan dashboard admin

Dashboard admin ada di **`/dashboard`** (login di **`/masuk`**), dilindungi Auth.js. Berisi
ringkasan statistik kunjungan & daftar subscriber radio. Berita/pengumuman **tidak** dikelola di
sini (sumbernya Media Center HST).

Aktifkan akun admin dengan script (password diketik langsung, tidak pernah masuk repo):

```bash
node scripts/setup-admin.mjs
# lalu restart server
```

Script meminta email + password, menulis `ADMIN_EMAIL` & `ADMIN_PASSWORD_HASH` (bcrypt) ke
`.env.local` (mode 600), dan membuat `AUTH_SECRET` bila belum ada. Selama kredensial ini belum
diset, `/dashboard` tetap mengalihkan ke `/masuk` tetapi login tidak akan berhasil.

### Menyiapkan PostgreSQL (sekali saja)

```bash
sudo -u postgres psql -c "CREATE ROLE diskominfosp LOGIN PASSWORD 'GANTI_PASSWORD';"
sudo -u postgres createdb -O diskominfosp diskominfosp_hst
# lalu set DATABASE_URL di .env.local:
#   postgresql://diskominfosp:GANTI_PASSWORD@localhost:5432/diskominfosp_hst
npx prisma migrate deploy
```

Tanpa PostgreSQL, portal tetap berjalan: berita/pengumuman/data terbuka tetap tampil (sumber API eksternal),
sedangkan fitur yang butuh database (survei, statistik kunjungan, subscriber radio) menampilkan
fallback yang ramah — bukan error.

## Perintah

```bash
npm run dev            # development
npm run build          # production build
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm run test           # vitest
npm run test:coverage  # coverage (lib/ & app/api/ >= 80%)
```

## Struktur singkat

```
app/(public)/            # beranda, berita, pengumuman, hoaks, radio, cari,
                         # data-terbuka, survei, reservasi, kontak
app/(admin)/dashboard/   # ringkasan, statistik, subscriber, reservasi, survei (Auth.js)
app/masuk/               # halaman login administrator
app/api/                 # visitor, subscriber, cari, survei, reservasi, admin/ekspor, auth
scripts/setup-admin.mjs  # aktifkan akun admin (tulis hash bcrypt ke .env.local)
lib/api/media-center.ts  # SATU-SATUNYA pemanggil mediacenter.hstkab.go.id
lib/api/opendata.ts      # SATU-SATUNYA pemanggil opendata.hstkab.go.id
lib/api/bmkg.ts          # SATU-SATUNYA pemanggil api.bmkg.go.id (cuaca)
lib/api/youtube.ts       # SATU-SATUNYA pemanggil youtube.com/feeds (RSS keyless)
lib/services/            # subscriber, visitor, social, search, survey, reservation (data lokal)
lib/validations/         # skema Zod (+ rumus IKM + reservasi)
lib/utils/csv.ts         # ekspor CSV (BOM UTF-8, delimiter Excel Indonesia)
components/              # ui/, layout/, news/, search/, survei/, cuaca/, reservasi/, analytics/
prisma/schema.prisma     # VisitorStat, RadioSubscriber, SocialMediaCache, ServiceSurvey, ServiceReservation
```

## Catatan verifikasi

- API Media Center **tidak menyediakan paginasi server-side** (mengembalikan ~1357 berita); paginasi dilakukan di adapter.
- `kategori_id` berisi **nama kategori** (mis. `Pemerintahan`), bukan angka.
- Konten `isi` adalah HTML; dirender setelah disanitasi (`lib/utils/sanitize.ts`).
