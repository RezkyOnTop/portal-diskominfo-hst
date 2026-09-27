import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateUtc,
  formatDateTime,
  stripHtml,
  readingTimeMinutes,
} from "./format";

describe("formatDate", () => {
  it("memformat tanggal Media Center 'YYYY-MM-DD HH:mm:ss'", () => {
    expect(formatDate("2026-09-02 04:58:03")).toMatch(/2026/);
  });
  it("mengembalikan '-' untuk input kosong/tidak valid", () => {
    expect(formatDate("")).toBe("-");
    expect(formatDate(null)).toBe("-");
    expect(formatDate("bukan-tanggal")).toBe("-");
  });
});

describe("formatDateTime", () => {
  it("memformat tanggal + waktu", () => {
    expect(formatDateTime("2026-01-02 10:00:00")).toMatch(/2026/);
  });
  it("mengembalikan '-' untuk input kosong", () => {
    expect(formatDateTime(undefined)).toBe("-");
  });
});

describe("formatDateUtc", () => {
  it("menampilkan tanggal date-only tanpa pergeseran zona waktu", () => {
    // Tengah malam UTC tanggal 5 tetap tampil sebagai 5, apa pun zona server.
    expect(formatDateUtc("2026-10-05T00:00:00.000Z")).toBe("5 Oktober 2026");
  });

  it("menerima objek Date", () => {
    expect(formatDateUtc(new Date("2026-01-01T00:00:00.000Z"))).toBe("1 Januari 2026");
  });

  it("mengembalikan '-' untuk input kosong/tidak valid", () => {
    expect(formatDateUtc(null)).toBe("-");
    expect(formatDateUtc("bukan-tanggal")).toBe("-");
  });
});

describe("stripHtml", () => {
  it("membuang tag dan mendecode entitas dasar", () => {
    expect(stripHtml("<p>Halo&nbsp;Dunia</p>")).toBe("Halo Dunia");
  });
  it("memotong teks panjang dengan elipsis", () => {
    const long = "<p>" + "kata ".repeat(100) + "</p>";
    expect(stripHtml(long, 20).endsWith("…")).toBe(true);
  });
});

describe("readingTimeMinutes", () => {
  it("minimal 1 menit", () => {
    expect(readingTimeMinutes("<p>pendek</p>")).toBe(1);
    expect(readingTimeMinutes("")).toBe(1);
  });
  it("menghitung lebih dari 1 menit untuk teks panjang", () => {
    const words = Array.from({ length: 600 }, () => "kata").join(" ");
    expect(readingTimeMinutes(words)).toBeGreaterThanOrEqual(3);
  });
});
