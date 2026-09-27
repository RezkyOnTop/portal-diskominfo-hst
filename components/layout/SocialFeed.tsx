import Image from "next/image";
import { getSocialFeed } from "@/lib/services/social";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SITE, SOSIAL } from "@/lib/config";

/** Format tanggal feed menjadi "17 Sep 2026". */
function formatTanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * SocialFeed — feed video resmi (kanal YouTube Media Center HST) dari cache
 * lokal (SocialMediaCache). Bila cache & upstream kosong, tampilkan tautan.
 */
export async function SocialFeed() {
  const items = await getSocialFeed();

  return (
    <div>
      <SectionHeading>Media Sosial Resmi</SectionHeading>
      {items.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-neutral-600 dark:text-slate-300">
            Ikuti kanal resmi Diskominfo SP HST untuk informasi terbaru.
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            {SOSIAL.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary-700 hover:underline dark:text-primary-300"
              >
                {s.name} ↗
              </a>
            ))}
          </div>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <li
              key={`${item.platform}-${item.url}-${i}`}
              className="overflow-hidden rounded-[var(--radius-card)] border border-neutral-200 bg-white shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900"
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                {item.imageUrl ? (
                  <div className="relative aspect-video w-full bg-neutral-100 dark:bg-slate-800">
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : null}
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
                    {item.platform}
                  </p>
                  <p className="mt-2 line-clamp-2 font-medium text-neutral-900 group-hover:text-primary-700 dark:text-slate-50 dark:group-hover:text-primary-300">
                    {item.title}
                  </p>
                  {item.date ? (
                    <p className="mt-2 text-xs text-neutral-500 dark:text-slate-400">
                      {formatTanggal(item.date)}
                    </p>
                  ) : null}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-neutral-600 dark:text-slate-400">
        Sumber informasi resmi: {SITE.fullName}.
      </p>
    </div>
  );
}
