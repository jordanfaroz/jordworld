import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { findNearestWalkable, isWalkable, type Tile } from "./map";
import { findPath } from "./pathfinding";
import { WORLD_COLORS } from "./colors";

// Walk/run speed in world units/second. WALK_SPEED was 4 — raised along with
// the run tier added here (Shift on desktop, joystick pushed fully on
// touch): the old speed read as sluggish once there was a faster gait to
// compare it against.
const WALK_SPEED = 5.5;
const RUN_SPEED = 9;
// Below this, a joystick deflection is a dead zone (noise from a finger
// resting on the base); at/above it, analog magnitude scales walk speed
// up to RUN_THRESHOLD, past which it's a full run.
const JOYSTICK_DEADZONE = 0.08;
const RUN_THRESHOLD = 0.92;
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
  /** Instant relocation, no pathfinding/walk — for minimap fast travel's
   * fade-and-dash, called while the screen is opaque. */
  teleportTo: (worldX: number, worldZ: number) => void;
}

/** Normalized screen-space joystick deflection: x = right(+)/left(-), y =
 * up(+)/down(-), both 0 when untouched. Read live each frame like the
 * keyboard's `keysDown`, not passed as React state. */
export interface JoystickVector {
  x: number;
  y: number;
}

export interface PlayerProps {
  tiles: Tile[][];
  gridOffset: number; // GRID_SIZE / 2, to convert world <-> tile space
  reducedMotion: boolean;
  onMovingChange?: (moving: boolean) => void;
  joystickRef?: React.RefObject<JoystickVector>;
}

/** Head/body/arms/legs voxel character. WASD moves directly (cancels any
 * active path); click/tap-to-move runs an A* path one waypoint at a time.
 * Movement uses separate-axis collision so the player slides along walls
 * instead of stopping dead on a diagonal into one. */
export const Player = forwardRef<PlayerHandle, PlayerProps>(function Player(
  { tiles, gridOffset, reducedMotion, onMovingChange, joystickRef },
  ref,
) {
  const position = useRef(new THREE.Vector3(0, 0, 0));
  const facing = useRef(0); // radians, around Y
  const walkPhase = useRef(0);
  const path = useRef<{ x: number; z: number }[] | null>(null);
  const pathIndex = useRef(0);
  const keysDown = useRef(new Set<string>());
  const shiftDown = useRef(false);
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
      let goalTile = {
        x: Math.round(worldX + gridOffset),
        z: Math.round(worldZ + gridOffset),
      };
      // A blocked goal (water, a building footprint) previously just failed
      // silently — findPath returns null for an unwalkable goal. Snap to
      // the nearest walkable tile instead, so every click goes somewhere.
      if (!isWalkable(tiles, goalTile.x, goalTile.z)) {
        const snapped = findNearestWalkable(tiles, goalTile.x, goalTile.z);
        if (!snapped) return;
        goalTile = snapped;
      }
      const found = findPath(tiles, startTile, goalTile);
      if (found) {
        path.current = found;
        pathIndex.current = 0;
      }
    },
    teleportTo(worldX, worldZ) {
      path.current = null;
      position.current.set(worldX, 0, worldZ);
    },
  }));

  useEffect(() => {
    const MOVE_KEYS = [
      "w",
      "a",
      "s",
      "d",
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
    ];
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      shiftDown.current = e.shiftKey;
      if (MOVE_KEYS.includes(k)) {
        keysDown.current.add(k);
        path.current = null; // direct control cancels any in-progress path
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      shiftDown.current = e.shiftKey;
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
    const keys = keysDown.current;
    const keyMove = new THREE.Vector3();
    if (keys.has("w") || keys.has("arrowup")) keyMove.add(SCREEN_DIRS.up);
    if (keys.has("s") || keys.has("arrowdown")) keyMove.add(SCREEN_DIRS.down);
    if (keys.has("a") || keys.has("arrowleft")) keyMove.add(SCREEN_DIRS.left);
    if (keys.has("d") || keys.has("arrowright")) keyMove.add(SCREEN_DIRS.right);

    // Direct control (keyboard or joystick) takes over from any in-progress
    // tap-to-move path. Keyboard is binary speed (Shift = run); the
    // joystick's analog magnitude scales walk speed continuously, with full
    // deflection crossing into a run — same RUN_SPEED either way.
    let move: THREE.Vector3 | null = null;
    let speed = WALK_SPEED;

    if (keyMove.lengthSq() > 0) {
      move = keyMove.normalize();
      speed = shiftDown.current ? RUN_SPEED : WALK_SPEED;
    } else {
      const joy = joystickRef?.current;
      if (joy) {
        const magnitude = Math.min(1, Math.hypot(joy.x, joy.y));
        if (magnitude > JOYSTICK_DEADZONE) {
          move = new THREE.Vector3()
            .addScaledVector(SCREEN_DIRS.right, joy.x)
            .addScaledVector(SCREEN_DIRS.up, joy.y)
            .normalize();
          speed =
            magnitude >= RUN_THRESHOLD
              ? RUN_SPEED
              : WALK_SPEED *
                THREE.MathUtils.clamp(magnitude / RUN_THRESHOLD, 0.35, 1);
        }
      }
    }

    let moving = false;

    if (move) {
      path.current = null; // direct control cancels any in-progress path
      move.multiplyScalar(speed * delta);
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
            .multiplyScalar(Math.min(WALK_SPEED * delta, toTarget.length()));
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
