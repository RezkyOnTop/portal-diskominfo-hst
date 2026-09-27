import { describe, it, expect } from "vitest";
import {
  BeritaListSchema,
  PengumumanListSchema,
} from "./media-center.schema";

describe("BeritaListSchema (validasi respons API Media Center)", () => {
  it("menerima respons valid dengan field wajib", () => {
    const payload = [
      {
        id_berita: "1401",
        tanggal: "2026-09-02 04:58:03",
        title: "Judul Berita",
        isi: "<p>Isi</p>",
        foto: "foto.jpg",
        link: "",
        slug: "judul-berita",
        author: "",
        kategori_id: "Pemerintahan",
      },
    ];
    const parsed = BeritaListSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data[0]!.id_berita).toBe("1401");
    }
  });

  it("memberi default pada field opsional yang hilang", () => {
    const payload = [
      { id_berita: 5, tanggal: "2026-01-01 00:00:00", title: "T", slug: "s" },
    ];
    const parsed = BeritaListSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data[0]!.kategori_id).toBe("Umum");
      expect(parsed.data[0]!.foto).toBe("");
    }
  });

  it("menolak item tanpa title", () => {
    const payload = [{ id_berita: "1", tanggal: "2026-01-01 00:00:00", slug: "s" }];
    expect(BeritaListSchema.safeParse(payload).success).toBe(false);
  });

  it("menolak bila bukan array", () => {
    expect(BeritaListSchema.safeParse({ data: [] }).success).toBe(false);
  });
});

describe("PengumumanListSchema", () => {
  it("menerima respons valid", () => {
    const payload = [
      {
        id_pengumuman: "48",
        tanggal: "2026-09-07 23:09:16",
        title: "Pengumuman",
        slug: "pengumuman",
        isi: "<p>x</p>",
        link: "https://example.go.id",
      },
    ];
    expect(PengumumanListSchema.safeParse(payload).success).toBe(true);
  });
});
