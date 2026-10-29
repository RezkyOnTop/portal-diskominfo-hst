import { redirect } from "next/navigation";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { auth } from "@/lib/auth";
import { countUsers, listUsers } from "@/lib/services/user";
import { UserCreateForm, UserDirectory, type UserRow } from "./UserForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelola User" };

/**
 * Halaman "Kelola User" — hanya untuk Administrator.
 * Editor yang mencoba membukanya dialihkan ke ringkasan dashboard.
 * Akun utama dari environment (ADMIN_EMAIL) ditampilkan sebagai baris
 * "Bawaan" yang tidak bisa diubah/dihapus dari sini (dikelola lewat
 * scripts/setup-admin.mjs), agar akun cadangan tetap ada.
 */
export default async function PenggunaAdminPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const [rows, counts] = await Promise.all([listUsers(), countUsers()]);

  // Akun environment ikut ditampilkan sebagai referensi (tanpa akses ubah).
  const adminEnv = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const sudahAdaDiDb = rows.some((r) => r.username === adminEnv);
  const bawaan: UserRow[] = adminEnv && !sudahAdaDiDb
    ? [
        {
          id: "__env__",
          username: adminEnv,
          nama: "Administrator (bawaan)",
          role: "ADMIN",
          aktif: true,
          bawaanSistem: true,
        },
      ]
    : [];

  const semua: UserRow[] = [
    ...bawaan,
    ...rows.map((r) => ({
      id: r.id,
      username: r.username,
      nama: r.nama,
      role: r.role,
      aktif: r.aktif,
    })),
  ];

  return (
    <div className="space-y-6">
      <SectionHeading as="h1">Kelola User</SectionHeading>
      <p className="text-sm text-neutral-600 dark:text-slate-400">
        Kelola akun yang bisa masuk ke dashboard. Setiap akun punya peran:
        <strong> Administrator</strong> (akses penuh, termasuk kelola user) atau
        <strong> Editor</strong> (kelola konten saja). Password disimpan sebagai
        hash bcrypt — tidak ada yang bisa melihat password aslinya, termasuk
        Administrator.
      </p>

      {/* Kartu ringkasan */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kartu label="Total user" nilai={semua.length} />
        <Kartu label="Administrator" nilai={counts.admin + bawaan.length} />
        <Kartu label="Editor" nilai={counts.editor} />
        <Kartu label="Nonaktif" nilai={counts.nonaktif} />
      </div>

      <UserCreateForm />

      <div className="flex flex-wrap gap-3">
        <a
          href="/api/admin/ekspor?jenis=user"
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ⬇ Ekspor CSV
        </a>
      </div>

      <section aria-label="Daftar user" className="space-y-3">
        <h2 className="font-heading text-base font-bold text-neutral-900 dark:text-slate-50">
          Daftar User
        </h2>
        <UserDirectory rows={semua} />
      </section>
    </div>
  );
}

function Kartu({ label, nilai }: { label: string; nilai: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs text-neutral-600 dark:text-slate-400">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-neutral-900 dark:text-slate-50">
        {nilai.toLocaleString("id-ID")}
      </p>
    </div>
  );
}
