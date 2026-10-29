import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { verifyUserLogin } from "@/lib/services/user";
import { catatAudit } from "@/lib/services/audit";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { UserRole } from "@/lib/validations/local.schema";

/**
 * Auth.js (NextAuth v5) — untuk area admin lokal
 * (dashboard statistik, manajemen konten, dan kelola user).
 *
 * Membaca berita/pengumuman/hoaks TIDAK butuh login: sumbernya API Media Center.
 *
 * Dua sumber kredensial, diperiksa berurutan:
 *   1. Akun dari environment (ADMIN_EMAIL / ADMIN_PASSWORD_HASH) — akun utama
 *      yang dibuat scripts/setup-admin.mjs; selalu berperan Administrator.
 *      Berguna sebagai cadangan bila tabel User kosong / belum dimigrasi.
 *   2. Akun dari tabel `User` (dikelola lewat /dashboard/pengguna) — mendukung
 *      banyak pengguna, peran (ADMIN/EDITOR), ganti password, dan nonaktif.
 *
 * AUTH_SECRET (NEXTAUTH_SECRET masih diterima sebagai cadangan, tetapi
 * AUTH_SECRET dibaca lebih dulu).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/masuk" },
  providers: [
    Credentials({
      name: "Administrator",
      credentials: {
        email: { label: "Email / Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const identitas = String(credentials?.email ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!identitas || !password) return null;

        // Anti brute force: batasi percobaan login per IP dan per akun.
        // (Tanpa batas ini, endpoint /api/auth/callback/credentials menerima
        // percobaan tak terhingga; bcrypt cost 12 hanya memperlambat, tidak
        // menghentikan.) Kunci memakai clientIp() dari lib/rate-limit.
        const ip = clientIp(request);
        if (!rateLimit(`login:${ip}`, 15, 60_000).ok) return null;
        if (!rateLimit(`login-akun:${identitas.toLowerCase()}`, 8, 60_000).ok) {
          return null;
        }

        const ua = request?.headers.get("user-agent") ?? null;

        // 1) Akun environment (akun utama).
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminHash = process.env.ADMIN_PASSWORD_HASH;
        if (
          adminEmail &&
          adminHash &&
          identitas.toLowerCase() === adminEmail.toLowerCase()
        ) {
          const valid = await bcrypt.compare(password, adminHash);
          if (valid) {
            await catatAudit({
              actorId: "env-admin",
              actorName: "Administrator",
              actorRole: "ADMIN",
              aksi: "MASUK",
              detail: `Masuk sebagai akun environment (${adminEmail})`,
              ip,
              userAgent: ua,
            });
            return {
              id: "env-admin",
              name: "Administrator",
              email: adminEmail,
              role: "ADMIN" as UserRole,
            };
          }
        }

        // 2) Akun dari tabel User (kelola user).
        const akun = await verifyUserLogin(identitas, password);
        if (akun) {
          await catatAudit({
            actorId: akun.id,
            actorName: akun.nama || akun.username,
            actorRole: akun.role,
            aksi: "MASUK",
            detail: `Masuk sebagai ${akun.role} (${akun.username})`,
            ip,
            userAgent: ua,
          });
          return {
            id: akun.id,
            name: akun.nama,
            email: akun.username,
            role: akun.role,
          };
        }

        // Gagal: catat supaya percobaan tebak password terlihat di /dashboard/audit.
        // Dibatasi 5 baris / 5 menit per IP (ditambah ember global di rateLimit)
        // agar penyemprot login gagal tidak menggelembungkan tabel audit.
        if (rateLimit(`audit-gagal:${ip}`, 5, 300_000).ok) {
          await catatAudit({
            actorName: identitas,
            actorRole: "ANONIM",
            aksi: "MASUK_GAGAL",
            detail: `Percobaan masuk gagal untuk "${identitas}"`,
            ip,
            userAgent: ua,
          });
        }
        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // Saat login pertama, salin id + peran dari user ke token.
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "EDITOR";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "EDITOR";
      }
      return session;
    },
    authorized({ auth: session }) {
      return Boolean(session);
    },
  },
  events: {
    /**
     * Catat keluar dashboard. Strategi sesi JWT: event membawa `token`, bukan
     * `session`; id/nama/peran dibaca dari token yang sudah kita isi di callback
     * `jwt`. IP tidak tersedia di sini (bukan permintaan biasa).
     */
    async signOut(pesan) {
      const token = "token" in pesan ? (pesan.token as Record<string, unknown> | null) : null;
      if (!token) return;
      const id = typeof token.id === "string" ? token.id : null;
      const nama =
        typeof token.name === "string"
          ? token.name
          : typeof token.email === "string"
            ? token.email
            : "Tidak dikenal";
      await catatAudit({
        actorId: id,
        actorName: nama,
        actorRole: token.role === "ADMIN" ? "ADMIN" : "EDITOR",
        aksi: "KELUAR",
        detail: "Keluar dari dashboard",
      });
    },
  },
});
