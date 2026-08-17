import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ============================================================
// PROVIDERS
//
// These are the least verifiable part of the system in a
// sandbox: without API credentials the real HTTP paths never
// run. So `fetch` is stubbed with the response shapes the
// providers actually receive, and the mapping, pagination,
// filtering and failure handling are exercised against them.
//
// This does not prove the live APIs still return these shapes.
// It does prove that when they do, we handle them correctly —
// and that a failure degrades instead of emptying the archive.
// ============================================================

process.env.YOUTUBE_API_KEY = "test-key";
process.env.YOUTUBE_UPLOADS_PLAYLIST_ID = "UUmain";
process.env.TWITCH_CLIENT_ID = "test-client";
process.env.TWITCH_CLIENT_SECRET = "test-secret";
process.env.TWITCH_CHANNEL_LOGIN = "wockkingdaggerr";

const { fetchYouTube } = await import("@/lib/providers/youtube");
const { fetchTwitchVods } = await import("@/lib/providers/twitch");

type Handler = (url: string, init?: RequestInit) => { status?: number; body: unknown };

function stubFetch(handler: Handler) {
  vi.stubGlobal("fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const { status = 200, body } = handler(url, init);
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  });
}

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => vi.unstubAllGlobals());

// ------------------------------------------------------------
describe("YouTube", () => {
  it("paginates the uploads playlist and enriches each video", async () => {
    let playlistCalls = 0;

    stubFetch((url) => {
      if (url.includes("/playlistItems")) {
        playlistCalls += 1;
        const page = playlistCalls === 1;
        return {
          body: {
            nextPageToken: page ? "PAGE2" : undefined,
            items: [
              {
                contentDetails: {
                  videoId: page ? "vid_a" : "vid_b",
                  videoPublishedAt: page
                    ? "2026-05-01T10:00:00Z"
                    : "2026-04-01T10:00:00Z",
                },
                snippet: {
                  title: page ? "First video" : "Second video",
                  description: "  spaced description  ",
                  thumbnails: { maxres: { url: "https://i.ytimg.com/vi/x/maxres.jpg" } },
                },
              },
            ],
          },
        };
      }
      if (url.includes("/videos")) {
        return {
          body: {
            items: [
              {
                id: "vid_a",
                contentDetails: { duration: "PT1H2M3S" },
                statistics: { viewCount: "1234" },
              },
              {
                id: "vid_b",
                contentDetails: { duration: "PT45S" },
                statistics: { viewCount: "10" },
              },
            ],
          },
        };
      }
      return { body: {} };
    });

    const result = await fetchYouTube();

    expect(result.configured).toBe(true);
    expect(result.error).toBeNull();
    expect(playlistCalls).toBe(2); // followed nextPageToken
    expect(result.items).toHaveLength(2);

    const [newest, oldest] = result.items;
    expect(newest.external_id).toBe("vid_a"); // sorted newest first
    expect(newest.id).toBe("youtube:vid_a");
    expect(newest.duration_seconds).toBe(3723);
    expect(newest.view_count).toBe(1234);
    expect(newest.description).toBe("spaced description");
    expect(newest.permalink).toBe("https://www.youtube.com/watch?v=vid_a");
    // Privacy-preserving embed host.
    expect(newest.embed_url).toContain("youtube-nocookie.com");

    // 45 seconds is a Short; the hour-long one is not.
    expect(oldest.kind).toBe("short");
    expect(newest.kind).toBe("video");
  });

  it("drops private and deleted playlist entries", async () => {
    stubFetch((url) => {
      if (url.includes("/playlistItems")) {
        return {
          body: {
            items: [
              { contentDetails: { videoId: "ok" }, snippet: { title: "Real video" } },
              { contentDetails: { videoId: "p" }, snippet: { title: "Private video" } },
              { contentDetails: { videoId: "d" }, snippet: { title: "Deleted video" } },
            ],
          },
        };
      }
      return { body: { items: [] } };
    });

    const result = await fetchYouTube();
    expect(result.items.map((i) => i.external_id)).toEqual(["ok"]);
  });

  it("falls back to a derived thumbnail when the API omits one", async () => {
    stubFetch((url) =>
      url.includes("/playlistItems")
        ? { body: { items: [{ contentDetails: { videoId: "abc" }, snippet: { title: "T" } }] } }
        : { body: { items: [] } }
    );

    const result = await fetchYouTube();
    expect(result.items[0].thumbnail_url).toBe("https://i.ytimg.com/vi/abc/hqdefault.jpg");
  });

  it("survives a failed enrichment call — a video without a duration is still a video", async () => {
    stubFetch((url) => {
      if (url.includes("/playlistItems")) {
        return { body: { items: [{ contentDetails: { videoId: "abc" }, snippet: { title: "T" } }] } };
      }
      return { status: 500, body: { error: "boom" } };
    });

    const result = await fetchYouTube();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].duration_seconds).toBeNull();
    expect(result.items[0].view_count).toBeNull();
  });

  it("reports a failure rather than an empty archive when the playlist errors", async () => {
    stubFetch(() => ({ status: 403, body: { error: "quota" } }));

    const result = await fetchYouTube();
    expect(result.configured).toBe(true);
    expect(result.items).toHaveLength(0);
    expect(result.error).toContain("403");
  });

  it("reports not-configured when the key is absent, which is a state not an error", async () => {
    vi.stubEnv("YOUTUBE_API_KEY", "");
    const result = await fetchYouTube();
    expect(result.configured).toBe(false);
    expect(result.items).toHaveLength(0);
    vi.unstubAllEnvs();
  });
});

// ------------------------------------------------------------
describe("Twitch", () => {
  const token = { access_token: "tok", expires_in: 3600 };

  it("resolves the user, paginates VODs, and maps them", async () => {
    let videoCalls = 0;

    stubFetch((url) => {
      if (url.includes("id.twitch.tv")) return { body: token };
      if (url.includes("/users")) return { body: { data: [{ id: "12345" }] } };
      if (url.includes("/videos")) {
        videoCalls += 1;
        const first = videoCalls === 1;
        return {
          body: {
            data: [
              {
                id: first ? "v1" : "v2",
                title: first ? "Stream one" : "Stream two",
                description: "",
                thumbnail_url:
                  "https://static-cdn.jtvnw.net/x/%{width}x%{height}/thumb.jpg",
                published_at: first ? "2026-05-02T00:00:00Z" : "2026-05-01T00:00:00Z",
                duration: first ? "3h4m11s" : "42m10s",
                view_count: first ? 900 : 12,
                url: `https://www.twitch.tv/videos/${first ? "v1" : "v2"}`,
              },
            ],
            pagination: first ? { cursor: "NEXT" } : {},
          },
        };
      }
      return { body: {} };
    });

    const result = await fetchTwitchVods(200);

    expect(result.configured).toBe(true);
    expect(result.error).toBeNull();
    expect(videoCalls).toBe(2); // followed the cursor
    expect(result.items).toHaveLength(2);

    const vod = result.items[0];
    expect(vod.id).toBe("twitch:v1");
    expect(vod.kind).toBe("vod");
    expect(vod.duration_seconds).toBe(11051); // 3h4m11s
    expect(vod.view_count).toBe(900);
    // The %{width} placeholders must be substituted or the image 404s.
    expect(vod.thumbnail_url).not.toContain("%{");
    expect(vod.thumbnail_url).toContain("640");
    // An empty description becomes null rather than an empty string.
    expect(vod.description).toBeNull();
  });

  it("keeps a partial page when pagination fails midway", async () => {
    let videoCalls = 0;
    stubFetch((url) => {
      if (url.includes("id.twitch.tv")) return { body: token };
      if (url.includes("/users")) return { body: { data: [{ id: "1" }] } };
      if (url.includes("/videos")) {
        videoCalls += 1;
        if (videoCalls === 1) {
          return {
            body: {
              data: [{ id: "v1", title: "Kept", duration: "10m0s" }],
              pagination: { cursor: "NEXT" },
            },
          };
        }
        return { status: 503, body: {} };
      }
      return { body: {} };
    });

    const result = await fetchTwitchVods(200);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].external_id).toBe("v1");
    expect(result.error).toContain("503");
  });

  it("fails cleanly when the token request is rejected", async () => {
    // The app token is cached at module scope — deliberately, since it is a
    // pure optimisation. Re-import so this exercises a cold process rather
    // than reusing the token an earlier test warmed.
    vi.resetModules();
    stubFetch((url) =>
      url.includes("id.twitch.tv") ? { status: 401, body: {} } : { body: {} }
    );

    const { fetchTwitchVods: cold } = await import("@/lib/providers/twitch");
    const result = await cold();
    expect(result.configured).toBe(true);
    expect(result.items).toHaveLength(0);
    expect(result.error).toContain("token");
  });

  it("reports not-configured without credentials", async () => {
    vi.stubEnv("TWITCH_CLIENT_ID", "");
    vi.stubEnv("TWITCH_CLIENT_SECRET", "");
    const result = await fetchTwitchVods();
    expect(result.configured).toBe(false);
    vi.unstubAllEnvs();
  });
});
