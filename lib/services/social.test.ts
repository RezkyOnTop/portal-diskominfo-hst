import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    socialMediaCache: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Adapter YouTube di-mock: tes ini menguji logika cache, bukan jaringan.
vi.mock("@/lib/api/youtube", () => ({
  YOUTUBE_CHANNEL_ID: "UCXVJroYPW6e1GhWZ501XZ3g",
  getYoutubeVideos: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { getYoutubeVideos } from "@/lib/api/youtube";
import { getSocialFeed, saveSocialCache, segarkanDariYoutube } from "./social";

const findManyMock = prisma.socialMediaCache.findMany as unknown as ReturnType<typeof vi.fn>;
const createMock = prisma.socialMediaCache.create as unknown as ReturnType<typeof vi.fn>;
const deleteManyMock = prisma.socialMediaCache.deleteMany as unknown as ReturnType<typeof vi.fn>;
const getYoutubeVideosMock = getYoutubeVideos as unknown as ReturnType<typeof vi.fn>;

const VIDEO_CONTOH = {
  videoId: "abc123",
  title: "Video Contoh Media Center",
  url: "https://www.youtube.com/watch?v=abc123",
  thumbnailUrl: "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
  publishedAt: "2026-08-26T05:51:50+00:00",
};

describe("getSocialFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteManyMock.mockResolvedValue({ count: 0 });
    createMock.mockResolvedValue({ id: "c1" });
  });

  it("memetakan payload cache menjadi item feed (tanpa memanggil YouTube)", async () => {
    findManyMock.mockResolvedValue([
      {
        platform: "instagram",
        payload: [{ title: "Post 1", url: "https://ig/1", imageUrl: "x.jpg", date: "2026" }],
      },
    ]);
    const items = await getSocialFeed();
    expect(items).toHaveLength(1);
    expect(items[0]!.platform).toBe("instagram");
    expect(items[0]!.title).toBe("Post 1");
    expect(getYoutubeVideosMock).not.toHaveBeenCalled();
  });

  it("mengabaikan payload yang bukan array", async () => {
    findManyMock.mockResolvedValue([{ platform: "x", payload: { a: 1 } }]);
    getYoutubeVideosMock.mockResolvedValue([]);
    expect(await getSocialFeed()).toEqual([]);
  });

  it("menyegarkan dari YouTube saat cache kosong", async () => {
    findManyMock.mockResolvedValue([]);
    getYoutubeVideosMock.mockResolvedValue([VIDEO_CONTOH]);

    const items = await getSocialFeed();

    expect(getYoutubeVideosMock).toHaveBeenCalledOnce();
    expect(items).toHaveLength(1);
    expect(items[0]!.platform).toBe("YouTube");
    expect(items[0]!.title).toBe("Video Contoh Media Center");
    // Cache disimpan agar panggilan berikutnya tidak menyentuh YouTube.
    expect(deleteManyMock).toHaveBeenCalled();
    expect(createMock).toHaveBeenCalledOnce();
  });

  it("tetap mencoba YouTube saat DB error (tidak memecahkan halaman)", async () => {
    findManyMock.mockRejectedValue(new Error("db down"));
    getYoutubeVideosMock.mockResolvedValue([VIDEO_CONTOH]);

    const items = await getSocialFeed();

    expect(items).toHaveLength(1);
    expect(items[0]!.url).toBe(VIDEO_CONTOH.url);
  });

  it("mengembalikan array kosong bila DB error DAN YouTube kosong", async () => {
    findManyMock.mockRejectedValue(new Error("db down"));
    getYoutubeVideosMock.mockResolvedValue([]);
    expect(await getSocialFeed()).toEqual([]);
  });
});

describe("segarkanDariYoutube", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteManyMock.mockResolvedValue({ count: 0 });
    createMock.mockResolvedValue({ id: "c1" });
  });

  it("mengembalikan array kosong bila YouTube gagal (tidak melempar)", async () => {
    getYoutubeVideosMock.mockRejectedValue(new Error("youtube down"));
    expect(await segarkanDariYoutube()).toEqual([]);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("meneruskan batas jumlah video ke adapter", async () => {
    getYoutubeVideosMock.mockResolvedValue([VIDEO_CONTOH]);
    await segarkanDariYoutube(3);
    expect(getYoutubeVideosMock).toHaveBeenCalledWith(3);
  });
});

describe("saveSocialCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteManyMock.mockResolvedValue({ count: 0 });
  });

  it("membuang entri lama lalu menyimpan cache dengan expiresAt di masa depan", async () => {
    createMock.mockResolvedValue({ id: "c1" });
    await saveSocialCache("instagram", [], 900);

    expect(deleteManyMock).toHaveBeenCalledWith({ where: { platform: "instagram" } });
    expect(createMock).toHaveBeenCalledOnce();
    const arg = createMock.mock.calls[0]![0] as { data: { expiresAt: Date } };
    expect(arg.data.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("menelan error saat penyimpanan cache gagal", async () => {
    createMock.mockRejectedValue(new Error("db down"));
    await expect(saveSocialCache("x", [], 60)).resolves.toBeUndefined();
  });
});
