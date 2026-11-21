"use client";

import { useState } from "react";

/** Thumbnail with a branded fallback (TikTok thumbnails expire; Twitch clips have none without an API key). */
export function ClipThumb({ src, platform, className = "" }: { src: string | null; platform: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`grid h-full w-full place-items-center bg-[linear-gradient(135deg,#ff3d8b40,#ffb54726,#2de2e626)] ${className}`}>
        <span className="text-xs font-bold uppercase tracking-widest text-ink/70">{platform}</span>
      </div>
    );
  }
  return (
    <img src={src} alt="" onError={() => setFailed(true)} className={`h-full w-full object-cover ${className}`} />
  );
}
