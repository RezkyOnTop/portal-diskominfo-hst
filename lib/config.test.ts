import { describe, it, expect, afterEach } from "vitest";
import {
  SITE,
  LAYANAN,
  BIDANG,
  NAV_MENU,
  LINK_TERKAIT,
  SOSIAL,
  RADIO_NAME,
  radioStreamUrl,
  OFFICE_COORDS,
  googleMapsEmbedUrl,
  googleMapsDirectionsUrl,
  googleMapsPlaceUrl,
} from "./config";

/** Kumpulkan seluruh href dari struktur menu (termasuk submenu). */
function allMenuHrefs(): string[] {
  const out: string[] = [];
  for (const item of NAV_MENU) {
    if (item.href) out.push(item.href);
    for (const child of item.children ?? []) {
      if (child.href) out.push(child.href);
    }
  }
  return out;
}

describe("config", () => {
  it("memuat kontak resmi sesuai situs", () => {
    expect(SITE.email).toBe("diskominfosp@hstkab.go.id");
    expect(SITE.address).toContain("Barabai");
    expect(SITE.address).toContain("71314");
  });

  it("semua tautan layanan diarahkan ke domain resmi hstkab.go.id", () => {
    for (const l of LAYANAN) {
      expect(l.href).toMatch(/hstkab\.go\.id/);
    }
  });

  it("LAYANAN tidak lagi memuat 'Lapor Bang Rizal'", () => {
    expect(LAYANAN.some((l) => l.name.includes("Lapor Bang Rizal"))).toBe(false);
  });

  it("BIDANG memuat Sekretariat + tiga bidang (total 4 unit kerja)", () => {
    expect(BIDANG).toHaveLength(4);
    expect(BIDANG[0]!.name).toBe("Sekretariat");
    const names = BIDANG.map((b) => b.name);
    expect(names).toContain("Bidang Informatika dan Persandian");
    expect(names).toContain("Bidang Komunikasi dan Informasi Publik");
    expect(names).toContain("Bidang Data dan Statistik");
    // Setiap unit punya deskripsi & ikon.
    for (const b of BIDANG) {
      expect(b.description.length).toBeGreaterThan(20);
      expect(b.icon.length).toBeGreaterThan(0);
    }
  });

  it("navigasi Profil tidak lagi memuat Struktur Organisasi / Data Pegawai", () => {
    const hrefs = allMenuHrefs();
    expect(hrefs).not.toContain("/profil/struktur-organisasi");
    expect(hrefs).not.toContain("/profil/data-pegawai");
  });

  it("helper Google Maps memakai koordinat kantor yang benar", () => {
    expect(OFFICE_COORDS).toEqual({ lat: -2.5986915, lng: 115.3938058 });

    const embed = googleMapsEmbedUrl();
    expect(embed).toContain("-2.5986915,115.3938058");
    expect(embed).toContain("output=embed");
    expect(embed).not.toContain("key="); // keyless, seperti situs lama
    expect(googleMapsEmbedUrl(12)).toContain("&z=12");

    expect(googleMapsDirectionsUrl()).toContain(
      "google.com/maps/dir/?api=1&destination=-2.5986915,115.3938058",
    );
    expect(googleMapsPlaceUrl()).toContain(
      "google.com/maps/search/?api=1&query=-2.5986915,115.3938058",
    );
  });

  it("navigasi memuat rute utama", () => {
    const hrefs = allMenuHrefs();
    expect(hrefs).toContain("/berita");
    expect(hrefs).toContain("/hoaks");
    expect(hrefs).toContain("/radio");
    expect(hrefs).toContain("/pengumuman");
    expect(hrefs).toContain("/layanan");
    expect(hrefs).toContain("/kontak");
  });

  it("link terkait & media sosial menunjuk domain tepercaya", () => {
    for (const l of [...LINK_TERKAIT, ...SOSIAL]) {
      expect(l.href).toMatch(/^https:\/\//);
    }
  });

  it("memakai nama radio resmi", () => {
    expect(RADIO_NAME).toContain("Swara Murakata");
  });

  describe("radioStreamUrl", () => {
    const original = process.env.RADIO_STREAM_URL;
    afterEach(() => {
      if (original === undefined) delete process.env.RADIO_STREAM_URL;
      else process.env.RADIO_STREAM_URL = original;
    });

    it("memakai env bila tersedia", () => {
      process.env.RADIO_STREAM_URL = "https://stream.example/radio";
      expect(radioStreamUrl()).toBe("https://stream.example/radio");
    });

    it("fallback ke halaman radio resmi", () => {
      delete process.env.RADIO_STREAM_URL;
      expect(radioStreamUrl()).toBe("https://radio.hstkab.go.id");
    });
  });
});
