/**
 * Deterministic 48x48 island grid. Seeded RNG so the same layout generates
 * every time — no need to persist/serialize the map anywhere.
 *
 * Screen-compass layout: the camera looks along -x,-z (positioned at
 * +x,+y,+z looking toward the origin). For a point offset (dx, dz) from the
 * plaza centre, the screen-space position works out to:
 *   screen-right  ∝ dx - dz
 *   screen-up     ∝ -dx - dz
 * So the four pure screen directions land on the four *diagonal* corners of
 * the grid, not the cardinal edges — a straight "north" offset actually
 * reads as upper-right on screen, not up. This is why region anchors below
 * sit at diagonal offsets from the plaza, not along +x/-x/+z/-z.
 *
 * Every building's door should be on a camera-visible face — for this camera
 * that's only ever +x or +z (the +y top is also visible but irrelevant to a
 * door). Lab, Arcade and Workshop each have an unambiguous choice (their
 * plaza-ward direction has a positive x or z component).
 *
 * Park is different: it's an open clearing (pond, benches, lamps), not a
 * building, so there's no door to orient. Its `doorFacing` is reused purely
 * as a layout axis — the same tangent/forward math that rows out pedestals
 * in `content-placement.ts` also rows out Park's hobby props and points them
 * toward the camera-visible +z side, so they read clearly instead of being
 * scattered. +z also keeps Park's road approach consistent with Lab/Arcade.
 */

export const GRID_SIZE = 48;
export const TILE = 1;

export type Tile = "water" | "sand" | "grass" | "path" | "building" | "plaza";

export type RegionSlug = "lab" | "arcade" | "workshop" | "park";

export interface RegionAnchor {
  slug: RegionSlug;
  /** Tile-space centre of the building footprint. */
  x: number;
  z: number;
  /**
   * Outward normal of the door/sign face, in tile units. For Park — which
   * has no building — this is just the layout axis its props and road
   * approach face, not a literal door.
   */
  doorFacing: { x: number; z: number };
}

export const PLAZA_CENTER = { x: 24, z: 24 };
export const BUILDING_HALF_SIZE = 2; // 4x4 footprint

export const REGION_ANCHORS: RegionAnchor[] = [
  { slug: "lab", x: 12, z: 12, doorFacing: { x: 0, z: 1 } },
  { slug: "arcade", x: 36, z: 12, doorFacing: { x: 0, z: 1 } },
  { slug: "workshop", x: 12, z: 36, doorFacing: { x: 1, z: 0 } },
  { slug: "park", x: 36, z: 36, doorFacing: { x: 0, z: 1 } },
];

// Small plaza landmarks — not blocking footprints, just prop anchors.
export const HOUSE_POS = { x: 22, z: 24 };
export const SIGNPOST_POS = { x: 24, z: 22 };
export const MAILBOX_POS = { x: 26, z: 24 };

/** Mulberry32 — tiny, fast, deterministic for a given seed. */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface MapData {
  tiles: Tile[][]; // [x][z]
  decorations: { x: number; z: number; kind: "tree" | "rock" | "flower" }[];
}

/** Where the road from the plaza meets a region: the literal door for
 * Lab/Arcade/Workshop, or just the clearing's edge for Park (no door). */
function approachTile(anchor: RegionAnchor) {
  return {
    x: anchor.x + anchor.doorFacing.x * (BUILDING_HALF_SIZE + 1),
    z: anchor.z + anchor.doorFacing.z * (BUILDING_HALF_SIZE + 1),
  };
}

function carveLPath(
  tiles: Tile[][],
  from: { x: number; z: number },
  to: { x: number; z: number },
) {
  // Horizontal leg at `from.z`, then vertical leg at `to.x` — a simple
  // two-tile-wide L so it reads clearly as a road.
  const xMin = Math.min(from.x, to.x);
  const xMax = Math.max(from.x, to.x);
  for (let x = xMin; x <= xMax; x++) {
    for (const dz of [0, 1]) {
      setPath(tiles, x, from.z + dz);
    }
  }
  const zMin = Math.min(from.z, to.z);
  const zMax = Math.max(from.z, to.z);
  for (let z = zMin; z <= zMax; z++) {
    for (const dx of [0, 1]) {
      setPath(tiles, to.x + dx, z);
    }
  }
}

function setPath(tiles: Tile[][], x: number, z: number) {
  if (x < 0 || x >= GRID_SIZE || z < 0 || z >= GRID_SIZE) return;
  if (tiles[x][z] === "water" || tiles[x][z] === "sand") return;
  tiles[x][z] = "path";
}

export function generateMap(seed = 1337): MapData {
  const rand = mulberry32(seed);
  const tiles: Tile[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => "grass" as Tile),
  );

  // Water border + sand shore.
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let z = 0; z < GRID_SIZE; z++) {
      const edgeDist = Math.min(x, z, GRID_SIZE - 1 - x, GRID_SIZE - 1 - z);
      if (edgeDist < 2) tiles[x][z] = "water";
      else if (edgeDist < 4) tiles[x][z] = "sand";
    }
  }

  // Plaza (open square at the centre).
  for (let x = PLAZA_CENTER.x - 3; x <= PLAZA_CENTER.x + 3; x++) {
    for (let z = PLAZA_CENTER.z - 3; z <= PLAZA_CENTER.z + 3; z++) {
      if (tiles[x]?.[z]) tiles[x][z] = "plaza";
    }
  }

  // Footprints: a 4x4 unwalkable block per region. For Lab/Arcade/Workshop
  // this is the building; for Park (no building) it's the pond clearing —
  // same blocking rules apply either way, it's just not a structure there.
  for (const anchor of REGION_ANCHORS) {
    for (
      let x = anchor.x - BUILDING_HALF_SIZE;
      x <= anchor.x + BUILDING_HALF_SIZE;
      x++
    ) {
      for (
        let z = anchor.z - BUILDING_HALF_SIZE;
        z <= anchor.z + BUILDING_HALF_SIZE;
        z++
      ) {
        if (tiles[x]?.[z]) tiles[x][z] = "building";
      }
    }
  }

  // L-shaped roads from the plaza edge to each region's approach tile.
  for (const anchor of REGION_ANCHORS) {
    const approach = approachTile(anchor);
    carveLPath(tiles, { x: PLAZA_CENTER.x, z: PLAZA_CENTER.z }, approach);
  }

  // Decorations: scattered on plain grass only (never path/plaza/building/shore).
  const decorations: MapData["decorations"] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let z = 0; z < GRID_SIZE; z++) {
      if (tiles[x][z] !== "grass") continue;
      const roll = rand();
      if (roll < 0.04) decorations.push({ x, z, kind: "tree" });
      else if (roll < 0.06) decorations.push({ x, z, kind: "rock" });
      else if (roll < 0.09) decorations.push({ x, z, kind: "flower" });
    }
  }

  return { tiles, decorations };
}

export function isWalkable(tiles: Tile[][], x: number, z: number): boolean {
  if (x < 0 || x >= GRID_SIZE || z < 0 || z >= GRID_SIZE) return false;
  const t = tiles[x][z];
  return t !== "water" && t !== "building";
}

export function getRegionAt(x: number, z: number): RegionSlug | "home" {
  for (const anchor of REGION_ANCHORS) {
    if (Math.abs(x - anchor.x) <= 6 && Math.abs(z - anchor.z) <= 6)
      return anchor.slug;
  }
  return "home";
}
