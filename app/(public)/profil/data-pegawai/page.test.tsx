import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/services/staff", () => ({
  listStaffPublik: vi.fn(async () => [
    {
      id: "s1",
      nama: "Darkuni, S.Hut",
      nip: null,
      jabatan: "Kepala Dinas",
      unit: "Kepala Dinas",
      fotoUrl: null, // tanpa foto -> avatar inisial (gambar default)
      urutan: 1,
      aktif: true,
    },
    {
      id: "s2",
      nama: "Budi Santoso, S.Kom",
      nip: "19900101 202001 1 001",
      jabatan: "Pranata Komputer Ahli Pertama",
      unit: "Staf PPPK",
      fotoUrl: "/api/pegawai/foto/s2", // dengan foto
      urutan: 10,
      aktif: true,
    },
  ]),
}));

import DataPegawaiPage from "./page";

/** Bantu: render server component dengan searchParams tertentu. */
async function render(sp: { cari?: string; unit?: string } = {}) {
  const el = await DataPegawaiPage({ searchParams: Promise.resolve(sp) });
  return renderToStaticMarkup(el as React.ReactElement);
}

describe("halaman publik /profil/data-pegawai", () => {
  it("menampilkan nama & jabatan pegawai dari database", async () => {
    const html = await render();
    expect(html).toContain("Darkuni, S.Hut");
    expect(html).toContain("Kepala Dinas");
    expect(html).toContain("Budi Santoso, S.Kom");
  });

  it("memakai avatar inisial (gambar default) bila fotoUrl kosong", async () => {
    const html = await render();
    // Inisial dari "Darkuni, S.Hut" -> "DA" (nama depan saja).
    expect(html).toContain(">DA<");
    // Pegawai tanpa NIP menampilkan keterangan.
    expect(html).toContain("NIP belum tersedia");
  });

  it("menampilkan foto & NIP bila tersedia", async () => {
    const html = await render();
    // next/image me-encode URL ke dalam srcSet (amp = &amp;).
    expect(html).toContain("api%2Fpegawai%2Ffoto%2Fs2");
    expect(html).toContain("19900101 202001 1 001");
  });

  it("menyaring berdasarkan kata kunci pencarian", async () => {
    const html = await render({ cari: "budi" });
    expect(html).toContain("Budi Santoso");
    expect(html).not.toContain("Darkuni, S.Hut");
  });

  it("menampilkan pesan kosong bila tidak ada yang cocok", async () => {
    const html = await render({ cari: "zzz-tidak-ada" });
    expect(html).toContain("Tidak ada pegawai yang cocok");
  });

  it("menyaring berdasarkan unit kerja", async () => {
    const html = await render({ unit: "Staf PPPK" });
    expect(html).toContain("Budi Santoso");
    expect(html).not.toContain("Darkuni, S.Hut");
  });
});
