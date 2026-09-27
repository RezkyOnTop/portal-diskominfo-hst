import { describe, it, expect } from "vitest";
import { toCsv, csvHeaders, namaBerkasCsv, escapeCsvValue, CSV_BOM } from "./csv";

describe("escapeCsvValue", () => {
  it("mengembalikan string apa adanya bila tidak perlu dikutip", () => {
    expect(escapeCsvValue("Budi")).toBe("Budi");
  });

  it("mengosongkan nilai null/undefined", () => {
    expect(escapeCsvValue(null)).toBe("");
    expect(escapeCsvValue(undefined)).toBe("");
  });

  it("membungkus nilai yang mengandung delimiter default (;)", () => {
    expect(escapeCsvValue("Barabai; HST")).toBe('"Barabai; HST"');
  });

  it("membungkus nilai yang mengandung koma saat delimiter koma", () => {
    expect(escapeCsvValue("Jl. Perintis, Barabai", ",")).toBe('"Jl. Perintis, Barabai"');
  });

  it("menggandakan tanda kutip di dalam nilai", () => {
    expect(escapeCsvValue('Kata "penting"', ";")).toBe('"Kata ""penting"""');
  });

  it("membungkus nilai yang mengandung baris baru", () => {
    expect(escapeCsvValue("baris satu\nbaris dua")).toBe('"baris satu\nbaris dua"');
  });

  it("mengubah Date menjadi ISO", () => {
    const d = new Date("2026-10-01T02:00:00.000Z");
    expect(escapeCsvValue(d)).toBe(d.toISOString());
  });
});

describe("toCsv", () => {
  it("memakai titik-koma sebagai pemisah default (locale Excel Indonesia)", () => {
    const csv = toCsv(["Nama", "Kota"], [["Budi", "Barabai"]]);
    expect(csv).toContain("Nama;Kota");
    expect(csv).toContain("Budi;Barabai");
  });

  it("mengawali dengan BOM UTF-8 agar Excel membaca karakter dengan benar", () => {
    expect(toCsv(["Nama"], [["Budi"]]).startsWith(CSV_BOM)).toBe(true);
  });

  it("mengakhiri baris dengan CRLF", () => {
    const csv = toCsv(["Nama"], [["Budi"]]);
    expect(csv).toBe(`${CSV_BOM}Nama\r\nBudi\r\n`);
  });

  it("menyusun header diikuti baris data", () => {
    const csv = toCsv(["A", "B"], [[1, 2]]);
    expect(csv).toBe(`${CSV_BOM}A;B\r\n1;2\r\n`);
  });

  it("mendukung penggantian delimiter", () => {
    const csv = toCsv(["A", "B"], [["x,y", "z"]], ",");
    expect(csv).toBe(`${CSV_BOM}A,B\r\n"x,y",z\r\n`);
  });

  it("mengosongkan sel null/undefined", () => {
    const csv = toCsv(["A", "B", "C"], [[null, undefined, ""]]);
    expect(csv).toBe(`${CSV_BOM}A;B;C\r\n;;\r\n`);
  });
});

describe("csvHeaders", () => {
  it("menyusun header Content-Type, Disposition, dan Cache-Control", () => {
    const h = csvHeaders("data.csv") as Record<string, string>;
    expect(h["Content-Type"]).toContain("text/csv");
    expect(h["Content-Type"]).toContain("utf-8");
    expect(h["Content-Disposition"]).toBe('attachment; filename="data.csv"');
    expect(h["Cache-Control"]).toBe("no-store");
  });
});

describe("namaBerkasCsv", () => {
  it("menyertakan prefix dan tanggal ISO, berakhiran .csv", () => {
    const nama = namaBerkasCsv("reservasi", new Date("2026-09-28T10:00:00.000Z"));
    expect(nama).toBe("reservasi-2026-09-28.csv");
  });

  it("memakai tanggal hari ini bila tidak diberikan", () => {
    const nama = namaBerkasCsv("subscriber");
    expect(nama).toMatch(/^subscriber-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
