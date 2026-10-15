"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { TextRoll } from "@/components/motion-primitives/text-roll";
import { getRegion } from "@/content/regions";
import type { RegionSlug, Tile } from "./map";
import type { Interactable } from "./interaction";
import type { PlayerHandle } from "./Player";
import { Minimap } from "./Minimap";
import { HelpDialog } from "./HelpDialog";

export interface HudProps {
  region: RegionSlug | "home";
  nearest: { interactable: Interactable; inRange: boolean } | null;
  isTouch: boolean;
  onInteract: (id: string) => void;
  reducedMotion: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  controlsHintVisible: boolean;
  helpOpen: boolean;
  onHelpOpenChange: (open: boolean) => void;
  onReplayIntro: () => void;
  tiles: Tile[][];
  playerRef: React.RefObject<PlayerHandle | null>;
  minimapCollapsed: boolean;
  onToggleMinimap: () => void;
  onFastTravel: (regionSlug: string) => void;
}

export function Hud({
  region,
  nearest,
  isTouch,
  onInteract,
  reducedMotion,
  onZoomIn,
  onZoomOut,
  controlsHintVisible,
  helpOpen,
  onHelpOpenChange,
  onReplayIntro,
  tiles,
  playerRef,
  minimapCollapsed,
  onToggleMinimap,
  onFastTravel,
}: HudProps) {
  const [bannerRegion, setBannerRegion] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setBannerRegion(region));
    const t = setTimeout(() => setBannerRegion(null), 1500);
    return () => clearTimeout(t);
  }, [region]);

  const regionInfo = getRegion(region);
  const chipLabel = region === "home" ? "Plaza" : regionInfo.label;
  const chipEmoji = region === "home" ? "🏛️" : regionInfo.emoji;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Top-left: persistent region chip, updates as the player walks
          between regions (separate from the 1.5s banner below, which only
          flashes on a region *change*). */}
      <div
        className="absolute top-4 left-4"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="border-border bg-background/80 text-foreground flex items-center gap-1.5 rounded-md border-2 px-3 py-1.5 font-mono text-xs backdrop-blur-sm">
          <span>{chipEmoji}</span>
          <span>{chipLabel}</span>
        </div>
      </div>

      {/* Top-right: Classic view + help. */}
      <div
        className="pointer-events-auto absolute top-4 right-4 flex items-center gap-2"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <Link
          href="/classic"
          className="border-border bg-background/80 text-foreground hover:border-grass/50 rounded-md border-2 px-3 py-1.5 font-mono text-xs backdrop-blur-sm"
        >
          Classic view
        </Link>
        <button
          onClick={() => onHelpOpenChange(true)}
          aria-label="Help"
          className="border-border bg-background/80 text-foreground hover:border-grass/50 flex h-8 w-8 items-center justify-center rounded-md border-2 font-mono text-sm backdrop-blur-sm"
        >
          ?
        </button>
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

      {/* Bottom-left: controls hint, fades after the first move ("?" brings
          it back along with the help dialog). */}
      <div
        className="absolute bottom-4 left-4 max-w-[60%] transition-opacity duration-700 sm:max-w-none"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          opacity: controlsHintVisible ? 1 : 0,
        }}
        aria-hidden={!controlsHintVisible}
      >
        <div className="border-border bg-background/80 text-muted-foreground rounded-md border-2 px-3 py-1.5 font-mono text-xs backdrop-blur-sm">
          {isTouch
            ? "Tap to move · tap objects to open"
            : "WASD / click to move · E to open · M map"}
        </div>
      </div>

      {/* Bottom-right: minimap above the zoom buttons. */}
      <div
        className="pointer-events-auto absolute right-4 bottom-4 flex flex-col items-end gap-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <Minimap
          tiles={tiles}
          playerRef={playerRef}
          region={region}
          onFastTravel={onFastTravel}
          collapsed={minimapCollapsed}
          onToggleCollapsed={onToggleMinimap}
        />
        <div className="flex flex-col gap-1">
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
      </div>

      {nearest?.inRange && (
        <button
          onClick={() => onInteract(nearest.interactable.id)}
          className="border-grass/50 bg-background/90 text-foreground pointer-events-auto absolute bottom-24 left-1/2 -translate-x-1/2 rounded-md border-2 px-4 py-2 font-mono text-sm backdrop-blur-sm"
        >
          {isTouch ? "Tap to open" : `[E] ${nearest.interactable.label}`}
        </button>
      )}

      <HelpDialog
        open={helpOpen}
        onOpenChange={onHelpOpenChange}
        isTouch={isTouch}
        onReplayIntro={onReplayIntro}
      />
    </div>
  );
}
