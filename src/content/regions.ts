import type { RegionInfo } from "./types";

export const regions: RegionInfo[] = [
  { slug: "home", emoji: "🏠", label: "Home Plaza" },
  { slug: "lab", emoji: "🔭", label: "The Lab" },
  { slug: "arcade", emoji: "🕹️", label: "The Arcade" },
  { slug: "workshop", emoji: "⚒️", label: "The Workshop" },
  { slug: "park", emoji: "🌳", label: "Off-World Park" },
];

export function getRegion(slug: RegionInfo["slug"]): RegionInfo {
  const region = regions.find((r) => r.slug === slug);
  if (!region) throw new Error(`Unknown region: ${slug}`);
  return region;
}
