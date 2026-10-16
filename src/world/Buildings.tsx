import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instances, Instance, Html } from "@react-three/drei";
import type * as THREE from "three";

import {
  BUILDING_HALF_SIZE,
  GRID_SIZE,
  HOUSE_POS,
  MAILBOX_POS,
  REGION_ANCHORS,
  SIGNPOST_POS,
} from "./map";
import { WORLD_COLORS } from "./colors";
import { getRegion } from "@/content/regions";
import type { PedestalPlacement, HobbyPlacement } from "./content-placement";
import type { Project } from "@/content/types";

const GRID_OFFSET = GRID_SIZE / 2;
const LABEL_RANGE = 5; // tiles — pedestal name labels fade in within this distance, or on hover

function toWorld(x: number, z: number): [number, number, number] {
  return [x - GRID_OFFSET, 0, z - GRID_OFFSET];
}

const STATUS_COLOR: Record<Project["status"], string> = {
  live: WORLD_COLORS.statusLive,
  "in-dev": WORLD_COLORS.statusInDev,
  "coming-soon": WORLD_COLORS.statusComingSoon,
};

/**
 * Everything static (walls, roofs, signs, benches, lamp poles) is grouped
 * into one `<Instances>` draw call per geometry+material combination — a
 * unit box/cone scaled per instance, not a unique mesh per building. Draw
 * calls were 118 before the Phase 3 instancing pass; the goal is <=40 on
 * desktop. Per-region wall/roof color comes from per-instance `color`
 * (vertex color multiplying a white base material), not separate materials
 * — so four differently-colored buildings still cost one draw call for
 * walls and one for roofs, not four of each. The one exception is Arcade's
 * marquee: a true saturated magenta glow needs its own emissive uniform,
 * which vertex color can't give it, so it's a small dedicated group.
 *
 * Only the player casts a real shadow (see Lighting.tsx / World.tsx) — every
 * shadow-casting object gets rendered a second time for the shadow-map pass,
 * so leaving castShadow off everything static roughly halves what would
 * otherwise be the dominant cost here.
 *
 * Building/pedestal labels use drei's <Html> — a DOM overlay tracking the
 * 3D position, not a mesh — so they cost zero draw calls no matter how many
 * there are.
 */
export function Buildings({
  pedestals,
  hobbies,
  onInteract,
  onHover,
  playerPositionRef,
  hoveredIdRef,
}: {
  pedestals: PedestalPlacement[];
  hobbies: HobbyPlacement[];
  onInteract: (id: string) => void;
  onHover: (id: string | null) => void;
  playerPositionRef: React.RefObject<THREE.Vector3>;
  hoveredIdRef: React.RefObject<string | null>;
}) {
  const hoverHandlers = (id: string) => ({
    onPointerOver: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onHover(id);
    },
    onPointerOut: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onHover(null);
    },
  });

  const labAnchor = REGION_ANCHORS.find((a) => a.slug === "lab")!;
  const arcadeAnchor = REGION_ANCHORS.find((a) => a.slug === "arcade")!;
  const workshopAnchor = REGION_ANCHORS.find((a) => a.slug === "workshop")!;
  const parkAnchor = REGION_ANCHORS.find((a) => a.slug === "park")!;

  const buildingSize = BUILDING_HALF_SIZE * 2;
  const [labX, , labZ] = toWorld(labAnchor.x, labAnchor.z);
  const [arcadeX, , arcadeZ] = toWorld(arcadeAnchor.x, arcadeAnchor.z);
  const [workshopX, , workshopZ] = toWorld(workshopAnchor.x, workshopAnchor.z);
  const [houseX, , houseZ] = toWorld(HOUSE_POS.x, HOUSE_POS.z);
  const [pondX, , pondZ] = toWorld(parkAnchor.x, parkAnchor.z);
  const [signpostX, , signpostZ] = toWorld(SIGNPOST_POS.x, SIGNPOST_POS.z);
  const [mailboxX, , mailboxZ] = toWorld(MAILBOX_POS.x, MAILBOX_POS.z);

  const arcadeDoorAngle = Math.atan2(
    arcadeAnchor.doorFacing.x,
    arcadeAnchor.doorFacing.z,
  );
  const workshopDoorAngle = Math.atan2(
    workshopAnchor.doorFacing.x,
    workshopAnchor.doorFacing.z,
  );

  const signPos = (
    anchor: typeof labAnchor,
    x: number,
    z: number,
  ): [number, number, number] => [
    x + anchor.doorFacing.x * (BUILDING_HALF_SIZE + 0.05),
    1.6,
    z + anchor.doorFacing.z * (BUILDING_HALF_SIZE + 0.05),
  ];
  const signAngle = (anchor: typeof labAnchor) =>
    Math.atan2(anchor.doorFacing.x, anchor.doorFacing.z);

  const lab = getRegion("lab");
  const arcade = getRegion("arcade");
  const workshop = getRegion("workshop");

  return (
    <group>
      {/* Walls: 3 region buildings + the house, one box geometry scaled per
          instance, tinted per-instance for each building's identity. */}
      <Instances limit={4} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
        <Instance
          position={[labX, buildingSize / 2, labZ]}
          scale={[buildingSize, buildingSize, buildingSize]}
          color={WORLD_COLORS.labWall}
        />
        <Instance
          position={[arcadeX, buildingSize / 2, arcadeZ]}
          scale={[buildingSize, buildingSize, buildingSize]}
          color={WORLD_COLORS.arcadeWall}
        />
        <Instance
          position={[workshopX, buildingSize / 2, workshopZ]}
          scale={[buildingSize, buildingSize, buildingSize]}
          color={WORLD_COLORS.workshopWall}
        />
        <Instance
          position={[houseX, 0.6, houseZ]}
          scale={[1.6, 1.2, 1.6]}
          color={WORLD_COLORS.houseWall}
        />
      </Instances>

      {/* Roofs: Arcade + Workshop + House cones (Lab's dome is unique, kept
          separate below), also per-instance tinted. */}
      <Instances limit={3}>
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial />
        <Instance
          position={[arcadeX, buildingSize + 0.4, arcadeZ]}
          rotation={[0, arcadeDoorAngle, 0]}
          scale={[buildingSize * 0.75, 1.2, buildingSize * 0.75]}
          color={WORLD_COLORS.arcadeRoof}
        />
        <Instance
          position={[workshopX, buildingSize + 0.4, workshopZ]}
          rotation={[0, workshopDoorAngle, 0]}
          scale={[buildingSize * 0.75, 1.2, buildingSize * 0.75]}
          color={WORLD_COLORS.workshopRoof}
        />
        <Instance
          position={[houseX, 1.4, houseZ]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[1.3, 0.9, 1.3]}
          color={WORLD_COLORS.houseRoof}
        />
      </Instances>

      {/* Lab's dome/telescope roof is unique geometry anyway (not worth
          instancing for 1 instance) — and, like every other static prop,
          skips castShadow; only the player casts a real shadow. */}
      <mesh position={[labX, buildingSize + 0.8, labZ]}>
        <sphereGeometry args={[buildingSize / 2.2, 12, 8]} />
        <meshStandardMaterial color={WORLD_COLORS.labRoof} />
      </mesh>

      {/* Neon signs: Lab + Workshop door signs, 2 park lamp tops, and the
          signpost's flag — a shared cyan glow. Arcade's marquee is split
          out below so it can be a distinct, more saturated magenta. */}
      <Instances limit={5}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={WORLD_COLORS.neonSign}
          emissive={WORLD_COLORS.neonSign}
          emissiveIntensity={0.8}
        />
        <Instance
          position={signPos(labAnchor, labX, labZ)}
          rotation={[0, signAngle(labAnchor), 0]}
          scale={[1.4, 0.4, 0.08]}
        />
        <Instance
          position={signPos(workshopAnchor, workshopX, workshopZ)}
          rotation={[0, signAngle(workshopAnchor), 0]}
          scale={[1.4, 0.4, 0.08]}
        />
        <Instance
          position={[pondX - 2, 1.25, pondZ - 2]}
          scale={[0.25, 0.25, 0.25]}
        />
        <Instance
          position={[pondX + 2, 1.25, pondZ + 2]}
          scale={[0.25, 0.25, 0.25]}
        />
        <Instance
          position={[signpostX, 1.0, signpostZ + 0.2]}
          rotation={[0, 0, 0.15]}
          scale={[0.6, 0.25, 0.05]}
          onClick={() => onInteract("signpost")}
          {...hoverHandlers("signpost")}
        />
      </Instances>

      {/* Arcade's neon trim (a strip along the wall top) + glowing marquee
          (above the door) — one dedicated magenta-emissive group. */}
      <Instances limit={2}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={WORLD_COLORS.arcadeNeon}
          emissive={WORLD_COLORS.arcadeNeon}
          emissiveIntensity={1.1}
        />
        <Instance
          position={[arcadeX, buildingSize - 0.15, arcadeZ]}
          rotation={[0, arcadeDoorAngle, 0]}
          scale={[buildingSize * 0.92, 0.12, 0.08]}
        />
        <Instance
          position={signPos(arcadeAnchor, arcadeX, arcadeZ)}
          rotation={[0, signAngle(arcadeAnchor), 0]}
          scale={[1.8, 0.5, 0.1]}
        />
      </Instances>

      {/* Park: pond (unique). */}
      <mesh
        position={[pondX, 0.05, pondZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[BUILDING_HALF_SIZE * 1.3, 24]} />
        <meshStandardMaterial color={WORLD_COLORS.water} />
      </mesh>

      {/* Wood props: 2 park benches + the signpost's post, one material. */}
      <Instances limit={3}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={WORLD_COLORS.wood} />
        <Instance
          position={[pondX - 3, 0.25, pondZ + 1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[0.9, 0.3, 0.35]}
        />
        <Instance
          position={[pondX + 3, 0.25, pondZ - 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[0.9, 0.3, 0.35]}
        />
        <Instance
          position={[signpostX, 0.6, signpostZ]}
          scale={[0.12, 1.2, 0.12]}
          onClick={() => onInteract("signpost")}
          {...hoverHandlers("signpost")}
        />
      </Instances>

      {/* Stone/trim props: 2 lamp poles, the mailbox's post, and Workshop's
          chimney — per-instance tinted (the chimney reads better in rock
          gray than the lighter neutral trim the posts use). */}
      <Instances limit={4}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
        <Instance
          position={[pondX - 2, 0.6, pondZ - 2]}
          scale={[0.1, 1.2, 0.1]}
          color={WORLD_COLORS.buildingWall}
        />
        <Instance
          position={[pondX + 2, 0.6, pondZ + 2]}
          scale={[0.1, 1.2, 0.1]}
          color={WORLD_COLORS.buildingWall}
        />
        <Instance
          position={[mailboxX, 0.4, mailboxZ]}
          scale={[0.1, 0.8, 0.1]}
          color={WORLD_COLORS.buildingWall}
          onClick={() => onInteract("mailbox")}
          {...hoverHandlers("mailbox")}
        />
        <Instance
          position={[
            workshopX - BUILDING_HALF_SIZE * 0.6,
            buildingSize + 0.9,
            workshopZ - BUILDING_HALF_SIZE * 0.6,
          ]}
          scale={[0.35, 1.4, 0.35]}
          color={WORLD_COLORS.rock}
        />
      </Instances>

      {/* Workshop's anvil + forge glow: a one-off dark-metal mesh with a
          baked-in amber emissive, plus a small non-shadow-casting point
          light so the glow actually lights the ground around it. */}
      <mesh
        position={[
          workshopX + workshopAnchor.doorFacing.x * (BUILDING_HALF_SIZE + 1),
          0.3,
          workshopZ + workshopAnchor.doorFacing.z * (BUILDING_HALF_SIZE + 1),
        ]}
      >
        <boxGeometry args={[0.5, 0.35, 0.3]} />
        <meshStandardMaterial
          color="#2a2a2e"
          emissive={WORLD_COLORS.forgeGlow}
          emissiveIntensity={0.6}
        />
      </mesh>
      <pointLight
        position={[
          workshopX + workshopAnchor.doorFacing.x * (BUILDING_HALF_SIZE + 1),
          0.6,
          workshopZ + workshopAnchor.doorFacing.z * (BUILDING_HALF_SIZE + 1),
        ]}
        color={WORLD_COLORS.forgeGlow}
        intensity={2}
        distance={4}
      />

      {/* Signpost's green "live" flag + mailbox's amber lid: one-off colors,
          not worth a dedicated instanced group for one instance each. */}
      <mesh
        position={[signpostX, 0.8, signpostZ - 0.2]}
        rotation={[0, 0, -0.1]}
        onClick={() => onInteract("signpost")}
        {...hoverHandlers("signpost")}
      >
        <boxGeometry args={[0.6, 0.25, 0.05]} />
        <meshStandardMaterial color={WORLD_COLORS.statusLive} />
      </mesh>
      <mesh
        position={[mailboxX, 0.85, mailboxZ]}
        onClick={() => onInteract("mailbox")}
        {...hoverHandlers("mailbox")}
      >
        <boxGeometry args={[0.35, 0.3, 0.25]} />
        <meshStandardMaterial color={WORLD_COLORS.statusInDev} />
      </mesh>

      {/* Building labels: emoji + region name, floating above each roof.
          drei's Html is a DOM overlay that already tracks the 3D position
          and renders flat-to-camera (no draw calls). */}
      <BuildingLabel
        x={labX}
        z={labZ}
        y={buildingSize + 2.2}
        emoji={lab.emoji}
        label={lab.label}
      />
      <BuildingLabel
        x={arcadeX}
        z={arcadeZ}
        y={buildingSize + 2.2}
        emoji={arcade.emoji}
        label={arcade.label}
      />
      <BuildingLabel
        x={workshopX}
        z={workshopZ}
        y={buildingSize + 2.2}
        emoji={workshop.emoji}
        label={workshop.label}
      />
      <BuildingLabel x={houseX} z={houseZ} y={2.6} emoji="🏠" label="Home" />

      {/* Pedestal bases: every project + hobby prop shares one instanced
          group, tinted per-instance (plaza stone for projects, wood for
          hobbies) and individually clickable. */}
      <Instances limit={pedestals.length + hobbies.length} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
        {pedestals.map((p) => {
          const [x, , z] = toWorld(p.x, p.z);
          return (
            <Instance
              key={p.project.slug}
              position={[x, 0.3, z]}
              scale={[0.6, 0.6, 0.6]}
              color={WORLD_COLORS.plaza}
              onClick={() => onInteract(`project:${p.project.slug}`)}
              {...hoverHandlers(`project:${p.project.slug}`)}
            />
          );
        })}
        {hobbies.map((h) => {
          const [x, , z] = toWorld(h.x, h.z);
          return (
            <Instance
              key={h.hobby.slug}
              position={[x, 0.25, z]}
              scale={[0.5, 0.5, 0.5]}
              color={WORLD_COLORS.wood}
              onClick={() => onInteract(`hobby:${h.hobby.slug}`)}
              {...hoverHandlers(`hobby:${h.hobby.slug}`)}
            />
          );
        })}
      </Instances>

      {/* Pedestal tops: one instanced group per status color, since
          `emissive` is a material-level uniform (per-instance `color` only
          tints the diffuse channel) — can't mix hues within one group and
          still glow correctly. Still just 1 draw call per status actually
          in use (max 4), not per pedestal. */}
      {(Object.keys(STATUS_COLOR) as Project["status"][]).map((status) => {
        const group = pedestals.filter((p) => p.project.status === status);
        if (group.length === 0) return null;
        const color = STATUS_COLOR[status];
        return (
          <Instances key={status} limit={group.length}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.3}
            />
            {group.map((p) => {
              const [x, , z] = toWorld(p.x, p.z);
              return (
                <Instance
                  key={p.project.slug}
                  position={[x, 0.85, z]}
                  scale={[0.35, 0.35, 0.35]}
                  onClick={() => onInteract(`project:${p.project.slug}`)}
                  {...hoverHandlers(`project:${p.project.slug}`)}
                />
              );
            })}
          </Instances>
        );
      })}
      {hobbies.length > 0 && (
        <Instances limit={hobbies.length}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={WORLD_COLORS.neonSign}
            emissive={WORLD_COLORS.neonSign}
            emissiveIntensity={0.4}
          />
          {hobbies.map((h) => {
            const [x, , z] = toWorld(h.x, h.z);
            return (
              <Instance
                key={h.hobby.slug}
                position={[x, 0.65, z]}
                rotation={[0, Math.PI / 4, 0]}
                scale={[0.3, 0.3, 0.3]}
                onClick={() => onInteract(`hobby:${h.hobby.slug}`)}
                {...hoverHandlers(`hobby:${h.hobby.slug}`)}
              />
            );
          })}
        </Instances>
      )}

      {/* Pedestal name labels: fade in within LABEL_RANGE tiles of the
          player, or on hover — read imperatively each frame (a ref, not
          React state) so they don't trigger a re-render at 60fps. */}
      {pedestals.map((p) => {
        const [x, , z] = toWorld(p.x, p.z);
        return (
          <PedestalLabel
            key={p.project.slug}
            id={`project:${p.project.slug}`}
            label={p.project.title}
            worldX={x}
            worldZ={z}
            height={1.3}
            playerPositionRef={playerPositionRef}
            hoveredIdRef={hoveredIdRef}
          />
        );
      })}
      {hobbies.map((h) => {
        const [x, , z] = toWorld(h.x, h.z);
        return (
          <PedestalLabel
            key={h.hobby.slug}
            id={`hobby:${h.hobby.slug}`}
            label={h.hobby.title}
            worldX={x}
            worldZ={z}
            height={1.1}
            playerPositionRef={playerPositionRef}
            hoveredIdRef={hoveredIdRef}
          />
        );
      })}
    </group>
  );
}

function BuildingLabel({
  x,
  z,
  y,
  emoji,
  label,
}: {
  x: number;
  z: number;
  y: number;
  emoji: string;
  label: string;
}) {
  return (
    <Html position={[x, y, z]} center zIndexRange={[5, 0]} pointerEvents="none">
      <div className="border-border bg-background/85 text-foreground font-heading pointer-events-none rounded-md border-2 px-3 py-1 text-sm whitespace-nowrap backdrop-blur-sm">
        {emoji} {label}
      </div>
    </Html>
  );
}

function PedestalLabel({
  id,
  label,
  worldX,
  worldZ,
  height,
  playerPositionRef,
  hoveredIdRef,
}: {
  id: string;
  label: string;
  worldX: number;
  worldZ: number;
  height: number;
  playerPositionRef: React.RefObject<THREE.Vector3>;
  hoveredIdRef: React.RefObject<string | null>;
}) {
  const divRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    const el = divRef.current;
    if (!el) return;
    const player = playerPositionRef.current;
    const dx = player.x - worldX;
    const dz = player.z - worldZ;
    const near = Math.sqrt(dx * dx + dz * dz) <= LABEL_RANGE;
    const hovered = hoveredIdRef.current === id;
    el.style.opacity = near || hovered ? "1" : "0";
  });

  return (
    <Html
      position={[worldX, height, worldZ]}
      center
      zIndexRange={[5, 0]}
      pointerEvents="none"
    >
      <div
        ref={divRef}
        className="border-border bg-background/80 text-foreground pointer-events-none rounded border font-mono text-[10px] whitespace-nowrap opacity-0 backdrop-blur-sm transition-opacity duration-200"
        style={{ padding: "1px 6px" }}
      >
        {label}
      </div>
    </Html>
  );
}

export { toWorld as buildingToWorld };
