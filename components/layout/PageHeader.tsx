import Link from "next/link";
import { Container } from "@/components/layout/Container";

interface Crumb {
  label: string;
  href?: string;
}

/** Header halaman dengan breadcrumb + judul (konsisten dengan tema gelap). */
export function PageHeader({
  title,
  eyebrow,
  crumbs = [],
  children,
}: {
  title: string;
  eyebrow?: string;
  crumbs?: Crumb[];
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-mesh text-white">
      <div aria-hidden="true" className="absolute inset-0 bg-grid-dark opacity-50" />
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-primary-500/25 blur-3xl"
      />
      <Container className="relative py-12">
        <nav aria-label="Breadcrumb" className="text-xs text-neutral-400">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-white">
                Beranda
              </Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.label} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-neutral-600">
                  /
                </span>
                {c.href ? (
                  <Link href={c.href} className="hover:text-white">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-white">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        {eyebrow ? (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-200">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {children ? (
          <div className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-300">
            {children}
          </div>
        ) : null}
      </Container>
      <div aria-hidden="true" className="divider-gradient" />
    </section>
  );
}
