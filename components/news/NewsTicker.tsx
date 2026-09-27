import Link from "next/link";
import type { Berita } from "@/types/media-center";

/**
 * NewsTicker — pita berita berjalan (marquee CSS). Berhenti saat di-hover
 * dan saat prefers-reduced-motion. Konten dari Media Center HST.
 */
export function NewsTicker({ items }: { items: Berita[] }) {
  if (items.length === 0) return null;
  // Gandakan daftar agar animasi marquee mulus (translateX -50%).
  const loop = [...items, ...items];

  return (
    <section
      aria-label="Berita terkini"
      className="relative overflow-hidden border-y border-white/10 bg-neutral-950 text-white"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4">
        <span className="flex shrink-0 items-center gap-2 py-3 pr-4 text-xs font-bold uppercase tracking-widest text-secondary-400">
          <span
            aria-hidden="true"
            className="animate-pulse-ring h-2 w-2 rounded-full bg-secondary-400"
          />
          Terkini
        </span>
        <div className="relative flex-1 overflow-hidden py-3">
          <ul className="marquee-track gap-8">
            {loop.map((b, i) => (
              <li key={`${b.id}-${i}`} className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/berita/${b.slug}`}
                  className="whitespace-nowrap text-sm text-neutral-300 hover:text-white"
                >
                  {b.title}
                </Link>
                <span aria-hidden="true" className="text-neutral-600">
                  •
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
