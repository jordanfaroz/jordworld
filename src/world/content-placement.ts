import { getProjectsByRegion } from "@/content/projects";
import { hobbies } from "@/content/hobbies";
import { BUILDING_HALF_SIZE, REGION_ANCHORS, type RegionAnchor } from "./map";
import type { Project } from "@/content/types";
import type { Hobby } from "@/content/types";

export const MAX_PER_REGION = 8;

export interface PedestalPlacement {
  project: Project;
  x: number;
  z: number;
}

export interface HobbyPlacement {
  hobby: Hobby;
  x: number;
  z: number;
}

/** Up to 8 slots in a 4-wide, 2-deep grid on the building's door-facing
 * side — adding a project to projects.ts makes it appear here automatically,
 * nothing in the world needs to change. */
function slotPositions(
  anchor: RegionAnchor,
  count: number,
): { x: number; z: number }[] {
  const slots: { x: number; z: number }[] = [];
  const { doorFacing } = anchor;
  // Tangent direction (perpendicular to the door normal) for spreading
  // pedestals side to side.
  const tangent = { x: doorFacing.z, z: -doorFacing.x };
  const rowSpacing = 2;
  const colSpacing = 2;

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const colOffset = col - 1.5; // centers 4 columns around the anchor
    const forward = BUILDING_HALF_SIZE + 2 + row * rowSpacing;
    slots.push({
      x: anchor.x + doorFacing.x * forward + tangent.x * colOffset * colSpacing,
      z: anchor.z + doorFacing.z * forward + tangent.z * colOffset * colSpacing,
    });
  }
  return slots;
}

export function getPedestalPlacements(): PedestalPlacement[] {
  const placements: PedestalPlacement[] = [];

  for (const anchor of REGION_ANCHORS) {
    if (anchor.slug === "park") continue; // Park holds hobbies, not projects.
    const projects = getProjectsByRegion(anchor.slug);
    if (projects.length > MAX_PER_REGION) {
      console.warn(
        `[world] ${anchor.slug} has ${projects.length} projects, only showing the first ${MAX_PER_REGION}`,
      );
    }
    const slots = slotPositions(
      anchor,
      Math.min(projects.length, MAX_PER_REGION),
    );
    projects.slice(0, MAX_PER_REGION).forEach((project, i) => {
      placements.push({ project, ...slots[i] });
    });
  }

  return placements;
}

export function getHobbyPlacements(): HobbyPlacement[] {
  const parkAnchor = REGION_ANCHORS.find((a) => a.slug === "park")!;
  if (hobbies.length > MAX_PER_REGION) {
    console.warn(
      `[world] park has ${hobbies.length} hobbies, only showing the first ${MAX_PER_REGION}`,
    );
  }
  const slots = slotPositions(
    parkAnchor,
    Math.min(hobbies.length, MAX_PER_REGION),
  );
  return hobbies
    .slice(0, MAX_PER_REGION)
    .map((hobby, i) => ({ hobby, ...slots[i] }));
}
