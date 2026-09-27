# Diskominfo SP HST — Rebuild

Portal resmi **Dinas Komunikasi, Informatika, Statistik, dan Persandian Kabupaten Hulu Sungai Tengah**.

Dokumentasi kontrak kerja ada di `~/diskominfosp-hst-docs/` (PRD, ARCHITECTURE, DESIGN, SECURITY, TESTING, DEPLOYMENT, TASK_INSTRUCTION).

## Arsitektur sumber data (penting)

- **Berita, pengumuman, hoaks** → diambil dari **API Media Center HST** (`https://mediacenter.hstkab.go.id`).
  **Tidak ada tabel `News`/`HoaxReport` dan tidak ada CRUD berita.** Hanya `lib/api/media-center.ts` yang boleh memanggil domain tersebut.
- **Data terbuka** → katalog dataset dari **API publik Open Data HST** (`https://opendata.hstkab.go.id/api/public/datasets`), tanpa API key.
  Hanya `lib/api/opendata.ts` yang boleh memanggil domain tersebut.
- **Data lokal (PostgreSQL)** → hanya `VisitorStat`, `RadioSubscriber`, `SocialMediaCache`, `ServiceSurvey`.

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

## Fitur

- **Berita / Pengumuman / Hoaks** — bersumber dari Media Center HST (adapter + cache TTL + stale-while-error).
- **Pencarian global** (`/cari`, `/api/cari`) — lintas berita, pengumuman, dan halaman statis; pencocokan berbasis token.
- **Mode terang/gelap** — berbasis kelas `.dark` (pilihan pengguna persisten, tanpa flicker).
- **Data Terbuka** (`/data-terbuka`) — katalog 301 dataset dari Open Data HST; pencarian, filter kategori/tahun, paginasi.
- **Survei Kepuasan Layanan** (`/survei`) — Indeks Kepuasan Masyarakat (IKM), 9 unsur sesuai **PermenPANRB 14/2017**; nilai IKM & mutu (A/B/C/D) dihitung di server; ringkasan publik.
- **Peta lokasi** — Google Maps embed di `/kontak` (tanpa API key), koordinat kantor terverifikasi.
- **Radio Swara Murakata** — pemutar persisten lintas halaman + form subscriber.
- **Dashboard admin** — statistik kunjungan & daftar subscriber (Auth.js).

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma 6 · PostgreSQL · Zod v4 · Auth.js (NextAuth v5) · Vitest + Testing Library.

## Menjalankan

```bash
cp .env.example .env.local   # isi DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH
npm install
npx prisma generate
npm run dev
```

Buat hash password admin: `node -e "console.log(require('bcryptjs').hashSync('PASSWORD_ANDA',10))"`.

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
                         # data-terbuka, survei, kontak
app/(admin)/dashboard/   # statistik + subscriber (Auth.js)
app/api/                 # visitor, subscriber, cari, survei, auth
lib/api/media-center.ts  # SATU-SATUNYA pemanggil mediacenter.hstkab.go.id
lib/api/opendata.ts      # SATU-SATUNYA pemanggil opendata.hstkab.go.id
lib/services/            # subscriber, visitor, social, search, survey (data lokal)
lib/validations/         # skema Zod (+ rumus IKM)
components/              # ui/, layout/, news/, search/, survei/
prisma/schema.prisma     # VisitorStat, RadioSubscriber, SocialMediaCache, ServiceSurvey
```

## Catatan verifikasi

- API Media Center **tidak menyediakan paginasi server-side** (mengembalikan ~1357 berita); paginasi dilakukan di adapter.
- `kategori_id` berisi **nama kategori** (mis. `Pemerintahan`), bukan angka.
- Konten `isi` adalah HTML; dirender setelah disanitasi (`lib/utils/sanitize.ts`).
