import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { isWalkable, type Tile } from "./map";
import { findPath } from "./pathfinding";
import { WORLD_COLORS } from "./colors";

const SPEED = 4; // world units / second
const WAYPOINT_EPSILON = 0.08;

// Screen-relative directions (see map.ts's comment on screen-compass math):
// pressing "up" should move the player toward the top of the screen, which
// for this camera is world (-x,-z), not a single world axis.
const SCREEN_DIRS = {
  up: new THREE.Vector3(-1, 0, -1).normalize(),
  down: new THREE.Vector3(1, 0, 1).normalize(),
  left: new THREE.Vector3(-1, 0, 1).normalize(),
  right: new THREE.Vector3(1, 0, -1).normalize(),
};

export interface PlayerHandle {
  position: THREE.Vector3;
  /** Radians around Y, live-mutated like `position` — read `.current` each
   * frame rather than snapshotting, same pattern for the same reason. */
  facing: React.RefObject<number>;
  moveTo: (worldX: number, worldZ: number) => void;
}

export interface PlayerProps {
  tiles: Tile[][];
  gridOffset: number; // GRID_SIZE / 2, to convert world <-> tile space
  reducedMotion: boolean;
  onMovingChange?: (moving: boolean) => void;
}

/** Head/body/arms/legs voxel character. WASD moves directly (cancels any
 * active path); click/tap-to-move runs an A* path one waypoint at a time.
 * Movement uses separate-axis collision so the player slides along walls
 * instead of stopping dead on a diagonal into one. */
export const Player = forwardRef<PlayerHandle, PlayerProps>(function Player(
  { tiles, gridOffset, reducedMotion, onMovingChange },
  ref,
) {
  const position = useRef(new THREE.Vector3(0, 0, 0));
  const facing = useRef(0); // radians, around Y
  const walkPhase = useRef(0);
  const path = useRef<{ x: number; z: number }[] | null>(null);
  const pathIndex = useRef(0);
  const keysDown = useRef(new Set<string>());
  const wasMoving = useRef(false);

  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  const { gl } = useThree();

  useImperativeHandle(ref, () => ({
    position: position.current,
    facing,
    moveTo(worldX, worldZ) {
      const startTile = {
        x: Math.round(position.current.x + gridOffset),
        z: Math.round(position.current.z + gridOffset),
      };
      const goalTile = {
        x: Math.round(worldX + gridOffset),
        z: Math.round(worldZ + gridOffset),
      };
      const found = findPath(tiles, startTile, goalTile);
      if (found) {
        path.current = found;
        pathIndex.current = 0;
      }
    },
  }));

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(k)
      ) {
        keysDown.current.add(k);
        path.current = null; // direct control cancels any in-progress path
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysDown.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    const move = new THREE.Vector3();
    const keys = keysDown.current;
    if (keys.has("w") || keys.has("arrowup")) move.add(SCREEN_DIRS.up);
    if (keys.has("s") || keys.has("arrowdown")) move.add(SCREEN_DIRS.down);
    if (keys.has("a") || keys.has("arrowleft")) move.add(SCREEN_DIRS.left);
    if (keys.has("d") || keys.has("arrowright")) move.add(SCREEN_DIRS.right);

    let moving = false;

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(SPEED * delta);
      moving = applyMove(position.current, move, tiles, gridOffset);
      if (moving) facing.current = Math.atan2(move.x, move.z);
    } else if (path.current) {
      const waypoints = path.current;
      const target = waypoints[pathIndex.current];
      if (target) {
        const targetWorld = new THREE.Vector3(
          target.x - gridOffset,
          0,
          target.z - gridOffset,
        );
        const toTarget = targetWorld.clone().sub(position.current);
        toTarget.y = 0;
        if (toTarget.length() < WAYPOINT_EPSILON) {
          pathIndex.current++;
          if (pathIndex.current >= waypoints.length) path.current = null;
        } else {
          const step = toTarget
            .clone()
            .normalize()
            .multiplyScalar(Math.min(SPEED * delta, toTarget.length()));
          applyMove(position.current, step, tiles, gridOffset);
          facing.current = Math.atan2(step.x, step.z);
          moving = true;
        }
      } else {
        path.current = null;
      }
    }

    if (moving !== wasMoving.current) {
      wasMoving.current = moving;
      onMovingChange?.(moving);
    }

    if (moving && !reducedMotion) {
      walkPhase.current += delta * 10;
    } else if (!reducedMotion) {
      walkPhase.current = THREE.MathUtils.damp(walkPhase.current, 0, 6, delta);
    }

    const group = groupRef.current;
    if (group) {
      group.position.set(position.current.x, 0, position.current.z);
      group.rotation.y = facing.current;
      if (!reducedMotion) {
        group.position.y = Math.abs(Math.sin(walkPhase.current)) * 0.08;
      }
    }
    const swing = reducedMotion ? 0 : Math.sin(walkPhase.current) * 0.5;
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing;
  });

  // ?debug exposes the live player ref on window for inspection.
  useEffect(() => {
    const w = window as Window & { __world?: Record<string, unknown> };
    w.__world ??= {};
    w.__world.player = position.current;
    w.__world.renderer = gl;
  }, [gl]);

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.45, 0.45, 0.45]} />
        <meshStandardMaterial color={WORLD_COLORS.playerSkin} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.4, 0.5, 0.25]} />
        <meshStandardMaterial color={WORLD_COLORS.playerBody} />
      </mesh>
      <mesh ref={leftArmRef} position={[-0.3, 0.55, 0]} castShadow>
        <boxGeometry args={[0.15, 0.4, 0.15]} />
        <meshStandardMaterial color={WORLD_COLORS.playerBody} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.3, 0.55, 0]} castShadow>
        <boxGeometry args={[0.15, 0.4, 0.15]} />
        <meshStandardMaterial color={WORLD_COLORS.playerBody} />
      </mesh>
      <mesh ref={leftLegRef} position={[-0.12, 0.2, 0]} castShadow>
        <boxGeometry args={[0.15, 0.4, 0.15]} />
        <meshStandardMaterial color={WORLD_COLORS.buildingWall} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.12, 0.2, 0]} castShadow>
        <boxGeometry args={[0.15, 0.4, 0.15]} />
        <meshStandardMaterial color={WORLD_COLORS.buildingWall} />
      </mesh>
    </group>
  );
});

/** Separate-axis movement: try the full step, then X-only, then Z-only — the
 * player slides along a wall instead of stopping dead when only one axis of
 * a diagonal move is actually blocked. Returns whether it moved at all. */
function applyMove(
  pos: THREE.Vector3,
  delta: THREE.Vector3,
  tiles: Tile[][],
  gridOffset: number,
): boolean {
  const tryAxis = (dx: number, dz: number): boolean => {
    const nx = pos.x + dx;
    const nz = pos.z + dz;
    const tileX = Math.round(nx + gridOffset);
    const tileZ = Math.round(nz + gridOffset);
    if (!isWalkable(tiles, tileX, tileZ)) return false;
    pos.x = nx;
    pos.z = nz;
    return true;
  };

  const full = tryAxis(delta.x, delta.z);
  if (full) return true;
  const xOnly = tryAxis(delta.x, 0);
  const zOnly = !xOnly ? tryAxis(0, delta.z) : false;
  return xOnly || zOnly;
}
