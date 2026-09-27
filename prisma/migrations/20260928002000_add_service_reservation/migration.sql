-- CreateTable
CREATE TABLE "ServiceReservation" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "instansi" TEXT,
    "email" TEXT NOT NULL,
    "telepon" TEXT NOT NULL,
    "layanan" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "waktuMulai" TEXT NOT NULL,
    "waktuSelesai" TEXT,
    "jumlahPeserta" INTEGER NOT NULL,
    "keperluan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'MENUNGGU',
    "catatanAdmin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceReservation_kode_key" ON "ServiceReservation"("kode");

-- CreateIndex
CREATE INDEX "ServiceReservation_status_idx" ON "ServiceReservation"("status");

-- CreateIndex
CREATE INDEX "ServiceReservation_tanggal_idx" ON "ServiceReservation"("tanggal");

-- CreateIndex
CREATE INDEX "ServiceReservation_createdAt_idx" ON "ServiceReservation"("createdAt");
