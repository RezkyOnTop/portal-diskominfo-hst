import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function logoutAction() {
  "use server";
  await signOut({ redirectTo: "/" });
}

/** Layout area admin — dilindungi sesi Auth.js. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/masuk");

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[220px_1fr]">
      <aside>
        <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Administrator
          </p>
          <p className="mt-1 truncate text-sm font-medium text-neutral-900">
            {session.user?.email}
          </p>
          <nav aria-label="Navigasi admin" className="mt-4 space-y-1">
            <Link
              href="/dashboard"
              className="block rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-primary-50"
            >
              Ringkasan
            </Link>
            <Link
              href="/dashboard/statistik"
              className="block rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-primary-50"
            >
              Statistik Kunjungan
            </Link>
            <Link
              href="/dashboard/subscriber"
              className="block rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-primary-50"
            >
              Subscriber Radio
            </Link>
            <Link
              href="/dashboard/reservasi"
              className="block rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-primary-50"
            >
              Reservasi Layanan
            </Link>
            <Link
              href="/dashboard/survei"
              className="block rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-primary-50"
            >
              Survei IKM
            </Link>
          </nav>
          <form action={logoutAction} className="mt-4">
            <button
              type="submit"
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Keluar
            </button>
          </form>
        </div>
      </aside>
      <section>{children}</section>
    </div>
  );
}
