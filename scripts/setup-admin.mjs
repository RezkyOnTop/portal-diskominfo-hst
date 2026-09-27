#!/usr/bin/env node
/**
 * ============================================================================
 *  scripts/setup-admin.mjs — Aktifkan akun administrator dashboard.
 * ============================================================================
 *
 * Dashboard admin (`/dashboard`) dilindungi Auth.js dan membaca kredensial
 * dari environment:
 *   ADMIN_EMAIL          — email admin
 *   ADMIN_PASSWORD_HASH  — hash bcrypt dari password (BUKAN password polos)
 *
 * Script ini meminta email & password, menghitung hash bcrypt-nya, lalu
 * menulis/memperbarui kedua variabel di `.env.local`. Password TIDAK pernah
 * disimpan dalam bentuk polos dan tidak dikirim ke mana pun.
 *
 * Pemakaian:
 *   node scripts/setup-admin.mjs
 *   node scripts/setup-admin.mjs --file .env.local   # target lain
 *
 * Setelah selesai: restart server agar environment terbaca ulang.
 */

import { createInterface } from "node:readline";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");

const argFile = (() => {
  const i = process.argv.indexOf("--file");
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : ".env.local";
})();

const TTY = Boolean(process.stdin.isTTY);

/**
 * Sumber jawaban. Pada TTY: tanya interaktif (password disembunyikan).
 * Pada pipe/file: baca seluruh stdin sekali, lalu layani dari antrean —
 * membuat readline berulang pada pipe akan kehilangan data yang ter-buffer.
 */
let antrean = null;
if (!TTY) {
  antrean = readFileSync(0, "utf8").split("\n");
}

let rl = null;
function tanya(teks) {
  if (antrean) {
    process.stdout.write(teks);
    const nilai = (antrean.shift() ?? "").trim();
    process.stdout.write(`${TTY ? "" : nilai}\n`);
    return Promise.resolve(nilai);
  }
  rl ??= createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(teks, (j) => resolve(j.trim())));
}

/** Prompt password; pada TTY input disembunyikan. */
function tanyaRahasia(teks) {
  if (antrean) return tanya(teks);
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    stdout.write(teks);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let buf = "";
    const selesai = (nilai) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdout.write("\n");
      resolve(nilai);
    };
    const onData = (ch) => {
      switch (ch) {
        case "\r":
        case "\n":
        case "\u0004": // Ctrl-D
          selesai(buf.trim());
          break;
        case "\u0003": // Ctrl-C
          stdout.write("\nDibatalkan.\n");
          process.exit(130);
          break;
        case "\u007f": // Backspace
        case "\b":
          buf = buf.slice(0, -1);
          break;
        default:
          if (ch >= " ") buf += ch; // abaikan escape sequence / kontrol
      }
    };
    stdin.on("data", onData);
  });
}

/** Set/ubah satu variabel di isi file .env, mempertahankan komentar lain. */
function setVar(isi, kunci, nilai) {
  const baris = `${kunci}="${nilai}"`;
  const pola = new RegExp(`^\\s*${kunci}\\s*=.*$`, "m");
  return isi.replace(pola, baris); // sudah ada -> ganti di tempat
}

/** Tambahkan variabel baru di akhir file, di bawah satu header komentar. */
function tambahVar(isi, kunci, nilai) {
  const baris = `${kunci}="${nilai}"`;
  if (new RegExp(`^\\s*${kunci}\\s*=`, "m").test(isi)) return setVar(isi, kunci, nilai);
  const pemisah = isi === "" || isi.endsWith("\n") ? "" : "\n";
  return `${isi}${pemisah}${baris}\n`;
}

async function main() {
  console.log("=== Aktifkan akun administrator Diskominfo SP HST ===\n");

  const email = await tanya("Email admin: ");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("✖ Email tidak valid.");
    process.exit(1);
  }

  const pw1 = await tanyaRahasia("Password (tidak terlihat): ");
  if (pw1.length < 8) {
    console.error("✖ Password minimal 8 karakter.");
    process.exit(1);
  }
  const pw2 = await tanyaRahasia("Ulangi password: ");
  if (pw1 !== pw2) {
    console.error("✖ Password tidak sama.");
    process.exit(1);
  }

  const hash = bcrypt.hashSync(pw1, 12);

  let isi = existsSync(argFile) ? readFileSync(argFile, "utf8") : "";
  const baru = !/^\s*ADMIN_EMAIL\s*=/m.test(isi);
  if (baru) {
    const pemisah = isi === "" || isi.endsWith("\n") ? "" : "\n";
    isi = `${isi}${pemisah}\n# Administrator dashboard (dibuat oleh scripts/setup-admin.mjs)\n`;
  }
  isi = tambahVar(isi, "ADMIN_EMAIL", email);
  isi = tambahVar(isi, "ADMIN_PASSWORD_HASH", hash);

  // Pastikan ada secret sesi — tanpa ini Auth.js menolak di produksi.
  if (!/^\s*(AUTH_SECRET|NEXTAUTH_SECRET)\s*=/m.test(isi)) {
    isi = tambahVar(isi, "AUTH_SECRET", randomBytes(32).toString("base64"));
    console.log("• AUTH_SECRET baru dibuat otomatis.");
  }

  writeFileSync(argFile, isi, { mode: 0o600 });

  console.log(`\n✔ Kredensial admin disimpan di ${argFile} (mode 600).`);
  console.log("  ADMIN_EMAIL & ADMIN_PASSWORD_HASH telah diperbarui.");
  console.log("\nLangkah berikutnya: restart server, lalu masuk di /masuk");
  console.log("  npm run build && npm run start");
  if (rl) rl.close();
}

main().catch((err) => {
  console.error("Gagal:", err?.message ?? err);
  if (rl) rl.close();
  process.exit(1);
});
