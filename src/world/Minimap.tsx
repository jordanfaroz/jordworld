"use client";

import { useEffect, useMemo, useRef } from "react";

import { GRID_SIZE, REGION_ANCHORS, type Tile, type RegionSlug } from "./map";
import { getRegion } from "@/content/regions";
import type { PlayerHandle } from "./Player";

const GRID_OFFSET = GRID_SIZE / 2;
const VIEW = 168; // svg viewBox units
const SAMPLE_STEP = 2; // every 2nd tile — plenty of fidelity at this size, 1/4 the rects
const CELL = SAMPLE_STEP * 1.9; // slight overlap so sampled cells tile without gaps

// Same screen-compass transform as map.ts's big comment: screen-right ∝
// dx - dz, screen-up ∝ -(dx + dz). Used for every point on the minimap (the
// tile mosaic, region markers, the player dot and its facing arrow) so it
// all stays internally consistent *and* matches what the 3D camera shows.
function toScreen(dx: number, dz: number) {
  return { right: dx - dz, down: dx + dz };
}

const WATER_COLOR = "#1a3a5c";
const PATH_COLOR = "#8a7a5c";
const LAND_COLOR = "#2f6b45";
const TILE_MM_COLOR: Partial<Record<Tile, string>> = {
  water: WATER_COLOR,
  path: PATH_COLOR,
};

export interface MinimapProps {
  tiles: Tile[][];
  playerRef: React.RefObject<PlayerHandle | null>;
  region: RegionSlug | "home";
  onFastTravel: (regionSlug: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Minimap({
  tiles,
  playerRef,
  region,
  onFastTravel,
  collapsed,
  onToggleCollapsed,
}: MinimapProps) {
  const { cells, scale } = useMemo(() => {
    const raw: { x: number; y: number; color: string }[] = [];
    let maxExtent = 1;
    for (let x = 0; x < GRID_SIZE; x += SAMPLE_STEP) {
      for (let z = 0; z < GRID_SIZE; z += SAMPLE_STEP) {
        const t = tiles[x]?.[z];
        if (!t) continue;
        const { right, down } = toScreen(x - GRID_OFFSET, z - GRID_OFFSET);
        maxExtent = Math.max(maxExtent, Math.abs(right), Math.abs(down));
        raw.push({ x: right, y: down, color: TILE_MM_COLOR[t] ?? LAND_COLOR });
      }
    }
    const half = VIEW / 2 - CELL;
    const s = half / maxExtent;
    return {
      cells: raw.map((c) => ({ ...c, x: c.x * s, y: c.y * s })),
      scale: s,
    };
  }, [tiles]);

  const markers = useMemo(
    () =>
      REGION_ANCHORS.map((a) => {
        const { right, down } = toScreen(a.x - GRID_OFFSET, a.z - GRID_OFFSET);
        return {
          slug: a.slug,
          x: right * scale,
          y: down * scale,
          emoji: getRegion(a.slug).emoji,
        };
      }),
    [scale],
  );

  const dotRef = useRef<SVGCircleElement>(null);
  const arrowRef = useRef<SVGPathElement>(null);

  // Imperative rAF loop, not React state: the player moves continuously and
  // we don't want a setState (and the re-render it triggers) every frame —
  // same reasoning as reading playerRef.current.position elsewhere.
  useEffect(() => {
    if (collapsed) return;
    let raf = 0;
    const tick = () => {
      const player = playerRef.current;
      const dot = dotRef.current;
      if (player && dot) {
        const { right, down } = toScreen(player.position.x, player.position.z);
        const cx = VIEW / 2 + right * scale;
        const cy = VIEW / 2 + down * scale;
        dot.setAttribute("cx", String(cx));
        dot.setAttribute("cy", String(cy));
        const arrow = arrowRef.current;
        if (arrow) {
          const facing = player.facing.current;
          const dir = toScreen(Math.sin(facing), Math.cos(facing));
          const angleDeg = (Math.atan2(dir.right, dir.down) * 180) / Math.PI;
          arrow.setAttribute(
            "transform",
            `translate(${cx} ${cy}) rotate(${angleDeg})`,
          );
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playerRef, scale, collapsed]);

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapsed}
        aria-label="Show map"
        className="border-border bg-background/80 text-foreground hover:border-grass/50 flex h-10 w-10 items-center justify-center rounded-md border-2 text-lg backdrop-blur-sm"
      >
        🗺️
      </button>
    );
  }

  return (
    <div className="border-border bg-background/90 relative rounded-md border-2 p-1 backdrop-blur-sm">
      <button
        onClick={onToggleCollapsed}
        aria-label="Hide map"
        className="text-muted-foreground hover:text-foreground absolute top-1.5 right-1.5 z-10 font-mono text-xs leading-none"
      >
        ✕
      </button>
      <svg
        width={VIEW}
        height={VIEW}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="h-36 w-36 sm:h-40 sm:w-40"
        role="img"
        aria-label={`Minimap — currently in ${region === "home" ? "the plaza" : getRegion(region).label}`}
      >
        <rect width={VIEW} height={VIEW} fill={WATER_COLOR} rx={6} />
        {cells.map((c, i) => (
          <rect
            key={i}
            x={VIEW / 2 + c.x - CELL / 2}
            y={VIEW / 2 + c.y - CELL / 2}
            width={CELL}
            height={CELL}
            fill={c.color}
          />
        ))}
        {markers.map((m) => (
          <g
            key={m.slug}
            transform={`translate(${VIEW / 2 + m.x} ${VIEW / 2 + m.y})`}
            onClick={() => onFastTravel(m.slug)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onFastTravel(m.slug);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Fast travel to ${getRegion(m.slug).label}`}
            className="focus-visible:outline-grass cursor-pointer focus-visible:outline-2"
          >
            <circle
              r={10}
              fill="#0b1020"
              stroke={region === m.slug ? "#4ade80" : "#2a2f45"}
              strokeWidth={2}
            />
            <text textAnchor="middle" dominantBaseline="central" fontSize={11}>
              {m.emoji}
            </text>
          </g>
        ))}
        <path
          ref={arrowRef}
          d="M 0 -9 L 4 0 L -4 0 Z"
          fill="#e8e8e8"
          stroke="#0b1020"
          strokeWidth={0.5}
        />
        <circle
          ref={dotRef}
          r={3.5}
          fill="#4ade80"
          stroke="#ffffff"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}
