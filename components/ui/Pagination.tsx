import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Bangun href untuk nomor halaman tertentu. */
  makeHref: (page: number) => string;
}

/** Paginasi aksesibel dengan label yang jelas. */
export function Pagination({ page, totalPages, makeHref }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav aria-label="Navigasi halaman" className="mt-10 flex justify-center">
      <ul className="flex items-center gap-1">
        <li>
          <Link
            href={makeHref(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={cn(
              "rounded-md border border-neutral-200 px-3 py-2 text-sm",
              page <= 1
                ? "pointer-events-none opacity-50"
                : "hover:bg-neutral-50",
            )}
          >
            Sebelumnya
          </Link>
        </li>
        {pages.map((p, idx) => (
          <li key={p} className="flex items-center">
            {idx > 0 && pages[idx - 1] !== p - 1 ? (
              <span className="px-2 text-neutral-400">…</span>
            ) : null}
            <Link
              href={makeHref(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "min-w-9 rounded-md border px-3 py-2 text-center text-sm",
                p === page
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-neutral-200 hover:bg-neutral-50",
              )}
            >
              {p}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href={makeHref(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={cn(
              "rounded-md border border-neutral-200 px-3 py-2 text-sm",
              page >= totalPages
                ? "pointer-events-none opacity-50"
                : "hover:bg-neutral-50",
            )}
          >
            Berikutnya
          </Link>
        </li>
      </ul>
    </nav>
  );
}
