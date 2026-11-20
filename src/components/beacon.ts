export function beacon(url: string, data: unknown) {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
  fetch(url, { method: "POST", body: JSON.stringify(data), keepalive: true, credentials: "same-origin" }).catch(
    () => {},
  );
}

/** Fire `cb` once when `el` is at least 50% visible for one second (IAB viewability). */
export function onceViewable(el: Element, cb: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let done = false;
  const io = new IntersectionObserver(
    ([e]) => {
      if (done) return;
      if (e.isIntersecting && e.intersectionRatio >= 0.5) {
        timer ??= setTimeout(() => {
          done = true;
          cb();
          io.disconnect();
        }, 1000);
      } else if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
    { threshold: [0, 0.5, 1] },
  );
  io.observe(el);
  return () => {
    if (timer) clearTimeout(timer);
    io.disconnect();
  };
}
