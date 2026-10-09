import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => ({ user: { email: "a@b.c" } })) }));

import { StaffDirectory } from "./StaffForms";

const ROWS = [
  {
    id: "s1",
    nama: "Darkuni, S.Hut",
    nip: null,
    jabatan: "Kepala Dinas",
    unit: "Kepala Dinas",
    fotoUrl: null,
    urutan: 1,
    aktif: true,
  },
  {
    id: "s2",
    nama: "Budi Santoso, S.Kom",
    nip: "19900101 202001 1 001",
    jabatan: "Pranata Komputer Ahli Pertama",
    unit: "Staf PPPK",
    fotoUrl: "/api/pegawai/foto/s2",
    urutan: 10,
    aktif: false,
  },
];

describe("StaffDirectory (dashboard)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("menampilkan baris ringkas tanpa form di DOM awal (hemat)", () => {
    const { container } = render(<StaffDirectory rows={ROWS} />);
    // Hanya satu input: kotak pencarian. Tidak ada 6 input per pegawai.
    expect(container.querySelectorAll("input").length).toBe(1);
    expect(screen.getByText("Darkuni, S.Hut")).toBeInTheDocument();
    expect(screen.getByText("Budi Santoso, S.Kom")).toBeInTheDocument();
    // Belum ada dialog / form ubah.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("menyaring baris lewat kotak pencarian", async () => {
    const user = userEvent.setup();
    render(<StaffDirectory rows={ROWS} />);
    await user.type(screen.getByLabelText(/cari pegawai/i), "budi");
    expect(screen.getByText("Budi Santoso, S.Kom")).toBeInTheDocument();
    expect(screen.queryByText("Darkuni, S.Hut")).not.toBeInTheDocument();
    expect(screen.getByText(/1 dari 2 pegawai/i)).toBeInTheDocument();
  });

  it("membuka dialog ubah saat tombol Ubah diklik, lalu menutupnya", async () => {
    const user = userEvent.setup();
    render(<StaffDirectory rows={ROWS} />);
    await user.click(screen.getAllByRole("button", { name: "Ubah" })[0]!);

    const dialog = screen.getByRole("dialog", { name: /Ubah data Darkuni/i });
    expect(dialog).toBeInTheDocument();
    // Form ubah untuk pegawai ini baru dirender sekarang.
    expect(within(dialog).getByLabelText("Nama")).toHaveValue("Darkuni, S.Hut");
    expect(within(dialog).getByRole("button", { name: /Hapus Pegawai/i })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /tutup dialog/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("menampilkan status tampil/sembunyi", () => {
    render(<StaffDirectory rows={ROWS} />);
    expect(screen.getByText("Tampil")).toBeInTheDocument();
    expect(screen.getByText("Sembunyi")).toBeInTheDocument();
  });
});
