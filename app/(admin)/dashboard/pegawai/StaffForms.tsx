"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { UNIT_PEGAWAI, FOTO_PEGAWAI_MAX_BYTES } from "@/lib/validations/local.schema";
import {
  createStaffAction,
  deleteStaffAction,
  updateStaffAction,
  type StaffActionState,
} from "./actions";

const inputCls =
  "w-full rounded-md border border-[var(--adm-rule)] bg-[var(--adm-surface)] px-2.5 py-1.5 text-sm border-[var(--adm-rule)] bg-[var(--adm-surface)] text-[var(--adm-ink)]";

function PesanHasil({ state }: { state: StaffActionState | null }) {
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

/** Form tambah pegawai baru (dashboard admin). */
export function StaffCreateForm() {
  const [state, formAction, pending] = useActionState<StaffActionState | null, FormData>(
    createStaffAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-3 rounded-[var(--radius-card)] border border-[var(--adm-rule)] bg-[var(--adm-surface)] p-5 shadow-[var(--shadow-card)] border-[var(--adm-rule)] bg-[var(--adm-surface)]">
      <h2 className="font-heading text-base font-bold text-[var(--adm-ink)]">
        Tambah Pegawai
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="baru-nama" className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Nama lengkap + gelar *
          </label>
          <input id="baru-nama" name="nama" required maxLength={160} placeholder="cth. Budi Santoso, S.Kom" className={inputCls} />
        </div>
        <div>
          <label htmlFor="baru-nip" className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            NIP / NIK (boleh kosong)
          </label>
          <input id="baru-nip" name="nip" maxLength={40} placeholder="cth. 19900101 202001 1 001" className={inputCls} />
        </div>
        <div>
          <label htmlFor="baru-jabatan" className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Jabatan / peran *
          </label>
          <input id="baru-jabatan" name="jabatan" required maxLength={160} placeholder="cth. Pranata Komputer Ahli Pertama" className={inputCls} />
        </div>
        <div>
          <label htmlFor="baru-unit" className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Unit kerja *
          </label>
          <select id="baru-unit" name="unit" className={inputCls} defaultValue="Staf PPPK">
            {UNIT_PEGAWAI.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="baru-urutan" className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Urutan tampil (kecil lebih dulu)
          </label>
          <input id="baru-urutan" name="urutan" type="number" min={0} max={9999} defaultValue={0} className={inputCls} />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Tambah Pegawai"}
      </Button>
      <PesanHasil state={state} />
    </form>
  );
}

export interface StaffRow {
  id: string;
  nama: string;
  nip: string | null;
  jabatan: string;
  unit: string;
  fotoUrl: string | null;
  urutan: number;
  aktif: boolean;
}

/**
 * Direktori pegawai (dashboard admin), pencarian + pengelompokan unit +
 * dialog ubah per baris.
 *
 * Form ubah/foto/hapus HANYA dirender saat dialog dibuka untuk satu pegawai,
 * sehingga daftar awal tinggal baris teks ringan (bukan ratusan input) dan
 * halaman tetap cepat walau pegawai bertambah banyak.
 */
export function StaffDirectory({ rows }: { rows: StaffRow[] }) {
  const [cari, setCari] = useState("");
  const [terbuka, setTerbuka] = useState<StaffRow | null>(null);

  const q = cari.trim().toLowerCase();
  const tersaring = q
    ? rows.filter(
        (r) =>
          r.nama.toLowerCase().includes(q) ||
          r.jabatan.toLowerCase().includes(q) ||
          (r.nip ?? "").toLowerCase().includes(q),
      )
    : rows;

  // Kunci scroll badan saat dialog terbuka; Esc menutup.
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="cari-pegawai" className="sr-only">
          Cari pegawai
        </label>
        <input
          id="cari-pegawai"
          type="search"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari nama, jabatan, atau NIP…"
          className={`${inputCls} max-w-sm`}
        />
        <span className="text-xs text-[var(--adm-muted)]" role="status" aria-live="polite">
          {tersaring.length} dari {rows.length} pegawai
        </span>
      </div>

      {tersaring.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-[var(--adm-rule)] bg-[var(--adm-surface)] p-6 text-sm text-[var(--adm-ink-2)] border-[var(--adm-rule)] bg-[var(--adm-surface)] text-[var(--adm-muted)]">
          Tidak ada pegawai yang cocok dengan “{cari}”.
        </p>
      ) : (
        UNIT_PEGAWAI.map((unit) => {
          const anggota = tersaring.filter((r) => r.unit === unit);
          if (anggota.length === 0) return null;
          return (
            <div key={unit}>
              <h2 className="mb-2 font-heading text-sm font-bold text-[var(--adm-ink)]">
                {unit}{" "}
                <span className="font-semibold text-[var(--adm-muted)]">
                  ({anggota.length})
                </span>
              </h2>
              <ul className="divide-y divide-[var(--adm-rule)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--adm-rule)] bg-[var(--adm-surface)] shadow-[var(--shadow-card)] divide-[var(--adm-rule)] border-[var(--adm-rule)] bg-[var(--adm-surface)]">
                {anggota.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--adm-surface-2)]"
                  >
                    {/* Thumb foto / inisial, <img> kecil agar ringan */}
                    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--adm-accent-soft)] text-xs font-bold text-[var(--adm-accent)] dark:text-primary-300">
                      {r.fotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.fotoUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <span aria-hidden="true">{inisial(r.nama)}</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[var(--adm-ink)]">
                        {r.nama}
                      </span>
                      <span className="block truncate text-xs text-[var(--adm-muted)]">
                        {r.jabatan}
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
            </div>
          );
        })
      )}

      {terbuka ? <StaffDialog row={terbuka} onTutup={() => setTerbuka(null)} /> : null}
    </div>
  );
}

/** Inisial nama untuk thumb default (maks 2 huruf). */
function inisial(nama: string): string {
  const kata = nama.trim().split(/\s+/).filter(Boolean);
  if (kata.length === 0) return "?";
  if (kata.length === 1) return (kata[0]![0] ?? "?").toUpperCase();
  return `${kata[0]![0] ?? ""}${kata[kata.length - 1]![0] ?? ""}`.toUpperCase();
}

/** Dialog ubah data + foto + hapus untuk satu pegawai. */
function StaffDialog({ row, onTutup }: { row: StaffRow; onTutup: () => void }) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Fokus ke judul saat dibuka (aksesibilitas).
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onTutup();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Ubah data ${row.nama}`}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[var(--adm-radius)] border border-[var(--adm-rule)] bg-[var(--adm-surface)] p-5 shadow-[var(--adm-shadow-1)] border-[var(--adm-rule)] bg-[var(--adm-surface)]"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-base font-bold text-[var(--adm-ink)]" tabIndex={-1} data-autofocus>
            Ubah: {row.nama}
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
          <StaffUbahForm row={row} />
          <FotoForm id={row.id} adaFoto={Boolean(row.fotoUrl)} />
          <StaffHapusForm row={row} />
        </div>
      </div>
    </div>
  );
}

/** Form ubah data satu pegawai (di dalam dialog). */
function StaffUbahForm({ row }: { row: StaffRow }) {
  const [state, formAction, pending] = useActionState<StaffActionState | null, FormData>(
    updateStaffAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={row.id} />
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label htmlFor={`nama-${row.id}`} className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Nama
          </label>
          <input id={`nama-${row.id}`} name="nama" required maxLength={160} defaultValue={row.nama} className={inputCls} />
        </div>
        <div>
          <label htmlFor={`nip-${row.id}`} className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            NIP / NIK
          </label>
          <input id={`nip-${row.id}`} name="nip" maxLength={40} defaultValue={row.nip ?? ""} className={inputCls} />
        </div>
        <div>
          <label htmlFor={`jabatan-${row.id}`} className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Jabatan
          </label>
          <input id={`jabatan-${row.id}`} name="jabatan" required maxLength={160} defaultValue={row.jabatan} className={inputCls} />
        </div>
        <div>
          <label htmlFor={`unit-${row.id}`} className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Unit
          </label>
          <select id={`unit-${row.id}`} name="unit" defaultValue={row.unit} className={inputCls}>
            {UNIT_PEGAWAI.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`urutan-${row.id}`} className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Urutan
          </label>
          <input id={`urutan-${row.id}`} name="urutan" type="number" min={0} max={9999} defaultValue={row.urutan} className={inputCls} />
        </div>
        <div>
          <label htmlFor={`aktif-${row.id}`} className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Tampil di publik
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

/** Form hapus satu pegawai (di dalam dialog). */
function StaffHapusForm({ row }: { row: StaffRow }) {
  const [state, formAction, pending] = useActionState<StaffActionState | null, FormData>(
    deleteStaffAction,
    null,
  );

  return (
    <form
      action={formAction}
      className="border-t border-neutral-100 pt-3 border-[var(--adm-rule)]"
      onSubmit={(e) => {
        if (!window.confirm(`Hapus ${row.nama} dari data pegawai? Foto ikut terhapus.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={row.id} />
      <Button type="submit" size="sm" variant="danger" disabled={pending}>
        {pending ? "Menghapus…" : "Hapus Pegawai"}
      </Button>
      <PesanHasil state={state} />
    </form>
  );
}

/** Form unggah/ganti foto + hapus foto (kembali ke avatar default). */
function FotoForm({ id, adaFoto }: { id: string; adaFoto: boolean }) {
  const [pesan, setPesan] = useState<{ teks: string; galat: boolean } | null>(null);
  const [sibuk, setSibuk] = useState(false);

  const unggah = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sibuk) return;
    const form = e.currentTarget;
    const input = form.elements.namedItem("foto") as HTMLInputElement | null;
    const berkas = input?.files?.[0];

    // Tanpa berkas terpilih: BUKA jendela pemilih berkas (bukan memarahi
    // pengguna). Tombol "Unggah Foto" adalah langkah pertama yang wajar
    // ditekan orang, jadi ia harus memunculkan dialog pilih foto.
    if (!berkas) {
      setPesan({ teks: "Pilih berkas foto dari jendela yang terbuka…", galat: false });
      input?.click();
      return;
    }
    if (berkas.size > FOTO_PEGAWAI_MAX_BYTES) {
      setPesan({
        teks: `Foto ini ${(berkas.size / 1048576).toFixed(1)} MB, melebihi batas 2 MB. Kecilkan dulu.`,
        galat: true,
      });
      return;
    }

    setSibuk(true);
    setPesan({ teks: "Mengunggah…", galat: false });
    try {
      const fd = new FormData();
      fd.append("foto", berkas);
      const res = await fetch(`/api/pegawai/foto/${id}`, { method: "POST", body: fd });
      if (!res.ok) {
        // Tampilkan alasan dari server (2 MB / format / sesi), bukan pesan buta.
        let teks = "Gagal mengunggah foto.";
        try {
          const data: unknown = await res.json();
          if (data && typeof data === "object" && "message" in data) {
            const m = (data as { message?: unknown }).message;
            if (typeof m === "string" && m.trim()) teks = m;
          }
        } catch {
          /* balasan bukan JSON, pakai pesan bawaan */
        }
        if (res.status === 401) teks = "Sesi berakhir. Silakan masuk ulang.";
        setPesan({ teks, galat: true });
        return;
      }
      setPesan({ teks: "Foto tersimpan. Memuat ulang…", galat: false });
      window.location.reload();
    } catch {
      setPesan({ teks: "Tidak dapat menghubungi server. Coba lagi.", galat: true });
    } finally {
      setSibuk(false);
    }
  };

  const hapus = async () => {
    if (sibuk) return;
    if (!window.confirm("Hapus foto? Halaman publik kembali memakai avatar default.")) return;
    setSibuk(true);
    try {
      const res = await fetch(`/api/pegawai/foto/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setPesan({ teks: "Gagal menghapus foto.", galat: true });
        return;
      }
      window.location.reload();
    } catch {
      setPesan({ teks: "Tidak dapat menghubungi server. Coba lagi.", galat: true });
    } finally {
      setSibuk(false);
    }
  };

  return (
    <form onSubmit={unggah} className="flex flex-wrap items-center gap-2 rounded-lg bg-[var(--adm-surface-2)] p-3 bg-[var(--adm-surface-2)]/60">
      <label htmlFor={`foto-${id}`} className="text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
        Foto {adaFoto ? "(sudah ada, unggah untuk mengganti)" : "(belum ada, pakai avatar default)"}
      </label>
      <input
        id={`foto-${id}`}
        name="foto"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={sibuk}
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          if (!f) {
            setPesan(null);
            return;
          }
          if (f.size > FOTO_PEGAWAI_MAX_BYTES) {
            setPesan({
              teks: `Foto ini ${(f.size / 1048576).toFixed(1)} MB, melebihi batas 2 MB. Kecilkan dulu.`,
              galat: true,
            });
            return;
          }
          setPesan({
            teks: `Dipilih: ${f.name} (${Math.max(1, Math.round(f.size / 1024))} KB), tekan Unggah Foto.`,
            galat: false,
          });
        }}
        className="w-full max-w-full text-xs text-[var(--adm-ink-2)] file:mr-2 file:cursor-pointer file:rounded-md file:border-0 file:bg-[var(--adm-accent)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--adm-accent-ink)] hover:file:bg-[var(--adm-accent)] disabled:opacity-50 text-[var(--adm-ink-2)] sm:w-auto"
      />
      <Button type="submit" size="sm" variant="secondary" disabled={sibuk}>
        {sibuk ? "Mengunggah…" : "Unggah Foto"}
      </Button>
      {adaFoto ? (
        <button
          type="button"
          onClick={hapus}
          disabled={sibuk}
          className="rounded-md border border-[var(--adm-rule)] px-2.5 py-1.5 text-xs font-medium text-[var(--adm-ink-2)] hover:bg-[var(--adm-surface-2)] disabled:opacity-50 border-[var(--adm-rule)] text-[var(--adm-ink-2)]"
        >
          Hapus Foto
        </button>
      ) : null}
      <span
        data-pesan
        role="status"
        aria-live="polite"
        className={`text-xs ${pesan?.galat ? "text-danger-600" : "text-[var(--adm-ink-2)] text-[var(--adm-muted)]"}`}
      >
        {pesan?.teks ?? ""}
      </span>
    </form>
  );
}
