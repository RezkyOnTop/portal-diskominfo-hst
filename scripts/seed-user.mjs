#!/usr/bin/env node
/**
 * ============================================================================
 *  scripts/seed-user.mjs — Buat akun dashboard awal (idempoten).
 * ============================================================================
 *
 * Membuat akun Administrator contoh agar "Kelola User" langsung bisa dipakai:
 *   username: admin
 *   password: 123        (contoh — ganti lewat /dashboard/pengguna setelah masuk)
 *
 * Password di-hash bcrypt (cost 12), sama seperti lib/services/user.ts.
 * Bila akun dengan username tsb. sudah ada, skrip tidak mengubah apa pun.
 *
 * Pemakaian:
 *   node scripts/seed-user.mjs
 *   node scripts/seed-user.mjs --username admin --password 123 --nama Administrator
 */

import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");

function arg(nama, bawaan) {
  const i = process.argv.indexOf(`--${nama}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : bawaan;
}

const username = arg("username", "admin").trim().toLowerCase();
const password = arg("password", "123");
const nama = arg("nama", "Administrator");
const role = arg("role", "ADMIN").trim().toUpperCase();

const prisma = new PrismaClient();

async function main() {
  if (!/^[a-z0-9][a-z0-9._@-]{2,}$/.test(username)) {
    console.error("✖ Username tidak valid (min 3 karakter, huruf kecil/angka).");
    process.exit(1);
  }
  if (password.length < 3) {
    console.error("✖ Password minimal 3 karakter.");
    process.exit(1);
  }

  const ada = await prisma.user.findUnique({ where: { username } });
  if (ada) {
    console.log(`• Akun "${username}" sudah ada — tidak diubah.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { username, nama, passwordHash, role: role === "ADMIN" ? "ADMIN" : "EDITOR" },
  });

  console.log(`✔ Akun dibuat: ${username} / ${password} (peran ${role}).`);
  console.log("  Buka /masuk, lalu kelola di /dashboard/pengguna.");
  if (password === "123") {
    console.warn("⚠  Password contoh sangat lemah — segera ganti setelah masuk.");
  }
}

main()
  .catch((err) => {
    console.error("Gagal:", err?.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
