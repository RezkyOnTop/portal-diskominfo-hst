# Diskominfo SP HST — Rebuild

Portal resmi **Dinas Komunikasi, Informatika, Statistik, dan Persandian Kabupaten Hulu Sungai Tengah**.

Dokumentasi kontrak kerja ada di `~/diskominfosp-hst-docs/` (PRD, ARCHITECTURE, DESIGN, SECURITY, TESTING, DEPLOYMENT, TASK_INSTRUCTION).

## Arsitektur sumber data (penting)

- **Berita, pengumuman, hoaks** → diambil dari **API Media Center HST** (`https://mediacenter.hstkab.go.id`).
  **Tidak ada tabel `News`/`HoaxReport` dan tidak ada CRUD berita.** Hanya `lib/api/media-center.ts` yang boleh memanggil domain tersebut.
- **Data lokal (PostgreSQL)** → hanya `VisitorStat`, `RadioSubscriber`, `SocialMediaCache`.

### Bentuk API Media Center (hasil verifikasi langsung)

| Endpoint | Bentuk respons |
|---|---|
| `GET /api/berita` | array polos: `{ id_berita, tanggal, title, isi(HTML), foto, link, slug, author, kategori_id }` |
| `GET /api/pengumuman` | array polos: `{ id_pengumuman, tanggal, title, slug, isi(HTML), link }` |
| `GET /api/hoaks` | **404 — belum tersedia** |
| Gambar | `https://mediacenter.hstkab.go.id/assets/foto_brt/{foto}` |
| Halaman detail | `https://mediacenter.hstkab.go.id/berita/{slug}` |

Adapter menormalisasi bentuk mentah ini ke tipe internal (`Berita`, `Pengumuman`) dan memvalidasi dengan Zod. Bila tim Media Center menambah `/api/hoaks`, cukup ubah `getHoaks()` — UI tidak berubah.

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
app/(public)/            # beranda, berita, pengumuman, hoaks, radio
app/(admin)/dashboard/   # statistik + subscriber (Auth.js)
app/api/                 # visitor, subscriber, auth
lib/api/media-center.ts  # SATU-SATUNYA pemanggil mediacenter.hstkab.go.id
lib/services/            # subscriber, visitor, social (data lokal)
lib/validations/         # skema Zod
components/              # ui/, layout/, news/
prisma/schema.prisma     # VisitorStat, RadioSubscriber, SocialMediaCache
```

## Catatan verifikasi

- API Media Center **tidak menyediakan paginasi server-side** (mengembalikan ~1357 berita); paginasi dilakukan di adapter.
- `kategori_id` berisi **nama kategori** (mis. `Pemerintahan`), bukan angka.
- Konten `isi` adalah HTML; dirender setelah disanitasi (`lib/utils/sanitize.ts`).
