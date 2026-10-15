import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { GRID_SIZE, type MapData, type Tile } from "./map";
import { WORLD_COLORS } from "./colors";

const TILE_COLOR: Record<Tile, string> = {
  water: WORLD_COLORS.water,
  sand: WORLD_COLORS.sand,
  grass: WORLD_COLORS.grass,
  path: WORLD_COLORS.path,
  plaza: WORLD_COLORS.plaza,
  building: WORLD_COLORS.plaza, // ground under a building — the building mesh sits on top
};

const TILE_TYPES: Tile[] = [
  "water",
  "sand",
  "grass",
  "path",
  "plaza",
  "building",
];

function tileToWorld(x: number, z: number) {
  return [x - GRID_SIZE / 2 + 0.5, 0, z - GRID_SIZE / 2 + 0.5] as const;
}

/** One InstancedMesh per tile type — a handful of draw calls for the whole
 * 48x48 island instead of 2304 individual meshes. */
function TileLayer({ tiles, type }: { tiles: MapData["tiles"]; type: Tile }) {
  const positions = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        if (tiles[x][z] === type) out.push([x, z]);
      }
    }
    return out;
  }, [tiles, type]);

  const ref = useRef<THREE.InstancedMesh>(null);
  const height = type === "water" ? 0.3 : 0.2;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    positions.forEach(([x, z], i) => {
      const [wx, , wz] = tileToWorld(x, z);
      matrix.setPosition(wx, height / 2, wz);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [positions, height]);

  if (positions.length === 0) return null;

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, positions.length]}
      receiveShadow
    >
      <boxGeometry args={[1, height, 1]} />
      <meshStandardMaterial color={TILE_COLOR[type]} />
    </instancedMesh>
  );
}

function Decorations({ decorations }: { decorations: MapData["decorations"] }) {
  const trees = useMemo(
    () => decorations.filter((d) => d.kind === "tree"),
    [decorations],
  );
  const rocks = useMemo(
    () => decorations.filter((d) => d.kind === "rock"),
    [decorations],
  );
  const flowers = useMemo(
    () => decorations.filter((d) => d.kind === "flower"),
    [decorations],
  );

  return (
    <>
      <DecorationLayer
        items={trees}
        partHeight={0.8}
        partColor={WORLD_COLORS.treeTrunk}
        yOffset={0.4}
        scale={0.3}
      />
      <DecorationLayer
        items={trees}
        partHeight={0.9}
        partColor={WORLD_COLORS.treeLeaves}
        yOffset={1.1}
        scale={0.8}
      />
      <DecorationLayer
        items={rocks}
        partHeight={0.4}
        partColor={WORLD_COLORS.rock}
        yOffset={0.2}
        scale={0.5}
      />
      <DecorationLayer
        items={flowers}
        partHeight={0.2}
        partColor={WORLD_COLORS.flower}
        yOffset={0.1}
        scale={0.2}
      />
    </>
  );
}

function DecorationLayer({
  items,
  partHeight,
  partColor,
  yOffset,
  scale,
}: {
  items: { x: number; z: number }[];
  partHeight: number;
  partColor: string;
  yOffset: number;
  scale: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    items.forEach(({ x, z }, i) => {
      const [wx, , wz] = tileToWorld(x, z);
      matrix.makeScale(scale, scale, scale);
      matrix.setPosition(wx, 0.2 + yOffset, wz);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [items, scale, yOffset]);

  if (items.length === 0) return null;

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, items.length]}
      castShadow
    >
      <boxGeometry args={[1, partHeight, 1]} />
      <meshStandardMaterial color={partColor} />
    </instancedMesh>
  );
}

export function Terrain({ map }: { map: MapData }) {
  return (
    <group>
      {TILE_TYPES.map((type) => (
        <TileLayer key={type} tiles={map.tiles} type={type} />
      ))}
      <Decorations decorations={map.decorations} />
    </group>
  );
}

export { tileToWorld };
