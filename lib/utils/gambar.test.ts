import { describe, expect, it } from "vitest";
import { gambarBerita } from "@/lib/utils/gambar";

describe("gambarBerita", () => {
  it("proxy host Media Center dgn lebar", () => {
    const src = "https://data-mediacenter.hstkab.go.id/assets/foto_brt/a.jpg";
    const hasil = gambarBerita(src, 800);
    expect(hasil).toContain("/api/gambar?url=");
    expect(hasil).toContain("w=800");
  });

  it("URL relatif dikembalikan apa adanya", () => {
    expect(gambarBerita("/brand/logo.svg", 800)).toBe("/brand/logo.svg");
  });

  it("host lain tidak diproksi", () => {
    const yt = "https://i.ytimg.com/vi/abc/hqdefault.jpg";
    expect(gambarBerita(yt, 800)).toBe(yt);
  });

  it("null/undefined -> null", () => {
    expect(gambarBerita(null, 800)).toBeNull();
    expect(gambarBerita(undefined, 800)).toBeNull();
    expect(gambarBerita("  ", 800)).toBeNull();
  });

  it("membulatkan lebar desimal", () => {
    const src = "https://data-mediacenter.hstkab.go.id/assets/foto_brt/a.jpg";
    expect(gambarBerita(src, 799.6)).toContain("w=800");
  });
});
