"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  DESC_USER_ROLE,
  LABEL_USER_ROLE,
  USER_ROLE,
  passwordLemah,
} from "@/lib/validations/local.schema";
import {
  changePasswordAction,
  createUserAction,
  deleteUserAction,
  updateUserAction,
  type UserActionState,
} from "./actions";

const inputCls =
  "w-full rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

function PesanHasil({ state }: { state: UserActionState | null }) {
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

/** Buat password acak yang mudah dibaca (dipakai tombol "Acak"). */
function passwordAcak(panjang = 12): string {
  const alfabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const angka = "23456789";
  let inti = "";
  for (let i = 0; i < panjang - 2; i += 1) {
    inti += alfabet[Math.floor(Math.random() * alfabet.length)];
  }
  // Pastikan ada angka agar tidak dianggap password lemah.
  return `${inti}${angka[Math.floor(Math.random() * angka.length)]}${
    alfabet[Math.floor(Math.random() * alfabet.length)]
  }`;
}

/** Form tambah akun pengguna baru (dashboard admin). */
export function UserCreateForm() {
  const [state, formAction, pending] = useActionState<UserActionState | null, FormData>(
    createUserAction,
    null,
  );
  const [password, setPassword] = useState("");
  const [lihat, setLihat] = useState(false);
  const lemah = password.length > 0 && passwordLemah(password);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-[var(--radius-card)] border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900"
    >
      <h2 className="font-heading text-base font-bold text-neutral-900 dark:text-slate-50">
        Tambah User
      </h2>
      <p className="text-xs text-neutral-600 dark:text-slate-400">
        Akun baru bisa langsung dipakai masuk di{" "}
        <code className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-slate-800">/masuk</code>.
        Password disimpan terenkripsi (hash bcrypt).
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="baru-nama" className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
            Nama tampilan *
          </label>
          <input
            id="baru-nama"
            name="nama"
            required
            maxLength={120}
            placeholder="cth. Administrator"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="baru-username" className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
            Username / email *
          </label>
          <input
            id="baru-username"
            name="username"
            required
            minLength={3}
            maxLength={160}
            autoComplete="off"
            placeholder="cth. admin"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="baru-password" className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
            Password *
          </label>
          <div className="flex gap-2">
            <input
              id="baru-password"
              name="password"
              type={lihat ? "text" : "password"}
              required
              minLength={3}
              maxLength={72}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setLihat((v) => !v)}
              aria-label={lihat ? "Sembunyikan password" : "Lihat password"}
              className="shrink-0 rounded-md border border-neutral-200 px-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {lihat ? "Sembunyi" : "Lihat"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPassword(passwordAcak());
                setLihat(true);
              }}
              className="shrink-0 rounded-md border border-neutral-200 px-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Acak
            </button>
          </div>
          {lemah ? (
            <p className="mt-1 text-xs text-warning-700 dark:text-warning-300">
              Password lemah — sebaiknya gunakan minimal 8 karakter dengan huruf &amp; angka.
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="baru-role" className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
            Peran *
          </label>
          <select id="baru-role" name="role" className={inputCls} defaultValue="EDITOR">
            {USER_ROLE.map((r) => (
              <option key={r} value={r}>
                {LABEL_USER_ROLE[r]} — {DESC_USER_ROLE[r]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Tambah User"}
      </Button>
      <PesanHasil state={state} />
    </form>
  );
}

export interface UserRow {
  id: string;
  username: string;
  nama: string;
  role: string;
  aktif: boolean;
  /** Akun utama dari environment — tidak bisa diubah/dihapus di sini. */
  bawaanSistem?: boolean;
}

/**
 * Direktori user (dashboard admin) — pencarian + daftar ringkas + dialog
 * ubah/ganti password/hapus per baris. Form hanya dirender saat dialog dibuka
 * agar halaman tetap ringan walau akun bertambah.
 */
export function UserDirectory({ rows }: { rows: UserRow[] }) {
  const [cari, setCari] = useState("");
  const [terbuka, setTerbuka] = useState<UserRow | null>(null);

  const q = cari.trim().toLowerCase();
  const tersaring = useMemo(
    () =>
      q
        ? rows.filter(
            (r) =>
              r.nama.toLowerCase().includes(q) ||
              r.username.toLowerCase().includes(q),
          )
        : rows,
    [q, rows],
  );

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
        <label htmlFor="cari-user" className="sr-only">
          Cari user
        </label>
        <input
          id="cari-user"
          type="search"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari nama atau username…"
          className={`${inputCls} max-w-sm`}
        />
        <span className="text-xs text-neutral-500 dark:text-slate-400" role="status" aria-live="polite">
          {tersaring.length} dari {rows.length} user
        </span>
      </div>

      {tersaring.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-neutral-200 bg-white p-6 text-sm text-neutral-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Tidak ada user yang cocok dengan “{cari}”.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-[var(--radius-card)] border border-neutral-200 bg-white shadow-[var(--shadow-card)] dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">
          {tersaring.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-neutral-50 dark:hover:bg-slate-800/60"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                <span aria-hidden="true">{inisial(r.nama)}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-neutral-900 dark:text-slate-100">
                  {r.nama}
                </span>
                <span className="block truncate text-xs text-neutral-500 dark:text-slate-400">
                  {r.username}
                </span>
              </span>
              <span
                className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline ${
                  r.role === "ADMIN"
                    ? "bg-primary-600/10 text-primary-700 dark:text-primary-300"
                    : "bg-neutral-200 text-neutral-700 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {LABEL_USER_ROLE[r.role as "ADMIN" | "EDITOR"] ?? r.role}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  r.aktif
                    ? "bg-secondary-600/10 text-secondary-700 dark:text-secondary-300"
                    : "bg-neutral-200 text-neutral-700 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {r.aktif ? "Aktif" : "Nonaktif"}
              </span>
              {r.bawaanSistem ? (
                <span className="shrink-0 rounded-full bg-warning-600/15 px-2 py-0.5 text-[11px] font-bold text-warning-700 dark:text-warning-300">
                  Bawaan
                </span>
              ) : (
                <Button type="button" size="sm" variant="secondary" onClick={() => setTerbuka(r)}>
                  Ubah
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {terbuka ? <UserDialog row={terbuka} onTutup={() => setTerbuka(null)} /> : null}
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

/** Dialog ubah data + ganti password + hapus untuk satu akun. */
function UserDialog({ row, onTutup }: { row: UserRow; onTutup: () => void }) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

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
        aria-label={`Ubah user ${row.nama}`}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-base font-bold text-neutral-900 dark:text-slate-50" tabIndex={-1} data-autofocus>
            Ubah: {row.nama}
          </h3>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup dialog"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <UserUbahForm row={row} />
          <UserPasswordForm row={row} />
          <UserHapusForm row={row} />
        </div>
      </div>
    </div>
  );
}

/** Form ubah data satu akun (di dalam dialog). */
function UserUbahForm({ row }: { row: UserRow }) {
  const [state, formAction, pending] = useActionState<UserActionState | null, FormData>(
    updateUserAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={row.id} />
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label htmlFor={`nama-${row.id}`} className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
            Nama
          </label>
          <input id={`nama-${row.id}`} name="nama" required maxLength={120} defaultValue={row.nama} className={inputCls} />
        </div>
        <div>
          <label htmlFor={`username-${row.id}`} className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
            Username / email
          </label>
          <input id={`username-${row.id}`} name="username" required minLength={3} maxLength={160} defaultValue={row.username} className={inputCls} />
        </div>
        <div>
          <label htmlFor={`role-${row.id}`} className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
            Peran
          </label>
          <select id={`role-${row.id}`} name="role" defaultValue={row.role} className={inputCls}>
            {USER_ROLE.map((r) => (
              <option key={r} value={r}>
                {LABEL_USER_ROLE[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`aktif-${row.id}`} className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
            Status akun
          </label>
          <select id={`aktif-${row.id}`} name="aktif" defaultValue={row.aktif ? "true" : "false"} className={inputCls}>
            <option value="true">Aktif (bisa masuk)</option>
            <option value="false">Nonaktif (diblokir)</option>
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

/** Form ganti password satu akun (di dalam dialog). */
function UserPasswordForm({ row }: { row: UserRow }) {
  const [state, formAction, pending] = useActionState<UserActionState | null, FormData>(
    changePasswordAction,
    null,
  );
  const [password, setPassword] = useState("");
  const [lihat, setLihat] = useState(false);
  const lemah = password.length > 0 && passwordLemah(password);

  return (
    <form
      action={formAction}
      className="space-y-2 border-t border-neutral-100 pt-3 dark:border-slate-800"
    >
      <input type="hidden" name="id" value={row.id} />
      <p className="text-xs font-semibold text-neutral-600 dark:text-slate-400">Ganti Password</p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1">
          <label htmlFor={`pw-${row.id}`} className="mb-1 block text-xs font-semibold text-neutral-600 dark:text-slate-400">
            Password baru
          </label>
          <input
            id={`pw-${row.id}`}
            name="password"
            type={lihat ? "text" : "password"}
            required
            minLength={3}
            maxLength={72}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        </div>
        <button
          type="button"
          onClick={() => setLihat((v) => !v)}
          className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {lihat ? "Sembunyi" : "Lihat"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPassword(passwordAcak());
            setLihat(true);
          }}
          className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Acak
        </button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Menyimpan…" : "Ganti Password"}
        </Button>
      </div>
      {lemah ? (
        <p className="text-xs text-warning-700 dark:text-warning-300">
          Password lemah — sebaiknya minimal 8 karakter dengan huruf &amp; angka.
        </p>
      ) : null}
      <PesanHasil state={state} />
    </form>
  );
}

/** Form hapus satu akun (di dalam dialog). */
function UserHapusForm({ row }: { row: UserRow }) {
  const [state, formAction, pending] = useActionState<UserActionState | null, FormData>(
    deleteUserAction,
    null,
  );

  return (
    <form
      action={formAction}
      className="border-t border-neutral-100 pt-3 dark:border-slate-800"
      onSubmit={(e) => {
        if (!window.confirm(`Hapus akun ${row.nama} (${row.username})? Tindakan ini permanen.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={row.id} />
      <Button type="submit" size="sm" variant="danger" disabled={pending}>
        {pending ? "Menghapus…" : "Hapus User"}
      </Button>
      <PesanHasil state={state} />
    </form>
  );
}
