import { GRID_SIZE, isWalkable, type Tile } from "./map";

interface Node {
  x: number;
  z: number;
  g: number;
  f: number;
  parent: Node | null;
}

const NEIGHBORS = [
  { x: 1, z: 0 },
  { x: -1, z: 0 },
  { x: 0, z: 1 },
  { x: 0, z: -1 },
];

function heuristic(ax: number, az: number, bx: number, bz: number): number {
  return Math.abs(ax - bx) + Math.abs(az - bz);
}

/** A* over the tile grid. 48x48 is small enough for real-time pathing with
 * no further optimization. Returns null if no path exists. */
export function findPath(
  tiles: Tile[][],
  start: { x: number; z: number },
  goal: { x: number; z: number },
): { x: number; z: number }[] | null {
  const startX = Math.round(start.x);
  const startZ = Math.round(start.z);
  const goalX = Math.round(goal.x);
  const goalZ = Math.round(goal.z);

  if (!isWalkable(tiles, goalX, goalZ)) return null;

  const key = (x: number, z: number) => x * GRID_SIZE + z;
  const open = new Map<number, Node>();
  const closed = new Set<number>();

  const startNode: Node = {
    x: startX,
    z: startZ,
    g: 0,
    f: heuristic(startX, startZ, goalX, goalZ),
    parent: null,
  };
  open.set(key(startX, startZ), startNode);

  // 48x48 = 2304 tiles max, no need for a priority queue at this scale.
  let guard = 0;
  while (open.size > 0 && guard++ < 5000) {
    let current: Node | null = null;
    for (const node of open.values()) {
      if (!current || node.f < current.f) current = node;
    }
    if (!current) break;

    if (current.x === goalX && current.z === goalZ) {
      const path: { x: number; z: number }[] = [];
      let n: Node | null = current;
      while (n) {
        path.unshift({ x: n.x, z: n.z });
        n = n.parent;
      }
      return path;
    }

    open.delete(key(current.x, current.z));
    closed.add(key(current.x, current.z));

    for (const d of NEIGHBORS) {
      const nx = current.x + d.x;
      const nz = current.z + d.z;
      if (closed.has(key(nx, nz))) continue;
      if (!isWalkable(tiles, nx, nz)) continue;

      const g = current.g + 1;
      const existing = open.get(key(nx, nz));
      if (existing && g >= existing.g) continue;

      open.set(key(nx, nz), {
        x: nx,
        z: nz,
        g,
        f: g + heuristic(nx, nz, goalX, goalZ),
        parent: current,
      });
    }
  }

  return null;
}
