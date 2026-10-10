import { describe, it, expect } from "vitest";
import { markdownAman, escapeHtml } from "@/lib/utils/markdown";
import { bersihkanPesanChat } from "@/lib/utils/sanitize";

describe("escapeHtml", () => {
  it("meng-escape semua karakter berbahaya", () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });
});

describe("markdownAman", () => {
  it("menampilkan HTML dari AI sebagai teks (bukan tag hidup)", () => {
    const html = markdownAman('<script>alert(1)</script><img src=x onerror=alert(1)>');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img");
  });

  it("mendukung bold + daftar + tautan https", () => {
    const html = markdownAman("Buka **/reservasi**\n\n- opsi satu\n- opsi dua\n\nhttps://hstkab.go.id");
    expect(html).toContain("<strong>/reservasi</strong>");
    expect(html).toContain("<ul");
    expect(html).toContain("<li>");
    expect(html).toContain('href="https://hstkab.go.id"');
  });

  it("menautkan rute internal portal yang berdiri sendiri", () => {
    const html = markdownAman("Cek /reservasi/status ya");
    expect(html).toContain('href="/reservasi/status"');
  });

  it("menolak URL dgn entity kutip (cegah lolos dari atribut href)", () => {
    // Penyerang menaruh tanda kutip pada URL markdown. URL ditolak jadi
    // tautan (hanya teks), jadi tak ada atribut href yang bisa dibobol.
    const html = markdownAman('[klik](https://jahat.example.com/x"onmouseover="alert(1))');
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("onmouseover=\"");
  });

  it("menolak URL dgn tanda kurung sudut (cegah pecah tag)", () => {
    const html = markdownAman("[x](https://jahat.example.com/<img src=x onerror=alert(1)>)");
    // Tidak ada tag <img> hidup; karakter sudut tetap ter-escape sebagai teks.
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});

describe("bersihkanPesanChat (server = klien)", () => {
  it("membuang script dan memotong panjang 1000", () => {
    expect(bersihkanPesanChat('halo<script>alert(1)</script>')).toBe("halo");
    expect(bersihkanPesanChat("x".repeat(5000)).length).toBe(1000);
  });

  it("membuang tag dan javascript:", () => {
    const out = bersihkanPesanChat('<a href="javascript:alert(1)">klik</a>');
    expect(out).toBe("klik");
  });
});
