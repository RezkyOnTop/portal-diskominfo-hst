-- Tabel slide foto slideshow hero beranda (data lokal).
-- Dikelola admin lewat /dashboard/hero; foto disimpan di .uploads/hero/.
CREATE TABLE "HeroSlide" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HeroSlide_urutan_idx" ON "HeroSlide"("urutan");
CREATE INDEX "HeroSlide_aktif_idx" ON "HeroSlide"("aktif");
