import { redirect, notFound } from "next/navigation";
import { getCachedPosts } from "@/lib/post-cache";
import { getVisiblePosts } from "@/lib/mock-data";
import { getMediaItem } from "@/lib/media";

// Legacy route — redirect to source-aware URLs
// /watch/yt_abc123 → /watch/youtube/abc123
// /watch/twitch_456 → /watch/twitch/456

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function WatchIdRedirect({ params }: { params: { id: string } }) {
  const id = params.id;

  // Try YouTube post cache
  if (id.startsWith("yt_")) {
    const videoId = id.replace(/^yt_/, "");
    return redirect(`/watch/youtube/${videoId}`);
  }

  // Try Twitch media cache
  if (id.startsWith("twitch_")) {
    const vodId = id.replace(/^twitch_/, "");
    return redirect(`/watch/twitch/${vodId}`);
  }

  // Try resolving from post cache by full ID
  const all = getCachedPosts().length > 0 ? getCachedPosts() : getVisiblePosts();
  const post = all.find((p) => p.id === id);
  if (post && post.platform === "youtube") {
    return redirect(`/watch/youtube/${post.external_id}`);
  }

  // Try media cache
  const media = getMediaItem(id);
  if (media?.source === "twitch") {
    return redirect(`/watch/twitch/${media.externalId}`);
  }

  notFound();
}
