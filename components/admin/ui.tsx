import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ============================================================================
 * Perangkat tampilan dashboard (server-safe, tanpa hook).
 *
 * Semua warna, radius, dan bayangan lewat token [data-admin] di admin.css ,
 * tidak ada nilai warna literal di kelas (Hallmark Floor 1). Angka selalu
 * tabular; tidak ada ikon di kartu statistik, tidak ada gradient.
 * ==========================================================================*/

const FOKUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--adm-focus)]";

/** Permukaan kartu: satu garis rambut + bayangan pendek. */
export function Panel({
  children,
  className,
  as: Tag = "section",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag
      className={cn(
        "rounded-[var(--adm-radius)] border border-[var(--adm-rule)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-1)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Judul kartu + keterangan + slot aksi. Tanpa ikon, tanpa label kapital. */
export function PanelHeader({
  title,
  desc,
  action,
}: {
  title: React.ReactNode;
  desc?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-heading text-[15px] font-semibold text-[var(--adm-ink)]">{title}</h2>
        {desc ? <p className="mt-0.5 text-[12px] text-[var(--adm-muted)]">{desc}</p> : null}
      </div>
      {action}
    </div>
  );
}

/**
 * Angka dan labelnya. Penekanannya hanya tipografi: label tenang,
 * angka besar dan tabular.
 */
export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  const teks = typeof value === "number" ? value.toLocaleString("id-ID") : value;
  return (
    <div className="rounded-[var(--adm-radius)] border border-[var(--adm-rule)] bg-[var(--adm-surface)] px-4 py-3.5">
      <p className="text-[13px] leading-snug text-[var(--adm-ink-2)]">{label}</p>
      <p className="mt-2 font-heading text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums text-[var(--adm-ink)]">
        {teks}
      </p>
      {hint ? <p className="mt-1.5 text-[12px] text-[var(--adm-muted)]">{hint}</p> : null}
    </div>
  );
}

const TOMBOL = {
  primary:
    "bg-[var(--adm-accent)] text-[var(--adm-accent-ink)] hover:opacity-90 active:opacity-80 motion-reduce:transition-none",
  secondary:
    "border border-[var(--adm-rule-strong)] text-[var(--adm-ink)] hover:bg-[var(--adm-surface-2)] active:bg-[var(--adm-surface-2)] motion-reduce:transition-none",
  ghost:
    "text-[var(--adm-ink-2)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)] motion-reduce:transition-none",
} as const;

/** Satu tombol terisi per layar; sisanya bergaris atau tipografis. */
export function ActionLink({
  href,
  children,
  variant = "secondary",
  withArrow = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof TOMBOL;
  withArrow?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-[var(--adm-radius-sm)] px-3.5 text-[13px] font-medium",
        "transition-colors duration-[var(--adm-dur-micro)]",
        TOMBOL[variant],
        FOKUS,
      )}
    >
      <span>{children}</span>
      {withArrow ? <ArrowRight className="size-3.5 shrink-0 opacity-70" aria-hidden /> : null}
    </Link>
  );
}

/** Unduh CSV: tautan tipografis kecil, bukan tombol kedua. */
export function ExportLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-[var(--adm-radius-sm)] px-2.5 text-[12px] font-medium",
        "text-[var(--adm-ink-2)] underline decoration-[var(--adm-rule-strong)] underline-offset-4",
        "transition-colors duration-[var(--adm-dur-micro)] hover:text-[var(--adm-ink)]",
        "motion-reduce:transition-none",
        FOKUS,
      )}
    >
      <Download className="size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </a>
  );
}

/** Baris daftar; pemisah datang dari divide-y pada <ul>, bukan dari kartu. */
export function ListRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <li className={cn("flex items-center justify-between gap-4 py-2.5", className)}>{children}</li>;
}
