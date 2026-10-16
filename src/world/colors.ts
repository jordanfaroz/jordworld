// Token colors where they map cleanly; dirt/wood/roof are fixed natural
// tones since there's no sensible token for them.
//
// "Golden hour" pass: these were originally tuned for a dim dusk look that
// read as gloomy once the island filled in with buildings — grass and walls
// especially disappeared into near-black. Brightened across the board; the
// night-navy sky (Canvas background/fog in World.tsx) is untouched, it's
// meant to stay dark beyond the lit island.
export const WORLD_COLORS = {
  water: "#2f6690",
  sand: "#e8d19c",
  grass: "#4a9e4f",
  path: "#a68e68", // dirt
  plaza: "#b5a480",
  buildingWall: "#4b5468", // neutral trim: player pants, lamp poles, mailbox post, chimney
  buildingRoof: "#8a5a3c", // shared roof base for arcade/workshop/house cones
  wood: "#8a6a4a",
  treeTrunk: "#6b4a30",
  treeLeaves: "#3d8a52",
  rock: "#787f8c",
  // Sparse varied flowers instead of one uniform color — picked per-instance
  // in Terrain.tsx via instanceColor, not a separate draw call each.
  flowerColors: ["#f4c430", "#f5f5f0", "#f472b6", "#a78bfa"],
  statusLive: "#4ade80",
  statusInDev: "#fbbf24",
  statusComingSoon: "#8b96ab",
  neonSign: "#22d3ee",
  playerBody: "#4ade80",
  playerSkin: "#e8c39e",
  // Per-region building identity (Buildings.tsx) — walls/roofs stay single
  // shared Instances groups (one material each) with these applied as
  // per-instance vertex colors, not separate draw calls per region.
  labWall: "#eef0f3",
  labRoof: "#d7eef2", // pale cyan-grey, "light-grey + cyan accents"
  arcadeWall: "#8b3fd1",
  arcadeRoof: "#5b2191",
  arcadeNeon: "#ef4fd6",
  workshopWall: "#9c7a54",
  workshopRoof: "#6b5540",
  forgeGlow: "#f59e0b",
  houseWall: "#d4a373",
  houseRoof: "#a63d40",
} as const;
