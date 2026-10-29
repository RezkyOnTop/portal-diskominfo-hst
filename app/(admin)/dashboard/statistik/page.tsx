import { SectionHeading } from "@/components/ui/SectionHeading";
import { getStatistikRingkas } from "@/lib/services/visitor";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Statistik Kunjungan" };

export default async function StatistikPage() {
  const stats = await getStatistikRingkas(14);
  const max = Math.max(1, ...stats.perHari.map((d) => d.jumlah));

  return (
    <div className="space-y-8">
      <SectionHeading as="h1">Statistik Kunjungan</SectionHeading>

      <section>
        <h2 className="font-heading text-lg font-semibold text-[var(--adm-ink)]">
          Tren 14 Hari
        </h2>
        {stats.perHari.length === 0 ? (
          <p className="mt-3 rounded-[var(--radius-card)] border border-dashed border-[var(--adm-rule)] bg-[var(--adm-surface)] p-6 text-sm text-[var(--adm-ink-2)]">
            Belum ada data kunjungan.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {stats.perHari.map((d) => (
              <li key={d.tanggal} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 text-[var(--adm-ink-2)]">
                  {formatDate(d.tanggal)}
                </span>
                <span
                  aria-hidden="true"
                  className="h-3 rounded-full bg-[var(--adm-accent)]"
                  style={{ width: `${Math.round((d.jumlah / max) * 100)}%` }}
                />
                <span className="font-medium text-[var(--adm-ink)]">{d.jumlah}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-heading text-lg font-semibold text-[var(--adm-ink)]">
          Halaman Populer
        </h2>
        {stats.halamanPopuler.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--adm-ink-2)]">Belum ada data.</p>
        ) : (
          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--adm-rule)] text-left text-[var(--adm-ink-2)]">
                <th scope="col" className="py-2">
                  Halaman
                </th>
                <th scope="col" className="py-2 text-right">
                  Kunjungan
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.halamanPopuler.map((h) => (
                <tr key={h.path} className="border-b border-neutral-100">
                  <td className="py-2 font-mono text-xs text-[var(--adm-ink-2)]">{h.path}</td>
                  <td className="py-2 text-right font-medium">{h.jumlah}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
