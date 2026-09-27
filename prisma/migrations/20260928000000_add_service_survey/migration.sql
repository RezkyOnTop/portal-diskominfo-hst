-- Migrasi: Survei Kepuasan Masyarakat (IKM) — data LOKAL portal baru.
-- Tidak menyentuh data Media Center (berita/pengumuman/hoaks tetap dari API).

CREATE TABLE "ServiceSurvey" (
    "id"        TEXT        NOT NULL,
    "layanan"   TEXT        NOT NULL,
    "u1"        INTEGER     NOT NULL,
    "u2"        INTEGER     NOT NULL,
    "u3"        INTEGER     NOT NULL,
    "u4"        INTEGER     NOT NULL,
    "u5"        INTEGER     NOT NULL,
    "u6"        INTEGER     NOT NULL,
    "u7"        INTEGER     NOT NULL,
    "u8"        INTEGER     NOT NULL,
    "u9"        INTEGER     NOT NULL,
    "ikm"       DOUBLE PRECISION NOT NULL,
    "mutu"      TEXT        NOT NULL,
    "saran"     TEXT,
    "nama"      TEXT,
    "kontak"    TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceSurvey_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceSurvey_layanan_idx" ON "ServiceSurvey"("layanan");
CREATE INDEX "ServiceSurvey_createdAt_idx" ON "ServiceSurvey"("createdAt");
