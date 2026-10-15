import { GRID_SIZE, MAILBOX_POS, SIGNPOST_POS } from "./map";
import type { PedestalPlacement, HobbyPlacement } from "./content-placement";

const GRID_OFFSET = GRID_SIZE / 2;

export type InteractableKind = "project" | "hobby" | "signpost" | "mailbox";

export interface Interactable {
  id: string;
  kind: InteractableKind;
  label: string;
  worldX: number;
  worldZ: number;
}

// 2.2, not a smaller "feels right" number: the signpost and mailbox sit 2
// world units from the plaza-centre spawn point, and the player should be
// able to interact with either immediately on arrival without nudging first.
export const INTERACT_RANGE = 2.2;

export function buildInteractables(
  pedestals: PedestalPlacement[],
  hobbies: HobbyPlacement[],
): Interactable[] {
  const list: Interactable[] = [];

  for (const p of pedestals) {
    list.push({
      id: `project:${p.project.slug}`,
      kind: "project",
      label: p.project.title,
      worldX: p.x - GRID_OFFSET,
      worldZ: p.z - GRID_OFFSET,
    });
  }
  for (const h of hobbies) {
    list.push({
      id: `hobby:${h.hobby.slug}`,
      kind: "hobby",
      label: h.hobby.title,
      worldX: h.x - GRID_OFFSET,
      worldZ: h.z - GRID_OFFSET,
    });
  }
  list.push({
    id: "signpost",
    kind: "signpost",
    label: "Signpost",
    worldX: SIGNPOST_POS.x - GRID_OFFSET,
    worldZ: SIGNPOST_POS.z - GRID_OFFSET,
  });
  list.push({
    id: "mailbox",
    kind: "mailbox",
    label: "Mailbox",
    worldX: MAILBOX_POS.x - GRID_OFFSET,
    worldZ: MAILBOX_POS.z - GRID_OFFSET,
  });

  return list;
}

export function findNearest(
  interactables: Interactable[],
  playerX: number,
  playerZ: number,
): { interactable: Interactable; distance: number } | null {
  let best: { interactable: Interactable; distance: number } | null = null;
  for (const item of interactables) {
    const dx = item.worldX - playerX;
    const dz = item.worldZ - playerZ;
    const distance = Math.sqrt(dx * dx + dz * dz);
    if (!best || distance < best.distance)
      best = { interactable: item, distance };
  }
  return best;
}
