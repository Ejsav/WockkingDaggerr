"use client";

// ============================================================
// YOUTUBE PLAYER
// Clean iframe wrapper for YouTube video embeds.
// Does not open a new tab. Renders the player on-site.
// ============================================================

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  autoplay?: boolean;
  className?: string;
}

export default function YouTubePlayer({
  videoId,
  title = "YouTube video",
  autoplay = false,
  className = "",
}: YouTubePlayerProps) {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    color: "red",
    ...(autoplay ? { autoplay: "1" } : {}),
  });

  const src = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;

  return (
    <iframe
      src={src}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      loading="lazy"
      className={`h-full w-full border-0 ${className}`}
    />
  );
}
