"use client";

import { useEffect, useState } from "react";

/** TikTok's official embed player (vertical). */
export function TikTokEmbed({ id, title }: { id: string; title: string }) {
  return (
    <div className="mx-auto aspect-[9/16] w-full max-w-[380px] overflow-hidden rounded-xl bg-black">
      <iframe
        src={`https://www.tiktok.com/player/v1/${id}?rel=0&description=1`}
        title={title}
        className="h-full w-full"
        allow="encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

/** Twitch clip embed. Twitch requires the embedding site's hostname as `parent`. */
export function TwitchClipEmbed({ slug, title }: { slug: string; title: string }) {
  const [host, setHost] = useState<string | null>(null);
  useEffect(() => setHost(window.location.hostname), []);
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      {host && (
        <iframe
          src={`https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}&parent=${host}&autoplay=false`}
          title={title}
          className="h-full w-full"
          allowFullScreen
        />
      )}
    </div>
  );
}
