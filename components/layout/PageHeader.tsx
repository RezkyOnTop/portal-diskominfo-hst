import Link from "next/link";
import { Container } from "@/components/layout/Container";

interface Crumb {
  label: string;
  href?: string;
}

/** Header halaman dengan breadcrumb + judul (konsisten di seluruh situs). */
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
    <section className="border-b border-neutral-200 bg-gradient-to-b from-primary-800 to-primary-700 text-white">
      <Container className="py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-white/75">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-white">
                Beranda
              </Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.label} className="flex items-center gap-1.5">
                <span aria-hidden="true">/</span>
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
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary-200">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">{title}</h1>
        {children ? <div className="mt-3 max-w-3xl text-sm text-white/85">{children}</div> : null}
      </Container>
    </section>
  );
}
