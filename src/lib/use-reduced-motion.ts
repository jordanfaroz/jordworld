"use client";

import { useEffect, useState } from "react";

/** Starts `false` on both the server render and the first client render (no
 * `window` during prerender), then corrects itself post-mount — avoids a
 * hydration mismatch at the cost of one frame of "motion assumed safe". */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    queueMicrotask(() => setReduced(mq.matches));
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
