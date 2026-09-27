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
      <p className="text-sm text-neutral-600">
        Data lokal (RadioSubscriber). Pendaftaran dilakukan warga melalui halaman
        Radio.
      </p>

      {subscribers.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          Belum ada subscriber.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Daftar subscriber radio</caption>
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-600">
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
                  <td className="py-2 font-medium text-neutral-900">{s.name}</td>
                  <td className="py-2 text-neutral-700">{s.email}</td>
                  <td className="py-2 text-neutral-700">{s.phone ?? "-"}</td>
                  <td className="py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        s.isActive
                          ? "bg-secondary-600/10 text-secondary-700"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {s.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="py-2 text-neutral-600">
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
