import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "./sanitize";

describe("sanitizeHtml", () => {
  it("membuang tag <script>", () => {
    const out = sanitizeHtml('<p>ok</p><script>alert("x")</script>');
    expect(out).not.toContain("<script");
    expect(out).toContain("<p>ok</p>");
  });

  it("membuang atribut event on*", () => {
    const out = sanitizeHtml('<a href="#" onclick="evil()">x</a>');
    expect(out).not.toContain("onclick");
  });

  it("menetralkan protokol javascript:", () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain("javascript:");
  });

  it("menambahkan rel aman pada tautan eksternal", () => {
    const out = sanitizeHtml('<a href="https://example.go.id">x</a>');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it("mengembalikan string kosong untuk input kosong", () => {
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml(null)).toBe("");
  });
});
