import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/validations/local.schema";

/**
 * Augmentasi tipe Auth.js: sesi kita membawa id akun + peran (role), sehingga
 * halaman/aksi admin bisa membedakan Administrator (akses penuh) dari Editor
 * (kelola konten saja) tanpa membaca ulang database di setiap render.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}
