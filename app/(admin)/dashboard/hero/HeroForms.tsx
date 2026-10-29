"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  createHeroSlideAction,
  deleteHeroSlideAction,
  updateHeroSlideAction,
  type HeroActionState,
} from "./actions";

const inputCls =
  "w-full rounded-md border border-[var(--adm-rule)] bg-[var(--adm-surface)] px-2.5 py-1.5 text-sm border-[var(--adm-rule)] bg-[var(--adm-surface)] text-[var(--adm-ink)]";

function PesanHasil({ state }: { state: HeroActionState | null }) {
  if (!state) return null;
  return (
    <p
      role="status"
      aria-live="polite"
      className={`text-xs ${state.ok ? "text-secondary-700 dark:text-secondary-300" : "text-danger-600"}`}
    >
      {state.message}
      {state.fieldErrors ? (
        <ul className="mt-1 list-disc pl-4">
          {Object.entries(state.fieldErrors).map(([k, v]) => (
            <li key={k}>
              {k}: {v.join("; ")}
            </li>
          ))}
        </ul>
      ) : null}
    </p>
  );
}

/** Form tambah slide hero baru (dashboard admin). */
export function HeroCreateForm() {
  const [state, formAction, pending] = useActionState<HeroActionState | null, FormData>(
    createHeroSlideAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-3 rounded-[var(--radius-card)] border border-[var(--adm-rule)] bg-[var(--adm-surface)] p-5 shadow-[var(--shadow-card)] border-[var(--adm-rule)] bg-[var(--adm-surface)]">
      <h2 className="font-heading text-base font-bold text-[var(--adm-ink)]">
        Tambah Slide
      </h2>
      <p className="text-xs text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
        Tambahkan slide dulu, lalu unggah fotonya lewat tombol <strong>Ubah</strong> pada daftar.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="baru-label" className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Keterangan foto *
          </label>
          <input id="baru-label" name="label" required maxLength={160} placeholder="cth. Monumen Kabupaten HST" className={inputCls} />
        </div>
        <div>
          <label htmlFor="baru-urutan" className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Urutan tampil (kecil lebih dulu)
          </label>
          <input id="baru-urutan" name="urutan" type="number" min={0} max={9999} defaultValue={0} className={inputCls} />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Tambah Slide"}
      </Button>
      <PesanHasil state={state} />
    </form>
  );
}

export interface HeroSlideRow {
  id: string;
  label: string;
  fotoUrl: string | null;
  urutan: number;
  aktif: boolean;
}

/**
 * Direktori slide hero (dashboard admin), daftar ringkas + dialog ubah.
 * Form ubah/foto/hapus HANYA dirender saat dialog dibuka untuk satu slide,
 * sehingga daftar awal tetap ringan.
 */
export function HeroDirectory({ rows }: { rows: HeroSlideRow[] }) {
  const [terbuka, setTerbuka] = useState<HeroSlideRow | null>(null);

  useEffect(() => {
    if (!terbuka) return;
    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setTerbuka(null);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = asal;
      window.removeEventListener("keydown", onKey);
    };
  }, [terbuka]);

  if (rows.length === 0) {
    return (
      <p className="rounded-[var(--radius-card)] border border-dashed border-[var(--adm-rule)] bg-[var(--adm-surface)] p-6 text-sm text-[var(--adm-ink-2)] border-[var(--adm-rule)] bg-[var(--adm-surface)] text-[var(--adm-muted)]">
        Belum ada slide. Tambahkan lewat formulir di atas.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-[var(--adm-rule)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--adm-rule)] bg-[var(--adm-surface)] shadow-[var(--shadow-card)] divide-[var(--adm-rule)] border-[var(--adm-rule)] bg-[var(--adm-surface)]">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--adm-surface-2)]">
            <span className="grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-[var(--adm-surface-2)] text-[10px] text-[var(--adm-muted)] bg-[var(--adm-surface-2)] text-[var(--adm-muted)]">
              {r.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.fotoUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <span aria-hidden="true">tanpa foto</span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-[var(--adm-ink)]">
                {r.label}
              </span>
              <span className="block text-xs text-[var(--adm-muted)]">
                Urutan {r.urutan}
                {r.fotoUrl ? "" : " · foto belum diunggah (dilewati di slideshow)"}
              </span>
            </span>
            <span
              className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline ${
                r.aktif
                  ? "bg-secondary-600/10 text-secondary-700 dark:text-secondary-300"
                  : "bg-neutral-200 text-[var(--adm-ink-2)] text-[var(--adm-ink-2)]"
              }`}
            >
              {r.aktif ? "Tampil" : "Sembunyi"}
            </span>
            <Button type="button" size="sm" variant="secondary" onClick={() => setTerbuka(r)}>
              Ubah
            </Button>
          </li>
        ))}
      </ul>

      {terbuka ? <HeroDialog row={terbuka} onTutup={() => setTerbuka(null)} /> : null}
    </div>
  );
}

/** Dialog ubah data + foto + hapus untuk satu slide. */
function HeroDialog({ row, onTutup }: { row: HeroSlideRow; onTutup: () => void }) {
  useEffect(() => {
    document.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onTutup();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Ubah slide ${row.label}`}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[var(--adm-radius)] border border-[var(--adm-rule)] bg-[var(--adm-surface)] p-5 shadow-[var(--adm-shadow-1)] border-[var(--adm-rule)] bg-[var(--adm-surface)]"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-base font-bold text-[var(--adm-ink)]" tabIndex={-1} data-autofocus>
            Ubah slide
          </h3>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup dialog"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--adm-muted)] hover:bg-[var(--adm-surface-2)]"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <HeroUbahForm row={row} />
          <HeroFotoForm id={row.id} adaFoto={Boolean(row.fotoUrl)} />
          <HeroHapusForm row={row} />
        </div>
      </div>
    </div>
  );
}

/** Form ubah data satu slide (di dalam dialog). */
function HeroUbahForm({ row }: { row: HeroSlideRow }) {
  const [state, formAction, pending] = useActionState<HeroActionState | null, FormData>(
    updateHeroSlideAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={row.id} />
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`label-${row.id}`} className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Keterangan foto
          </label>
          <input id={`label-${row.id}`} name="label" required maxLength={160} defaultValue={row.label} className={inputCls} />
        </div>
        <div>
          <label htmlFor={`urutan-${row.id}`} className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Urutan
          </label>
          <input id={`urutan-${row.id}`} name="urutan" type="number" min={0} max={9999} defaultValue={row.urutan} className={inputCls} />
        </div>
        <div>
          <label htmlFor={`aktif-${row.id}`} className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Tampil di slideshow
          </label>
          <select id={`aktif-${row.id}`} name="aktif" defaultValue={row.aktif ? "true" : "false"} className={inputCls}>
            <option value="true">Ya, tampilkan</option>
            <option value="false">Sembunyikan</option>
          </select>
        </div>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan Perubahan"}
      </Button>
      <PesanHasil state={state} />
    </form>
  );
}

/** Form hapus satu slide (di dalam dialog). */
function HeroHapusForm({ row }: { row: HeroSlideRow }) {
  const [state, formAction, pending] = useActionState<HeroActionState | null, FormData>(
    deleteHeroSlideAction,
    null,
  );

  return (
    <form
      action={formAction}
      className="border-t border-neutral-100 pt-3 border-[var(--adm-rule)]"
      onSubmit={(e) => {
        if (!window.confirm(`Hapus slide "${row.label}"? Fotonya ikut terhapus.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={row.id} />
      <Button type="submit" size="sm" variant="danger" disabled={pending}>
        {pending ? "Menghapus…" : "Hapus Slide"}
      </Button>
      <PesanHasil state={state} />
    </form>
  );
}

/** Form unggah/ganti foto + hapus foto slide. */
function HeroFotoForm({ id, adaFoto }: { id: string; adaFoto: boolean }) {
  const unggah = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("foto") as HTMLInputElement | null;
    const berkas = input?.files?.[0];
    if (!berkas) return;
    const fd = new FormData();
    fd.append("foto", berkas);
    const res = await fetch(`/api/hero/foto/${id}`, { method: "POST", body: fd });
    const pesan = form.querySelector<HTMLElement>("[data-pesan]");
    if (pesan) {
      pesan.textContent = res.ok ? "Foto tersimpan. Memuat ulang…" : "Gagal mengunggah foto.";
    }
    if (res.ok) window.location.reload();
  };

  const hapus = async () => {
    if (!window.confirm("Hapus foto? Slide ini akan dilewati di slideshow sampai foto baru diunggah.")) return;
    await fetch(`/api/hero/foto/${id}`, { method: "DELETE" });
    window.location.reload();
  };

  return (
    <form onSubmit={unggah} className="flex flex-wrap items-center gap-2 rounded-lg bg-[var(--adm-surface-2)] p-3 bg-[var(--adm-surface-2)]/60">
      <label htmlFor={`foto-${id}`} className="text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
        Foto {adaFoto ? "(sudah ada, unggah untuk mengganti)" : "(belum ada, slide dilewati di slideshow)"}
      </label>
      <input
        id={`foto-${id}`}
        name="foto"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="text-xs text-[var(--adm-ink-2)]"
      />
      <Button type="submit" size="sm" variant="secondary">
        Unggah Foto
      </Button>
      {adaFoto ? (
        <button
          type="button"
          onClick={hapus}
          className="rounded-md border border-[var(--adm-rule)] px-2.5 py-1.5 text-xs font-medium text-[var(--adm-ink-2)] hover:bg-[var(--adm-surface-2)] border-[var(--adm-rule)] text-[var(--adm-ink-2)]"
        >
          Hapus Foto
        </button>
      ) : null}
      <span data-pesan role="status" aria-live="polite" className="text-xs text-[var(--adm-ink-2)] text-[var(--adm-muted)]" />
    </form>
  );
}
