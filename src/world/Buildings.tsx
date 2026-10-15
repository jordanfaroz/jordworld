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

/** Observatory (Lab) / neon hall (Arcade) / forge shed (Workshop). Doors +
 * signs face the plaza per each anchor's `doorFacing` (see map.ts's comment
 * on the screen-compass/visibility trade-off). */
function RegionBuilding({
  x,
  z,
  doorFacing,
  variant,
}: {
  x: number;
  z: number;
  doorFacing: { x: number; z: number };
  variant: "lab" | "arcade" | "workshop";
}) {
  const size = BUILDING_HALF_SIZE * 2;
  const [wx, , wz] = toWorld(x, z);
  const doorAngle = Math.atan2(doorFacing.x, doorFacing.z);
  const signPos: [number, number, number] = [
    wx + doorFacing.x * (BUILDING_HALF_SIZE + 0.05),
    1.6,
    wz + doorFacing.z * (BUILDING_HALF_SIZE + 0.05),
  ];

  return (
    <group>
      <mesh position={[wx, size / 2, wz]} castShadow receiveShadow>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color={WORLD_COLORS.buildingWall} />
      </mesh>
      {variant === "lab" ? (
        <mesh position={[wx, size + 0.8, wz]} castShadow>
          <sphereGeometry args={[size / 2.2, 12, 8]} />
          <meshStandardMaterial color={WORLD_COLORS.buildingRoof} />
        </mesh>
      ) : (
        <mesh
          position={[wx, size + 0.4, wz]}
          rotation={[0, doorAngle, 0]}
          castShadow
        >
          <coneGeometry args={[size * 0.75, 1.2, 4]} />
          <meshStandardMaterial color={WORLD_COLORS.buildingRoof} />
        </mesh>
      )}
      {/* Pixel neon sign on the door face. */}
      <mesh position={signPos} rotation={[0, doorAngle, 0]}>
        <boxGeometry args={[1.4, 0.4, 0.08]} />
        <meshStandardMaterial
          color={WORLD_COLORS.neonSign}
          emissive={WORLD_COLORS.neonSign}
          emissiveIntensity={variant === "arcade" ? 1.2 : 0.6}
        />
      </mesh>
    </group>
  );
}

function Pond({ x, z }: { x: number; z: number }) {
  const [wx, , wz] = toWorld(x, z);
  return (
    <mesh
      position={[wx, 0.05, wz]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <circleGeometry args={[BUILDING_HALF_SIZE * 1.3, 24]} />
      <meshStandardMaterial color={WORLD_COLORS.water} />
    </mesh>
  );
}

function Bench({
  x,
  z,
  rotationY = 0,
}: {
  x: number;
  z: number;
  rotationY?: number;
}) {
  const [wx, , wz] = toWorld(x, z);
  return (
    <mesh position={[wx, 0.25, wz]} rotation={[0, rotationY, 0]} castShadow>
      <boxGeometry args={[0.9, 0.3, 0.35]} />
      <meshStandardMaterial color={WORLD_COLORS.wood} />
    </mesh>
  );
}

function Lamp({ x, z }: { x: number; z: number }) {
  const [wx, , wz] = toWorld(x, z);
  return (
    <group position={[wx, 0, wz]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.1, 1.2, 0.1]} />
        <meshStandardMaterial color={WORLD_COLORS.buildingWall} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.25, 0.25, 0.25]} />
        <meshStandardMaterial
          color={WORLD_COLORS.neonSign}
          emissive={WORLD_COLORS.neonSign}
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

function House() {
  const [wx, , wz] = toWorld(HOUSE_POS.x, HOUSE_POS.z);
  return (
    <group position={[wx, 0, wz]}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.2, 1.6]} />
        <meshStandardMaterial color={WORLD_COLORS.buildingWall} />
      </mesh>
      <mesh position={[0, 1.4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.3, 0.9, 4]} />
        <meshStandardMaterial color={WORLD_COLORS.buildingRoof} />
      </mesh>
    </group>
  );
}

function Signpost({ onClick }: { onClick: () => void }) {
  const [wx, , wz] = toWorld(SIGNPOST_POS.x, SIGNPOST_POS.z);
  return (
    <group position={[wx, 0, wz]} onClick={onClick}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.12, 1.2, 0.12]} />
        <meshStandardMaterial color={WORLD_COLORS.wood} />
      </mesh>
      <mesh position={[0, 1.0, 0.2]} rotation={[0, 0, 0.15]} castShadow>
        <boxGeometry args={[0.6, 0.25, 0.05]} />
        <meshStandardMaterial color={WORLD_COLORS.neonSign} />
      </mesh>
      <mesh position={[0, 0.8, -0.2]} rotation={[0, 0, -0.1]} castShadow>
        <boxGeometry args={[0.6, 0.25, 0.05]} />
        <meshStandardMaterial color={WORLD_COLORS.statusLive} />
      </mesh>
    </group>
  );
}

function Mailbox({ onClick }: { onClick: () => void }) {
  const [wx, , wz] = toWorld(MAILBOX_POS.x, MAILBOX_POS.z);
  return (
    <group position={[wx, 0, wz]} onClick={onClick}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshStandardMaterial color={WORLD_COLORS.buildingWall} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.35, 0.3, 0.25]} />
        <meshStandardMaterial color={WORLD_COLORS.statusInDev} />
      </mesh>
    </group>
  );
}

function ProjectPedestal({
  placement,
  onClick,
}: {
  placement: PedestalPlacement;
  onClick: () => void;
}) {
  const [wx, , wz] = toWorld(placement.x, placement.z);
  const color = STATUS_COLOR[placement.project.status];
  return (
    <group position={[wx, 0, wz]} onClick={onClick}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color={WORLD_COLORS.plaza} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

function HobbyProp({
  placement,
  onClick,
}: {
  placement: HobbyPlacement;
  onClick: () => void;
}) {
  const [wx, , wz] = toWorld(placement.x, placement.z);
  return (
    <group position={[wx, 0, wz]} onClick={onClick}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={WORLD_COLORS.wood} />
      </mesh>
      <mesh position={[0, 0.65, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial
          color={WORLD_COLORS.neonSign}
          emissive={WORLD_COLORS.neonSign}
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  );
}

export function Buildings({
  pedestals,
  hobbies,
  onInteract,
}: {
  pedestals: PedestalPlacement[];
  hobbies: HobbyPlacement[];
  onInteract: (id: string) => void;
}) {
  return (
    <group>
      {REGION_ANCHORS.map((anchor) =>
        anchor.slug === "park" ? (
          <group key={anchor.slug}>
            <Pond x={anchor.x} z={anchor.z} />
            <Bench x={anchor.x - 3} z={anchor.z + 1} rotationY={Math.PI / 2} />
            <Bench x={anchor.x + 3} z={anchor.z - 1} rotationY={-Math.PI / 2} />
            <Lamp x={anchor.x - 2} z={anchor.z - 2} />
            <Lamp x={anchor.x + 2} z={anchor.z + 2} />
          </group>
        ) : (
          <RegionBuilding
            key={anchor.slug}
            x={anchor.x}
            z={anchor.z}
            doorFacing={anchor.doorFacing}
            variant={anchor.slug}
          />
        ),
      )}

      <House />
      <Signpost onClick={() => onInteract("signpost")} />
      <Mailbox onClick={() => onInteract("mailbox")} />

      {pedestals.map((p) => (
        <ProjectPedestal
          key={p.project.slug}
          placement={p}
          onClick={() => onInteract(`project:${p.project.slug}`)}
        />
      ))}
      {hobbies.map((h) => (
        <HobbyProp
          key={h.hobby.slug}
          placement={h}
          onClick={() => onInteract(`hobby:${h.hobby.slug}`)}
        />
      ))}
    </group>
  );
}

export { toWorld as buildingToWorld };
