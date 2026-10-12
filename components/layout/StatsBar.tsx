import { getStatistikRingkas } from "@/lib/services/visitor";
import { JAM_LAYANAN } from "@/lib/config";

/**
 * Bar statistik kunjungan (data lokal). Gagal DB → tampilkan tanda "—",
 * tidak pernah memecahkan halaman.
 */
export async function StatsBar() {
  let total: number | null = null;
  let today: number | null = null;
  try {
    const s = await getStatistikRingkas(30);
    total = s.total;
    today = s.hariIni;
  } catch {
    total = null;
    today = null;
  }

  const items = [
    { label: "Total Kunjungan", value: total },
    { label: "Hari Ini", value: today },
  ];

  return (
    <section className="border-y border-neutral-200 bg-white py-8">
      <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="text-center">
            <dd className="font-heading text-2xl font-extrabold text-primary-700 sm:text-3xl">
              {typeof it.value === "number" ? it.value.toLocaleString("id-ID") : "—"}
            </dd>
            <dt className="mt-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
              {it.label}
            </dt>
          </div>
        ))}
        <div className="text-center">
          <dd className="font-heading text-xl font-extrabold text-primary-700 sm:text-2xl">
            {JAM_LAYANAN.singkat}
          </dd>
          <dt className="mt-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Jam Layanan
          </dt>
        </div>
        <div className="text-center">
          <dd className="font-heading text-2xl font-extrabold text-primary-700 sm:text-3xl">
            1
          </dd>
          <dt className="mt-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Radio Daerah
          </dt>
        </div>
      </dl>
    </section>
  );
}
