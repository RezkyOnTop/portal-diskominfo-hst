import { describe, it, expect, afterEach } from "vitest";
import {
  SITE,
  LAYANAN,
  NAV_MENU,
  LINK_TERKAIT,
  SOSIAL,
  RADIO_NAME,
  radioStreamUrl,
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

  it("semua tautan layanan diarahkan ke domain resmi", () => {
    for (const l of LAYANAN) {
      expect(l.href).toMatch(/hstkab\.go\.id|lapor\.go\.id/);
    }
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
