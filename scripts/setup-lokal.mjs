#!/usr/bin/env node
/**
 * ============================================================================
 *  scripts/setup-lokal.mjs — Siapkan berkas pengaturan untuk dijalankan lokal.
 * ============================================================================
 *
 * Membuat `.env.local` dari `.env.example` (kalau belum ada) dan mengisi
 * NEXTAUTH_SECRET dengan kunci acak. Aman dijalankan berulang: berkas yang
 * sudah ada TIDAK ditimpa, dan kunci yang sudah terisi tidak diganti.
 *
 * Pemakaian:
 *   node scripts/setup-lokal.mjs
 *   node scripts/setup-lokal.mjs --url http://localhost:3001
 *
 * Setelah selesai: npm run build && npm run start  (buka http://localhost:3000)
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, chmodSync } from "node:fs";
import { randomBytes } from "node:crypto";

const PLACEHOLDER = /replace-with-openssl-rand-base64-32/;

const argUrl = (() => {
  const i = process.argv.indexOf("--url");
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
})();

function main() {
  console.log("=== Siapkan Portal Diskominfo SP HST untuk dijalankan lokal ===\n");

  if (!existsSync(".env.example")) {
    console.error("✖ Berkas .env.example tidak ditemukan.");
    console.error("  Jalankan perintah ini dari dalam folder proyek (diskominfosp-hst).");
    process.exit(1);
  }

  if (!existsSync(".env.local")) {
    copyFileSync(".env.example", ".env.local");
    console.log("• .env.local dibuat dari .env.example");
  } else {
    console.log("• .env.local sudah ada — isi yang ada dipertahankan.");
  }

  let isi = readFileSync(".env.local", "utf8");

  // 1) Isi NEXTAUTH_SECRET kalau masih placeholder.
  if (PLACEHOLDER.test(isi)) {
    const kunci = randomBytes(32).toString("base64");
    isi = isi.replace(/^(\s*NEXTAUTH_SECRET\s*=\s*").*(")\s*$/m, `$1${kunci}$2`);
    console.log("• NEXTAUTH_SECRET diisi dengan kunci acak baru.");
  } else {
    console.log("• NEXTAUTH_SECRET sudah terisi.");
  }

  // 2) Sesuaikan NEXTAUTH_URL bila diminta.
  if (argUrl) {
    isi = isi.replace(/^(\s*NEXTAUTH_URL\s*=\s*").*(")\s*$/m, `$1${argUrl}$2`);
    console.log(`• NEXTAUTH_URL diatur ke ${argUrl}`);
  }

  writeFileSync(".env.local", isi, { mode: 0o600 });
  chmodSync(".env.local", 0o600);
  console.log("• .env.local disimpan (mode 600).\n");

  const tanpaDb = /^(\s*DATABASE_URL\s*=\s*").*\*\*\*.*(")/m.test(isi);
  console.log("Langkah berikutnya:");
  console.log("  1. npm install");
  console.log("  2. npx prisma generate && npx prisma migrate deploy   # opsional (butuh PostgreSQL)");
  if (tanpaDb) {
    console.log("     -> DATABASE_URL di .env.local masih berisi ***; ganti dulu kalau mau pakai database.");
  }
  console.log("  3. npm run build && npm run start");
  console.log("  4. Buka http://localhost:3000\n");
  console.log("Panduan lengkap: baca SETUP.md");
}

main();
