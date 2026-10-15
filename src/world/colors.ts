// Token colors where they map cleanly; dirt/wood/roof are fixed natural
// tones since there's no sensible token for them.
export const WORLD_COLORS = {
  water: "#1a3a5c",
  sand: "#d9c38a",
  grass: "#3a8c5a",
  path: "#8a7a5c", // dirt
  plaza: "#9c8a68",
  buildingWall: "#2a2f45",
  buildingRoof: "#6b4a3a", // fixed roof tone
  wood: "#6b4a3a",
  treeTrunk: "#5a3d2a",
  treeLeaves: "#2f6b45",
  rock: "#5a5f6b",
  flower: "#e05a8a",
  statusLive: "#4ade80",
  statusInDev: "#fbbf24",
  statusComingSoon: "#8b96ab",
  neonSign: "#22d3ee",
  playerBody: "#4ade80",
  playerSkin: "#e8c39e",
} as const;
