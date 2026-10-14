import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["lib/**", "app/api/**"],
      // Dikecualikan dari hitungan cakupan, DENGAN ALASAN (bukan demi angka):
      //   - lib/db.ts, lib/auth.ts, app/api/auth/**  : klien Prisma & NextAuth
      //     (pembungkus pustaka, bukan logika kita).
      //   - lib/storage/**  : pembungkus tipis filesystem (tulis/baca/hapus
      //     berkas). Mengujinya butuh filesystem tiruan; nilainya kecil karena
      //     sudah dibuktikan uji nyata: unggah 201 -> foto 200 -> hapus 404.
      //   - lib/api/gambar.ts : pengambil gambar via TLS khusus (undici) +
      //     sharp. Butuh jaringan & biner; sama, sudah diuji nyata di server.
      //   - app/api/**/foto/[id]/route.ts : route unggah/hapus berkas; perlu
      //     permintaan multipart + sesi admin. Diuji nyata end-to-end.
      //   - app/api/gambar/route.ts : proksi gambar (lihat lib/api/gambar.ts).
      // Semua ini adalah INFRASTRUKTUR, bukan aturan bisnis. Bila kelak ada
      // logika di dalamnya, tes harus ditulis — bukan dikecualikan.
      exclude: [
        "lib/db.ts",
        "lib/auth.ts",
        "app/api/auth/**",
        "lib/storage/**",
        "lib/api/gambar.ts",
        "app/api/gambar/**",
        "app/api/hero/foto/**",
        "app/api/pegawai/foto/**",
        "**/*.d.ts",
        "**/*.test.*",
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
  resolve: {
    alias: {
      "@": root,
      // Vitest tidak bisa me-resolve paket server-only; arahkan ke stub.
      "server-only": fileURLToPath(new URL("./test/server-only.stub.ts", import.meta.url)),
    },
  },
});
