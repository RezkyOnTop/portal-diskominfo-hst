import { getSocialFeed } from "@/lib/services/social";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SITE } from "@/lib/config";

/**
 * SocialFeed — menampilkan feed media sosial resmi dari cache lokal
 * (SocialMediaCache). Bila cache kosong, tampilkan tautan ke Media Center HST.
 */
export async function SocialFeed() {
  const items = await getSocialFeed();

  return (
    <div>
      <SectionHeading>Media Sosial Resmi</SectionHeading>
      {items.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)]">
          <p className="text-sm text-neutral-600">
            Ikuti kanal resmi Diskominfo SP HST untuk informasi terbaru.
          </p>
          <a
            href="https://mediacenter.hstkab.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-primary-700 hover:underline"
          >
            Kunjungi Media Center HST ↗
          </a>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <li
              key={`${item.platform}-${i}`}
              className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)]"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                {item.platform}
              </p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block font-medium text-neutral-900 hover:text-primary-700"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-neutral-600">
        Sumber informasi resmi: {SITE.name}.
      </p>
    </div>
  );
}
