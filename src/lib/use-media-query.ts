"use client";

import { useEffect, useState } from "react";

/** Starts `false` on both the server render and the first client render (no
 * `window` during prerender), then corrects itself post-mount — avoids a
 * hydration mismatch at the cost of one frame of "assumed false". */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    queueMicrotask(() => setMatches(mq.matches));
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
