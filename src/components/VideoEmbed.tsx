"use client";

import { useEffect, useRef } from "react";
import { beacon } from "./beacon";

type YTPlayer = { destroy(): void };
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host?: string;
      playerVars?: Record<string, number | string>;
      events?: { onStateChange?: (e: { data: number }) => void };
    },
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    document.head.appendChild(s);
  });
  return apiPromise;
}

/**
 * YouTube embed that reports real plays and completions through the
 * IFrame Player API, so "most watched" is measured rather than guessed.
 */
export function VideoEmbed({ videoId, youtubeId, title }: { videoId: string; youtubeId: string; title: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let player: YTPlayer | null = null;
    let cancelled = false;
    let played = false;
    let completed = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !host.current) return;
      const mount = document.createElement("div");
      host.current.appendChild(mount);
      player = new YT.Player(mount, {
        videoId: youtubeId,
        host: "https://www.youtube-nocookie.com",
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === 1 && !played) {
              played = true;
              beacon("/api/video-event", { videoId, type: "play" });
            }
            if (e.data === 0 && !completed) {
              completed = true;
              beacon("/api/video-event", { videoId, type: "complete" });
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [videoId, youtubeId]);

  return (
    <div
      ref={host}
      aria-label={title}
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-black [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full"
    />
  );
}
