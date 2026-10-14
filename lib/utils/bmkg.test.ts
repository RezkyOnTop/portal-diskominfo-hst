import { describe, it, expect } from "vitest";
import { BMKG_ADM4_DEFAULT, bmkgLampiranUrl } from "@/lib/utils/bmkg";

describe("bmkgLampiranUrl", () => {
  it("membentuk URL prakiraan untuk kode wilayah default", () => {
    expect(bmkgLampiranUrl()).toBe(
      `https://www.bmkg.go.id/cuaca/prakiraan-cuaca/${BMKG_ADM4_DEFAULT}`,
    );
  });

  it("memakai kode wilayah yang diberikan", () => {
    expect(bmkgLampiranUrl("63.07.06.1002")).toBe(
      "https://www.bmkg.go.id/cuaca/prakiraan-cuaca/63.07.06.1002",
    );
  });

  it("kode wilayah default adalah Barabai Darat", () => {
    expect(BMKG_ADM4_DEFAULT).toBe("63.07.06.1001");
  });
});
