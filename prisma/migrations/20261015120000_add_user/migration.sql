-- Tabel akun pengguna dashboard admin (data lokal).
-- Dikelola admin lewat /dashboard/pengguna ("Kelola User").
-- Identitas login disimpan di kolom "username" (boleh email atau username
-- singkat seperti "admin"). Password disimpan sebagai hash bcrypt (cost 12),
-- bukan teks polos.
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EDITOR',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_aktif_idx" ON "User"("aktif");
