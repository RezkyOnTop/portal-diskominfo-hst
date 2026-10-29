import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import {
  changeUserPassword,
  countUsers,
  createUser,
  deleteUser,
  getUserById,
  getUserByUsername,
  listUsers,
  updateUser,
  verifyUserLogin,
} from "./user";

const userMock = prisma.user as unknown as Record<string, ReturnType<typeof vi.fn>>;

/** Input valid yang bisa dimodifikasi per kasus uji. */
function inputValid(over: Record<string, unknown> = {}) {
  return {
    nama: "Administrator",
    username: "admin",
    password: "rahasia123",
    role: "ADMIN",
    ...over,
  };
}

describe("createUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menyimpan akun valid dengan password ter-hash (bukan polos)", async () => {
    userMock.create!.mockResolvedValue({ id: "u1" });
    const res = await createUser(inputValid());
    expect(res).toEqual({ ok: true, id: "u1" });
    const arg = userMock.create!.mock.calls[0]![0] as {
      data: { username: string; passwordHash: string; role: string };
    };
    expect(arg.data.username).toBe("admin");
    expect(arg.data.role).toBe("ADMIN");
    expect(arg.data.passwordHash).not.toBe("rahasia123");
    expect(arg.data.passwordHash).toMatch(/^\$2[aby]\$/); // hash bcrypt
  });

  it("menormalkan username jadi huruf kecil", async () => {
    userMock.create!.mockResolvedValue({ id: "u1" });
    await createUser(inputValid({ username: "  ADMIN  " }));
    const arg = userMock.create!.mock.calls[0]![0] as { data: { username: string } };
    expect(arg.data.username).toBe("admin");
  });

  it("menerima username singkat 'admin' dengan password '123'", async () => {
    userMock.create!.mockResolvedValue({ id: "u1" });
    const res = await createUser(inputValid({ username: "admin", password: "123" }));
    expect(res.ok).toBe(true);
  });

  it("menolak username terlalu pendek dengan fieldErrors", async () => {
    const res = await createUser(inputValid({ username: "ab" }));
    expect(res.ok).toBe(false);
    if (!res.ok && res.reason === "INVALID") {
      expect(res.fieldErrors?.username).toBeDefined();
    }
    expect(userMock.create!).not.toHaveBeenCalled();
  });

  it("menolak password kosong", async () => {
    const res = await createUser(inputValid({ password: "" }));
    expect(res.ok).toBe(false);
    expect(userMock.create!).not.toHaveBeenCalled();
  });

  it("mengembalikan DUPLICATE saat username sudah dipakai (P2002)", async () => {
    userMock.create!.mockRejectedValue(Object.assign(new Error("dup"), { code: "P2002" }));
    const res = await createUser(inputValid());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("DUPLICATE");
  });

  it("mengembalikan UNAVAILABLE saat DB bermasalah", async () => {
    userMock.create!.mockRejectedValue(new Error("db down"));
    const res = await createUser(inputValid());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("UNAVAILABLE");
  });
});

describe("updateUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mengubah data akun valid", async () => {
    userMock.findUnique!.mockResolvedValue({ role: "EDITOR", aktif: true });
    userMock.update!.mockResolvedValue({ id: "u1" });
    const res = await updateUser({ id: "u1", nama: "Ani", username: "ani", role: "EDITOR", aktif: true });
    expect(res).toEqual({ ok: true, id: "u1" });
    expect(userMock.update!).toHaveBeenCalledOnce();
  });

  it("mengembalikan NOT_FOUND bila id tidak ada", async () => {
    userMock.findUnique!.mockResolvedValue(null);
    const res = await updateUser({ id: "x", nama: "Ani", username: "ani", role: "EDITOR", aktif: true });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("NOT_FOUND");
    expect(userMock.update!).not.toHaveBeenCalled();
  });

  it("menolak menurunkan peran Administrator aktif TERAKHIR", async () => {
    userMock.findUnique!.mockResolvedValue({ role: "ADMIN", aktif: true });
    userMock.count!.mockResolvedValue(1); // hanya satu admin aktif
    const res = await updateUser({ id: "u1", nama: "Admin", username: "admin", role: "EDITOR", aktif: true });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("TERAKHIR");
    expect(userMock.update!).not.toHaveBeenCalled();
  });

  it("mengizinkan perubahan bila masih ada Administrator aktif lain", async () => {
    userMock.findUnique!.mockResolvedValue({ role: "ADMIN", aktif: true });
    userMock.count!.mockResolvedValue(2);
    userMock.update!.mockResolvedValue({ id: "u1" });
    const res = await updateUser({ id: "u1", nama: "Admin", username: "admin", role: "EDITOR", aktif: true });
    expect(res.ok).toBe(true);
  });

  it("mengembalikan DUPLICATE saat username bentrok", async () => {
    userMock.findUnique!.mockResolvedValue({ role: "EDITOR", aktif: true });
    userMock.update!.mockRejectedValue(Object.assign(new Error("dup"), { code: "P2002" }));
    const res = await updateUser({ id: "u1", nama: "Ani", username: "ani", role: "EDITOR", aktif: true });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("DUPLICATE");
  });
});

describe("changeUserPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menyimpan hash baru, bukan password polos", async () => {
    userMock.update!.mockResolvedValue({ id: "u1" });
    const res = await changeUserPassword({ id: "u1", password: "passwordBaru" });
    expect(res.ok).toBe(true);
    const arg = userMock.update!.mock.calls[0]![0] as { data: { passwordHash: string } };
    expect(arg.data.passwordHash).not.toBe("passwordBaru");
    expect(arg.data.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("menolak password terlalu pendek", async () => {
    const res = await changeUserPassword({ id: "u1", password: "ab" });
    expect(res.ok).toBe(false);
    expect(userMock.update!).not.toHaveBeenCalled();
  });

  it("mengembalikan NOT_FOUND bila akun tidak ada (P2025)", async () => {
    userMock.update!.mockRejectedValue(Object.assign(new Error("nf"), { code: "P2025" }));
    const res = await changeUserPassword({ id: "x", password: "passwordBaru" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("NOT_FOUND");
  });
});

describe("deleteUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menghapus akun biasa", async () => {
    userMock.findUnique!.mockResolvedValue({ role: "EDITOR", aktif: true });
    userMock.delete!.mockResolvedValue({ id: "u1" });
    const res = await deleteUser({ id: "u1" });
    expect(res).toEqual({ ok: true, id: "u1" });
  });

  it("menolak menghapus Administrator aktif terakhir", async () => {
    userMock.findUnique!.mockResolvedValue({ role: "ADMIN", aktif: true });
    userMock.count!.mockResolvedValue(1);
    const res = await deleteUser({ id: "u1" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("TERAKHIR");
    expect(userMock.delete!).not.toHaveBeenCalled();
  });

  it("mengembalikan NOT_FOUND bila id tidak ada", async () => {
    userMock.findUnique!.mockResolvedValue(null);
    const res = await deleteUser({ id: "x" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("NOT_FOUND");
  });

  it("menolak id kosong", async () => {
    const res = await deleteUser({ id: "  " });
    expect(res.ok).toBe(false);
    expect(userMock.delete!).not.toHaveBeenCalled();
  });
});

describe("list / get / count", () => {
  beforeEach(() => vi.clearAllMocks());

  it("listUsers memilih kolom aman (tanpa passwordHash)", async () => {
    userMock.findMany!.mockResolvedValue([]);
    await listUsers();
    const arg = userMock.findMany!.mock.calls[0]![0] as { select: Record<string, boolean> };
    expect(arg.select).not.toHaveProperty("passwordHash");
    expect(arg.select.username).toBe(true);
  });

  it("getUserById mengembalikan null untuk id kosong", async () => {
    expect(await getUserById("  ")).toBeNull();
    expect(userMock.findUnique!).not.toHaveBeenCalled();
  });

  it("getUserByUsername menormalkan huruf besar & spasi", async () => {
    userMock.findUnique!.mockResolvedValue(null);
    await getUserByUsername("  ADMIN  ");
    expect(userMock.findUnique!).toHaveBeenCalledWith(
      expect.objectContaining({ where: { username: "admin" } }),
    );
  });

  it("countUsers mengembalikan hitungan per peran/status", async () => {
    userMock.count!
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1);
    expect(await countUsers()).toEqual({ total: 5, admin: 2, editor: 3, aktif: 4, nonaktif: 1 });
  });
});

describe("verifyUserLogin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mengembalikan data aman saat identitas & password cocok", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("123", 4);
    userMock.findUnique!.mockResolvedValue({
      id: "u1",
      username: "admin",
      nama: "Administrator",
      role: "ADMIN",
      aktif: true,
      passwordHash: hash,
    });
    const res = await verifyUserLogin("admin", "123");
    expect(res).toEqual({ id: "u1", username: "admin", nama: "Administrator", role: "ADMIN" });
    expect(res).not.toHaveProperty("passwordHash");
  });

  it("mengembalikan null saat password salah", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("benar", 4);
    userMock.findUnique!.mockResolvedValue({
      id: "u1",
      username: "admin",
      nama: "Admin",
      role: "ADMIN",
      aktif: true,
      passwordHash: hash,
    });
    expect(await verifyUserLogin("admin", "salah")).toBeNull();
  });

  it("mengembalikan null untuk akun nonaktif", async () => {
    userMock.findUnique!.mockResolvedValue({
      id: "u1",
      username: "admin",
      nama: "Admin",
      role: "ADMIN",
      aktif: false,
      passwordHash: "$2b$04$abcdefghijklmnopqrstuv",
    });
    expect(await verifyUserLogin("admin", "apa-saja")).toBeNull();
  });

  it("mengembalikan null tanpa menyentuh DB saat input kosong", async () => {
    expect(await verifyUserLogin("   ", "x")).toBeNull();
    expect(await verifyUserLogin("admin", "")).toBeNull();
    expect(userMock.findUnique!).not.toHaveBeenCalled();
  });

  it("memetakan peran tak dikenal menjadi EDITOR", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("123", 4);
    userMock.findUnique!.mockResolvedValue({
      id: "u1",
      username: "admin",
      nama: "Admin",
      role: "NGACO",
      aktif: true,
      passwordHash: hash,
    });
    const res = await verifyUserLogin("admin", "123");
    expect(res?.role).toBe("EDITOR");
  });
});
