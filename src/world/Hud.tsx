"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { TextRoll } from "@/components/motion-primitives/text-roll";
import { getRegion } from "@/content/regions";
import type { RegionSlug } from "./map";
import type { Interactable } from "./interaction";

export interface HudProps {
  region: RegionSlug | "home";
  nearest: { interactable: Interactable; inRange: boolean } | null;
  isTouch: boolean;
  onInteract: (id: string) => void;
  reducedMotion: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function Hud({
  region,
  nearest,
  isTouch,
  onInteract,
  reducedMotion,
  onZoomIn,
  onZoomOut,
}: HudProps) {
  const [bannerRegion, setBannerRegion] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setBannerRegion(region));
    const t = setTimeout(() => setBannerRegion(null), 1500);
    return () => clearTimeout(t);
  }, [region]);

  const regionInfo = getRegion(region);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div
        className="absolute top-4 right-4 flex items-center gap-2"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <Link
          href="/classic"
          className="border-border bg-background/80 text-foreground hover:border-grass/50 pointer-events-auto rounded-md border-2 px-3 py-1.5 font-mono text-xs backdrop-blur-sm"
        >
          Classic view
        </Link>
      </div>

      {bannerRegion && (
        <div className="border-border bg-background/90 absolute top-16 left-1/2 -translate-x-1/2 rounded-md border-2 px-4 py-2 text-center backdrop-blur-sm">
          <span className="font-heading text-foreground text-lg">
            {reducedMotion ? (
              `${regionInfo.emoji} ${regionInfo.label}`
            ) : (
              <TextRoll>{`${regionInfo.emoji} ${regionInfo.label}`}</TextRoll>
            )}
          </span>
        </div>
      )}

      <div
        className="pointer-events-auto absolute right-4 bottom-4 flex flex-col gap-1"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <button
          onClick={onZoomIn}
          aria-label="Zoom in"
          className="border-border bg-background/80 text-foreground hover:border-grass/50 flex h-10 w-10 items-center justify-center rounded-md border-2 text-lg backdrop-blur-sm"
        >
          +
        </button>
        <button
          onClick={onZoomOut}
          aria-label="Zoom out"
          className="border-border bg-background/80 text-foreground hover:border-grass/50 flex h-10 w-10 items-center justify-center rounded-md border-2 text-lg backdrop-blur-sm"
        >
          −
        </button>
      </div>

      {nearest?.inRange && (
        <button
          onClick={() => onInteract(nearest.interactable.id)}
          className="border-grass/50 bg-background/90 text-foreground pointer-events-auto absolute bottom-24 left-1/2 -translate-x-1/2 rounded-md border-2 px-4 py-2 font-mono text-sm backdrop-blur-sm"
        >
          {isTouch ? "Tap to open" : `[E] ${nearest.interactable.label}`}
        </button>
      )}
    </div>
  );
}
