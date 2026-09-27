import { describe, it, expect, afterEach } from "vitest";
import { SITE, LAYANAN, NAV_LINKS, radioStreamUrl } from "./config";

describe("config", () => {
  it("memuat kontak resmi", () => {
    expect(SITE.email).toBe("diskominfo@hstkab.go.id");
    expect(SITE.phone).toContain("0517");
    expect(SITE.address).toContain("Barabai");
  });

  it("semua tautan layanan diarahkan ke domain resmi", () => {
    for (const l of LAYANAN) {
      expect(l.href).toMatch(/hstkab\.go\.id|lapor\.go\.id/);
    }
  });

  it("navigasi memuat rute utama", () => {
    const hrefs = NAV_LINKS.map((n) => n.href);
    expect(hrefs).toContain("/berita");
    expect(hrefs).toContain("/hoaks");
    expect(hrefs).toContain("/radio");
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
