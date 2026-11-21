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

type TwttrWidgets = {
  widgets: { createTweet(id: string, el: HTMLElement, opts?: Record<string, unknown>): Promise<HTMLElement | undefined> };
};
declare global {
  interface Window {
    twttr?: TwttrWidgets;
  }
}

let xScript: Promise<TwttrWidgets> | null = null;
function loadX(): Promise<TwttrWidgets> {
  if (window.twttr?.widgets) return Promise.resolve(window.twttr);
  xScript ??= new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = "https://platform.twitter.com/widgets.js";
    el.async = true;
    el.onload = () => (window.twttr?.widgets ? resolve(window.twttr) : reject(new Error("X widgets unavailable")));
    el.onerror = () => reject(new Error("X widgets blocked"));
    document.head.appendChild(el);
  });
  return xScript;
}

/** X post embed (X's official widget). The video plays inside the embedded post. */
export function XPostEmbed({ id, url, title }: { id: string; url: string; title: string }) {
  const [state, setState] = useState<"loading" | "ok" | "failed">("loading");
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!el) return;
    let cancelled = false;
    el.innerHTML = "";
    loadX()
      .then((t) => t.widgets.createTweet(id, el, { theme: "dark", dnt: true, align: "center", conversation: "none" }))
      .then((node) => !cancelled && setState(node ? "ok" : "failed"))
      .catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
    };
  }, [el, id]);
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl bg-surface-2/40 py-2">
      <div ref={setEl} className="w-full max-w-[550px] [&_.twitter-tweet]:!mx-auto" />
      {state === "loading" && <p className="text-sm text-muted">Loading post from X…</p>}
      {state === "failed" && (
        <p className="p-6 text-center text-sm text-muted">
          This clip couldn&apos;t load here (it may have been deleted, or your browser blocks X embeds).{" "}
          <a href={url} target="_blank" rel="noopener" className="text-aqua underline">Watch “{title}” on X ↗</a>
        </p>
      )}
    </div>
  );
}
