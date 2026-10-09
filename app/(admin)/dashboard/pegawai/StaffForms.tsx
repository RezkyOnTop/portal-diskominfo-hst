"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { UNIT_PEGAWAI } from "@/lib/validations/local.schema";
import {
  createStaffAction,
  deleteStaffAction,
  updateStaffAction,
  type StaffActionState,
} from "./actions";

const inputCls =
  "w-full rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

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
    <form action={formAction} className="space-y-3 rounded-[var(--radius-card)] border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
      <h2 className="font-heading text-base font-bold text-neutral-900 dark:text-slate-50">
        Tambah Pegawai
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="baru-nama" className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
            Nama lengkap + gelar *
          </label>
          <input id="baru-nama" name="nama" required maxLength={160} placeholder="cth. Budi Santoso, S.Kom" className={inputCls} />
        </div>
        <div>
          <label htmlFor="baru-nip" className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
            NIP / NIK (boleh kosong)
          </label>
          <input id="baru-nip" name="nip" maxLength={40} placeholder="cth. 19900101 202001 1 001" className={inputCls} />
        </div>
        <div>
          <label htmlFor="baru-jabatan" className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
            Jabatan / peran *
          </label>
          <input id="baru-jabatan" name="jabatan" required maxLength={160} placeholder="cth. Pranata Komputer Ahli Pertama" className={inputCls} />
        </div>
        <div>
          <label htmlFor="baru-unit" className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
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
          <label htmlFor="baru-urutan" className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
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

/** Form ubah data + hapus + unggah foto untuk satu pegawai. */
export function StaffRowForm({ row }: { row: StaffRow }) {
  const [ubahState, ubahAction, ubahPending] = useActionState<StaffActionState | null, FormData>(
    updateStaffAction,
    null,
  );
  const [hapusState, hapusAction, hapusPending] = useActionState<StaffActionState | null, FormData>(
    deleteStaffAction,
    null,
  );

  return (
    <div className="space-y-3">
      <form action={ubahAction} className="space-y-2">
        <input type="hidden" name="id" value={row.id} />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor={`nama-${row.id}`} className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
              Nama
            </label>
            <input id={`nama-${row.id}`} name="nama" required maxLength={160} defaultValue={row.nama} className={inputCls} />
          </div>
          <div>
            <label htmlFor={`nip-${row.id}`} className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
              NIP / NIK
            </label>
            <input id={`nip-${row.id}`} name="nip" maxLength={40} defaultValue={row.nip ?? ""} className={inputCls} />
          </div>
          <div>
            <label htmlFor={`jabatan-${row.id}`} className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
              Jabatan
            </label>
            <input id={`jabatan-${row.id}`} name="jabatan" required maxLength={160} defaultValue={row.jabatan} className={inputCls} />
          </div>
          <div>
            <label htmlFor={`unit-${row.id}`} className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
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
            <label htmlFor={`urutan-${row.id}`} className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
              Urutan
            </label>
            <input id={`urutan-${row.id}`} name="urutan" type="number" min={0} max={9999} defaultValue={row.urutan} className={inputCls} />
          </div>
          <div>
            <label htmlFor={`aktif-${row.id}`} className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
              Tampil di publik
            </label>
            <select id={`aktif-${row.id}`} name="aktif" defaultValue={row.aktif ? "true" : "false"} className={inputCls}>
              <option value="true">Ya, tampilkan</option>
              <option value="false">Sembunyikan</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={ubahPending}>
            {ubahPending ? "Menyimpan…" : "Simpan Perubahan"}
          </Button>
        </div>
        <PesanHasil state={ubahState} />
      </form>

      <FotoForm id={row.id} adaFoto={Boolean(row.fotoUrl)} />

      <form
        action={hapusAction}
        className="border-t border-neutral-100 pt-2 dark:border-slate-800"
        onSubmit={(e) => {
          if (!window.confirm(`Hapus ${row.nama} dari data pegawai? Foto ikut terhapus.`)) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={row.id} />
        <Button type="submit" size="sm" variant="danger" disabled={hapusPending}>
          {hapusPending ? "Menghapus…" : "Hapus Pegawai"}
        </Button>
        <PesanHasil state={hapusState} />
      </form>
    </div>
  );
}

/** Form unggah/ganti foto + hapus foto (kembali ke avatar default). */
function FotoForm({ id, adaFoto }: { id: string; adaFoto: boolean }) {
  const unggah = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("foto") as HTMLInputElement | null;
    const berkas = input?.files?.[0];
    if (!berkas) return;
    const fd = new FormData();
    fd.append("foto", berkas);
    const res = await fetch(`/api/pegawai/foto/${id}`, { method: "POST", body: fd });
    const pesan = form.querySelector<HTMLElement>("[data-pesan]");
    if (pesan) {
      pesan.textContent = res.ok ? "Foto tersimpan. Memuat ulang…" : "Gagal mengunggah foto.";
    }
    if (res.ok) window.location.reload();
  };

  const hapus = async () => {
    if (!window.confirm("Hapus foto? Halaman publik kembali memakai avatar default.")) return;
    await fetch(`/api/pegawai/foto/${id}`, { method: "DELETE" });
    window.location.reload();
  };

  return (
    <form onSubmit={unggah} className="flex flex-wrap items-center gap-2 rounded-lg bg-neutral-50 p-3 dark:bg-slate-800/60">
      <label htmlFor={`foto-${id}`} className="text-xs font-semibold text-neutral-600 dark:text-slate-400">
        Foto {adaFoto ? "(sudah ada — unggah untuk mengganti)" : "(belum ada — pakai avatar default)"}
      </label>
      <input
        id={`foto-${id}`}
        name="foto"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="text-xs text-neutral-600 dark:text-slate-300"
      />
      <Button type="submit" size="sm" variant="secondary">
        Unggah Foto
      </Button>
      {adaFoto ? (
        <button
          type="button"
          onClick={hapus}
          className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300"
        >
          Hapus Foto
        </button>
      ) : null}
      <span data-pesan role="status" aria-live="polite" className="text-xs text-neutral-600 dark:text-slate-400" />
    </form>
  );
}
