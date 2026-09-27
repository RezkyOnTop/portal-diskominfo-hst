import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseYoutubeFeed,
  youtubeFeedUrl,
  getYoutubeVideos,
  YoutubeError,
  YOUTUBE_CHANNEL_ID,
  __clearYoutubeCache,
} from "./youtube";

const FEED_XML = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/">
  <entry>
    <yt:videoId>abc123</yt:videoId>
    <title>Judul Video &amp; Uji</title>
    <published>2026-08-26T05:51:50+00:00</published>
    <media:thumbnail url="https://i.ytimg.com/vi/abc123/hqdefault.jpg" width="480" height="360"/>
  </entry>
  <entry>
    <yt:videoId>def456</yt:videoId>
    <title><![CDATA[Judul dengan CDATA]]></title>
    <published>2026-08-20T08:34:26+00:00</published>
  </entry>
  <entry>
    <title>Entri tanpa videoId harus dilewati</title>
  </entry>
</feed>`;

describe("youtubeFeedUrl", () => {
  it("membangun URL feed dengan channel_id", () => {
    expect(youtubeFeedUrl("UC123")).toBe(
      "https://www.youtube.com/feeds/videos.xml?channel_id=UC123",
    );
  });

  it("memakai channel Media Center HST secara default", () => {
    expect(youtubeFeedUrl()).toContain(YOUTUBE_CHANNEL_ID);
  });
});

describe("parseYoutubeFeed", () => {
  it("mengurai entry menjadi video (melewati yang tanpa videoId)", () => {
    const videos = parseYoutubeFeed(FEED_XML);
    expect(videos).toHaveLength(2);
    expect(videos[0]!.videoId).toBe("abc123");
    expect(videos[0]!.url).toBe("https://www.youtube.com/watch?v=abc123");
    expect(videos[0]!.thumbnailUrl).toBe("https://i.ytimg.com/vi/abc123/hqdefault.jpg");
  });

  it("men-decode entitas XML pada judul", () => {
    expect(parseYoutubeFeed(FEED_XML)[0]!.title).toBe("Judul Video & Uji");
  });

  it("membuang CDATA pada judul", () => {
    expect(parseYoutubeFeed(FEED_XML)[1]!.title).toBe("Judul dengan CDATA");
  });

  it("memakai thumbnail bawaan bila media:thumbnail tidak ada", () => {
    expect(parseYoutubeFeed(FEED_XML)[1]!.thumbnailUrl).toBe(
      "https://i.ytimg.com/vi/def456/hqdefault.jpg",
    );
  });

  it("mengembalikan array kosong untuk XML tanpa entry", () => {
    expect(parseYoutubeFeed("<feed></feed>")).toEqual([]);
  });
});

describe("getYoutubeVideos", () => {
  beforeEach(() => {
    __clearYoutubeCache();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    __clearYoutubeCache();
    vi.unstubAllGlobals();
  });

  it("mengambil & memvalidasi feed dari jaringan", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => FEED_XML,
      }),
    );

    const videos = await getYoutubeVideos();
    expect(videos).toHaveLength(2);
    expect(videos[0]!.videoId).toBe("abc123");
  });

  it("membatasi jumlah video sesuai parameter limit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => FEED_XML }),
    );
    const videos = await getYoutubeVideos(1);
    expect(videos).toHaveLength(1);
  });

  it("melempar YoutubeError saat HTTP gagal (tanpa data lama)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => "" }),
    );
    await expect(getYoutubeVideos()).rejects.toBeInstanceOf(YoutubeError);
  });

  it("memakai cache proses pada panggilan kedua (tidak fetch ulang)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => FEED_XML,
    });
    vi.stubGlobal("fetch", fetchMock);

    await getYoutubeVideos();
    await getYoutubeVideos();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("stale-while-error: pakai data lama bila penyegaran gagal", async () => {
    // Muat data sukses lebih dulu (mengisi cacheGagalTerakhir).
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => FEED_XML,
    });
    vi.stubGlobal("fetch", fetchMock);
    await getYoutubeVideos();

    // Paksa cache proses kedaluwarsa dengan memajukan waktu sistem.
    const asli = Date.now;
    Date.now = () => asli() + 31 * 60 * 1000;
    try {
      fetchMock.mockRejectedValueOnce(new Error("jaringan mati"));
      const videos = await getYoutubeVideos();
      expect(videos).toHaveLength(2); // data lama dipakai
    } finally {
      Date.now = asli;
    }
  });
});
