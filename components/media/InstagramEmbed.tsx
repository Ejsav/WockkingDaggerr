"use client";

import { useEffect, useRef, useState } from "react";

interface InstagramEmbedProps {
  shortcode: string;
  caption?: string;
  className?: string;
}

export default function InstagramEmbed({
  shortcode,
  caption,
  className = "",
}: InstagramEmbedProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [shouldMount, setShouldMount] = useState(false);
  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  const postUrl = `https://www.instagram.com/p/${shortcode}/`;

  useEffect(() => {
    const node = shellRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShouldMount(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px", threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={shellRef} className={`relative overflow-hidden ${className}`}>
      {!loaded && (
        <div
          className="flex items-center justify-center border border-white/5 bg-ink-700"
          style={{ height: "560px" }}
        >
          <div className="text-center">
            <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-bone/40 animate-pulse">
              {shouldMount ? "Loading post..." : "Instagram ready"}
            </div>
            <a
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-widest text-blade hover:underline"
            >
              VIEW ON INSTAGRAM →
            </a>
          </div>
        </div>
      )}

      {shouldMount && (
        <iframe
          src={embedUrl}
          className={`w-full border-0 transition-opacity duration-500 ${loaded ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0"}`}
          height="560"
          scrolling="no"
          loading="lazy"
          allowTransparency
          frameBorder="0"
          referrerPolicy="strict-origin-when-cross-origin"
          title={caption ?? "Instagram post by @wockkingdaggerr"}
          onLoad={() => setLoaded(true)}
          style={{
            background: "transparent",
            maxWidth: "540px",
            width: "100%",
            display: "block",
            margin: "0 auto",
          }}
        />
      )}
    </div>
  );
}
