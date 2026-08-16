// ------------------------------------------------------------
// AUTO-SYNC INITIALIZER
// Fires YouTube and Twitch VOD syncs once when the server starts.
// Uses globalThis flags so it only runs once per server process.
// ------------------------------------------------------------

let ytInitialized = false;
let twitchInitialized = false;

export async function autoSyncYouTube(): Promise<void> {
  if (ytInitialized) return;
  ytInitialized = true;

  const apiKey = process.env.YOUTUBE_API_KEY;
  const playlist1 = process.env.YOUTUBE_UPLOADS_PLAYLIST_ID;
  if (!apiKey || !playlist1) return;

  try {
    const { fetchYouTubeUploads } = await import("@/lib/providers/youtube");
    const { setCachedPosts, markSynced } = await import("@/lib/post-cache");
    console.log("[auto-sync] YouTube starting...");
    const result = await fetchYouTubeUploads();
    if (result.posts.length > 0) {
      setCachedPosts(result.posts);
      markSynced("youtube");
      console.log(`[auto-sync] YouTube done — ${result.posts.length} videos`);
    } else if (result.error) {
      console.warn("[auto-sync] YouTube error:", result.error);
    }
  } catch (err) {
    console.warn("[auto-sync] YouTube failed:", err);
  }
}

export async function autoSyncTwitch(): Promise<void> {
  if (twitchInitialized) return;
  twitchInitialized = true;

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return;

  try {
    const { getTwitchVods } = await import("@/lib/providers/twitch");
    const { setMediaItems, markMediaSynced } = await import("@/lib/media");
    console.log("[auto-sync] Twitch VODs starting...");
    const result = await getTwitchVods(50);
    if (result.items.length > 0) {
      setMediaItems(result.items);
      markMediaSynced("twitch");
      console.log(`[auto-sync] Twitch done — ${result.items.length} VODs`);
    } else if (result.error) {
      console.warn("[auto-sync] Twitch error:", result.error);
    }
  } catch (err) {
    console.warn("[auto-sync] Twitch failed:", err);
  }
}
