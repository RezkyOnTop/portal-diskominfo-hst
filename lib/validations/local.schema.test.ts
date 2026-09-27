import { describe, it, expect } from "vitest";
import {
  ServiceSurveyInputSchema,
  hitungIkm,
  mutuPelayanan,
  labelMutu,
  IKM_UNSUR,
  IKM_SKALA,
  LAYANAN_SURVEI,
} from "./local.schema";

describe("hitungIkm (rumus PermenPANRB 14/2017)", () => {
  it("semua unsur 4 (Sangat Baik) -> IKM 100", () => {
    expect(hitungIkm([4, 4, 4, 4, 4, 4, 4, 4, 4])).toBe(100);
  });

  it("semua unsur 3 (Baik) -> IKM 75", () => {
    expect(hitungIkm([3, 3, 3, 3, 3, 3, 3, 3, 3])).toBe(75);
  });

  it("semua unsur 1 (Tidak Baik) -> IKM 25", () => {
    expect(hitungIkm([1, 1, 1, 1, 1, 1, 1, 1, 1])).toBe(25);
  });

  it("campuran dihitung sebagai rata-rata × 25", () => {
    // 4×4 + 5×3 = 31 -> rata-rata 3.444… -> 86.11
    expect(hitungIkm([4, 4, 4, 4, 3, 3, 3, 3, 3])).toBe(86.11);
    // 5×4 + 4×3 = 32 -> rata-rata 3.555… -> 88.89
    expect(hitungIkm([4, 4, 4, 4, 4, 3, 3, 3, 3])).toBe(88.89);
  });

  it("array kosong -> 0 (tidak NaN)", () => {
    expect(hitungIkm([])).toBe(0);
  });

  it("membulatkan ke 2 desimal", () => {
    const v = hitungIkm([4, 3, 4, 3, 4, 3, 4, 3, 4]); // rata-rata 3.555... -> 88.89
    expect(v).toBe(88.89);
    expect(Number.isInteger(v * 100)).toBe(true);
  });
});

describe("mutuPelayanan (ambang batas)", () => {
  it("A untuk >= 88.31", () => {
    expect(mutuPelayanan(88.31)).toBe("A");
    expect(mutuPelayanan(100)).toBe("A");
  });
  it("B untuk 76.61–88.30", () => {
    expect(mutuPelayanan(88.3)).toBe("B");
    expect(mutuPelayanan(76.61)).toBe("B");
  });
  it("C untuk 65–76.60", () => {
    expect(mutuPelayanan(76.6)).toBe("C");
    expect(mutuPelayanan(65)).toBe("C");
  });
  it("D untuk < 65", () => {
    expect(mutuPelayanan(64.99)).toBe("D");
    expect(mutuPelayanan(25)).toBe("D");
  });
});

describe("labelMutu", () => {
  it("menerjemahkan kode mutu ke label panjang", () => {
    expect(labelMutu("A")).toBe("Sangat Baik");
    expect(labelMutu("B")).toBe("Baik");
    expect(labelMutu("C")).toBe("Kurang Baik");
    expect(labelMutu("D")).toBe("Tidak Baik");
    expect(labelMutu("X")).toBe("Tidak Baik");
  });
});

describe("konstanta IKM", () => {
  it("memuat tepat 9 unsur dengan key u1..u9", () => {
    expect(IKM_UNSUR).toHaveLength(9);
    expect(IKM_UNSUR.map((u) => u.key)).toEqual([
      "u1",
      "u2",
      "u3",
      "u4",
      "u5",
      "u6",
      "u7",
      "u8",
      "u9",
    ]);
  });

  it("skala bernilai 1–4 dengan label", () => {
    expect(IKM_SKALA.map((s) => s.value)).toEqual([1, 2, 3, 4]);
    expect(IKM_SKALA[3]!.label).toBe("Sangat Baik");
  });

  it("daftar layanan survei tidak kosong", () => {
    expect(LAYANAN_SURVEI.length).toBeGreaterThan(0);
  });
});

describe("ServiceSurveyInputSchema", () => {
  const valid = {
    layanan: "Layanan Data & Statistik",
    u1: 4,
    u2: 3,
    u3: 4,
    u4: 4,
    u5: 3,
    u6: 4,
    u7: 4,
    u8: 3,
    u9: 4,
    saran: "Tingkatkan kecepatan.",
    nama: "Budi",
    kontak: "budi@example.com",
  };

  it("menerima input valid", () => {
    expect(ServiceSurveyInputSchema.safeParse(valid).success).toBe(true);
  });

  it("menolak skor di luar 1–4", () => {
    expect(ServiceSurveyInputSchema.safeParse({ ...valid, u1: 0 }).success).toBe(false);
    expect(ServiceSurveyInputSchema.safeParse({ ...valid, u2: 5 }).success).toBe(false);
  });

  it("menolak skor non-integer", () => {
    expect(ServiceSurveyInputSchema.safeParse({ ...valid, u3: 3.5 }).success).toBe(false);
  });

  it("menolak layanan kosong/terlalu pendek", () => {
    expect(ServiceSurveyInputSchema.safeParse({ ...valid, layanan: "ab" }).success).toBe(false);
  });

  it("menerima field opsional kosong", () => {
    const r = ServiceSurveyInputSchema.safeParse({
      ...valid,
      saran: "",
      nama: "",
      kontak: "",
    });
    expect(r.success).toBe(true);
  });

  it("menolak saran melebihi 1000 karakter", () => {
    const r = ServiceSurveyInputSchema.safeParse({ ...valid, saran: "x".repeat(1001) });
    expect(r.success).toBe(false);
  });

  it("menolak bila unsur kurang (u9 tidak ada)", () => {
    const tanpaU9: Record<string, unknown> = { ...valid };
    delete tanpaU9.u9;
    expect(ServiceSurveyInputSchema.safeParse(tanpaU9).success).toBe(false);
  });
});
