import { SectionHeading } from "@/components/ui/SectionHeading";
import { listSubscribers } from "@/lib/services/subscriber";
import { formatDateTime } from "@/lib/utils/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Subscriber Radio" };

export default async function SubscriberPage() {
  const subscribers = await listSubscribers();

  return (
    <div className="space-y-6">
      <SectionHeading as="h1">Subscriber Radio</SectionHeading>
      <p className="text-sm text-[var(--adm-ink-2)]">
        Data lokal (RadioSubscriber). Pendaftaran dilakukan warga melalui halaman
        Radio.
      </p>

      {subscribers.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-[var(--adm-rule)] bg-[var(--adm-surface)] p-6 text-sm text-[var(--adm-ink-2)]">
          Belum ada subscriber.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Daftar subscriber radio</caption>
            <thead>
              <tr className="border-b border-[var(--adm-rule)] text-left text-[var(--adm-ink-2)]">
                <th scope="col" className="py-2">
                  Nama
                </th>
                <th scope="col" className="py-2">
                  Email
                </th>
                <th scope="col" className="py-2">
                  Telepon
                </th>
                <th scope="col" className="py-2">
                  Status
                </th>
                <th scope="col" className="py-2">
                  Terdaftar
                </th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-b border-neutral-100">
                  <td className="py-2 font-medium text-[var(--adm-ink)]">{s.name}</td>
                  <td className="py-2 text-[var(--adm-ink-2)]">{s.email}</td>
                  <td className="py-2 text-[var(--adm-ink-2)]">{s.phone ?? "-"}</td>
                  <td className="py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        s.isActive
                          ? "bg-secondary-600/10 text-secondary-700"
                          : "bg-[var(--adm-surface-2)] text-[var(--adm-ink-2)]"
                      }`}
                    >
                      {s.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="py-2 text-[var(--adm-ink-2)]">
                    {formatDateTime(s.subscribedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
