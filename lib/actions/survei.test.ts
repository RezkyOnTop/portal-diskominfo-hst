import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/services/survey", () => ({
  createSurvey: vi.fn(),
}));

import { submitSurveyAction } from "@/lib/actions/survei";
import { createSurvey } from "@/lib/services/survey";

const mock = createSurvey as unknown as ReturnType<typeof vi.fn>;

function fd(data: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.set(k, v);
  return f;
}

const JAWABAN = {
  layanan: "Layanan Informasi",
  u1: "4", u2: "4", u3: "3", u4: "4", u5: "4",
  u6: "3", u7: "4", u8: "4", u9: "4",
  saran: "Tingkatkan kecepatan.",
  nama: "Rina",
  kontak: "0812000000",
};

describe("submitSurveyAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mengubah nilai form menjadi angka dan mengembalikan IKM saat sukses", async () => {
    mock.mockResolvedValue({ ok: true, ikm: 87.5, mutu: "B" });
    const res = await submitSurveyAction(fd(JAWABAN));

    expect(res.ok).toBe(true);
    expect(res.ikm).toBe(87.5);
    expect(res.mutu).toBe("B");
    expect(res.message).toMatch(/terima kasih/i);

    const arg = mock.mock.calls[0][0];
    expect(typeof arg.u1).toBe("number");
    expect(arg.u1).toBe(4);
    expect(arg.u9).toBe(4);
    expect(arg.layanan).toBe("Layanan Informasi");
  });

  it("mengisi kolom opsional dengan string kosong bila kosong", async () => {
    mock.mockResolvedValue({ ok: true, ikm: 80, mutu: "B" });
    await submitSurveyAction(fd({ ...JAWABAN, saran: "", nama: "", kontak: "" }));
    const arg = mock.mock.calls[0][0];
    expect(arg.saran).toBe("");
    expect(arg.nama).toBe("");
    expect(arg.kontak).toBe("");
  });

  it("meneruskan pesan kegagalan dari layanan", async () => {
    mock.mockResolvedValue({ ok: false, message: "Jawaban tidak lengkap." });
    const res = await submitSurveyAction(fd({ layanan: "X" }));
    expect(res.ok).toBe(false);
    expect(res.message).toBe("Jawaban tidak lengkap.");
    expect(res.ikm).toBeUndefined();
  });
});
