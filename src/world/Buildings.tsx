import { Instances, Instance } from "@react-three/drei";

import {
  BUILDING_HALF_SIZE,
  GRID_SIZE,
  HOUSE_POS,
  MAILBOX_POS,
  REGION_ANCHORS,
  SIGNPOST_POS,
} from "./map";
import { WORLD_COLORS } from "./colors";
import type { PedestalPlacement, HobbyPlacement } from "./content-placement";
import type { Project } from "@/content/types";

const GRID_OFFSET = GRID_SIZE / 2;

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
 * calls were 118 before this pass (measured via renderer.info.render.calls);
 * the goal is <=40 on desktop. Interactive props (pedestals, hobby props)
 * stay instanced too — drei's <Instance> supports per-instance onClick via
 * instanceId under the hood, so instancing doesn't cost us click handling.
 *
 * Only the player casts a real shadow (see Lighting.tsx / World.tsx) — every
 * shadow-casting object gets rendered a second time for the shadow-map pass,
 * so leaving castShadow off everything static roughly halves what would
 * otherwise be the dominant cost here.
 */
export function Buildings({
  pedestals,
  hobbies,
  onInteract,
}: {
  pedestals: PedestalPlacement[];
  hobbies: HobbyPlacement[];
  onInteract: (id: string) => void;
}) {
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

  return (
    <group>
      {/* Walls: 3 region buildings + the house, one box geometry scaled per instance. */}
      <Instances limit={4} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={WORLD_COLORS.buildingWall} />
        <Instance
          position={[labX, buildingSize / 2, labZ]}
          scale={[buildingSize, buildingSize, buildingSize]}
        />
        <Instance
          position={[arcadeX, buildingSize / 2, arcadeZ]}
          scale={[buildingSize, buildingSize, buildingSize]}
        />
        <Instance
          position={[workshopX, buildingSize / 2, workshopZ]}
          scale={[buildingSize, buildingSize, buildingSize]}
        />
        <Instance position={[houseX, 0.6, houseZ]} scale={[1.6, 1.2, 1.6]} />
      </Instances>

      {/* Roofs: Arcade + Workshop + House cones (Lab's dome is unique, kept separate below). */}
      <Instances limit={3}>
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial color={WORLD_COLORS.buildingRoof} />
        <Instance
          position={[arcadeX, buildingSize + 0.4, arcadeZ]}
          rotation={[0, arcadeDoorAngle, 0]}
          scale={[buildingSize * 0.75, 1.2, buildingSize * 0.75]}
        />
        <Instance
          position={[workshopX, buildingSize + 0.4, workshopZ]}
          rotation={[0, workshopDoorAngle, 0]}
          scale={[buildingSize * 0.75, 1.2, buildingSize * 0.75]}
        />
        <Instance
          position={[houseX, 1.4, houseZ]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[1.3, 0.9, 1.3]}
        />
      </Instances>

      {/* Lab's dome is unique geometry anyway (not worth instancing for 1
          instance) — and, like every other static prop, skips castShadow;
          only the player casts a real shadow. */}
      <mesh position={[labX, buildingSize + 0.8, labZ]}>
        <sphereGeometry args={[buildingSize / 2.2, 12, 8]} />
        <meshStandardMaterial color={WORLD_COLORS.buildingRoof} />
      </mesh>

      {/* Neon signs: 3 building door signs, 2 park lamp tops, and the
          signpost's cyan flag — all the same emissive cyan box. */}
      <Instances limit={6}>
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
          position={signPos(arcadeAnchor, arcadeX, arcadeZ)}
          rotation={[0, signAngle(arcadeAnchor), 0]}
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
        />
      </Instances>

      {/* Wall-colored thin props: 2 lamp poles + the mailbox's post, one material. */}
      <Instances limit={3}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={WORLD_COLORS.buildingWall} />
        <Instance
          position={[pondX - 2, 0.6, pondZ - 2]}
          scale={[0.1, 1.2, 0.1]}
        />
        <Instance
          position={[pondX + 2, 0.6, pondZ + 2]}
          scale={[0.1, 1.2, 0.1]}
        />
        <Instance
          position={[mailboxX, 0.4, mailboxZ]}
          scale={[0.1, 0.8, 0.1]}
          onClick={() => onInteract("mailbox")}
        />
      </Instances>

      {/* Signpost's green "live" flag + mailbox's amber lid: one-off colors,
          not worth a dedicated instanced group for one instance each. */}
      <mesh
        position={[signpostX, 0.8, signpostZ - 0.2]}
        rotation={[0, 0, -0.1]}
        onClick={() => onInteract("signpost")}
      >
        <boxGeometry args={[0.6, 0.25, 0.05]} />
        <meshStandardMaterial color={WORLD_COLORS.statusLive} />
      </mesh>
      <mesh
        position={[mailboxX, 0.85, mailboxZ]}
        onClick={() => onInteract("mailbox")}
      >
        <boxGeometry args={[0.35, 0.3, 0.25]} />
        <meshStandardMaterial color={WORLD_COLORS.statusInDev} />
      </mesh>

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
              />
            );
          })}
        </Instances>
      )}
    </group>
  );
}

export { toWorld as buildingToWorld };
