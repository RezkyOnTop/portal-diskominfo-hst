import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

/**
 * Auth.js (NextAuth v5) — HANYA untuk area admin lokal
 * (dashboard statistik & manajemen subscriber).
 *
 * Membaca berita/pengumuman/hoaks TIDAK butuh login: sumbernya API Media Center
 * yang bersifat publik. Kredensial admin berasal dari environment:
 *   ADMIN_EMAIL, ADMIN_PASSWORD_HASH (bcrypt), AUTH_SECRET / NEXTAUTH_SECRET
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/masuk" },
  providers: [
    Credentials({
      name: "Administrator",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminHash = process.env.ADMIN_PASSWORD_HASH;
        if (!adminEmail || !adminHash) return null;
        const email = String(credentials?.email ?? "").toLowerCase();
        const password = String(credentials?.password ?? "");
        if (email !== adminEmail.toLowerCase() || !password) return null;
        const valid = await bcrypt.compare(password, adminHash);
        if (!valid) return null;
        return { id: "admin", name: "Administrator", email: adminEmail };
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session }) {
      return Boolean(session);
    },
  },
});
