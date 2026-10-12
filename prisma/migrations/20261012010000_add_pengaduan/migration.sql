-- Migrasi: Pengaduan & Aspirasi masyarakat (data LOKAL portal baru).
-- Tidak menyentuh data Media Center (berita/pengumuman/hoaks tetap dari API).

CREATE TABLE "Pengaduan" (
    "id"        TEXT        NOT NULL,
    "kode"      TEXT        NOT NULL,
    "nama"      TEXT        NOT NULL,
    "kontak"    TEXT        NOT NULL,
    "kategori"  TEXT        NOT NULL,
    "isi"       TEXT        NOT NULL,
    "status"    TEXT        NOT NULL DEFAULT 'BARU',
    "tanggapan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pengaduan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Pengaduan_kode_key" ON "Pengaduan"("kode");
CREATE INDEX "Pengaduan_status_idx" ON "Pengaduan"("status");
CREATE INDEX "Pengaduan_createdAt_idx" ON "Pengaduan"("createdAt");
