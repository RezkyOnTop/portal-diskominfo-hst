-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nip" TEXT,
    "jabatan" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Staff_unit_idx" ON "Staff"("unit");

-- CreateIndex
CREATE INDEX "Staff_urutan_idx" ON "Staff"("urutan");

-- CreateIndex
CREATE INDEX "Staff_aktif_idx" ON "Staff"("aktif");
