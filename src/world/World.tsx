"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stats } from "@react-three/drei";
import * as THREE from "three";

import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { generateMap, GRID_SIZE, getRegionAt, type RegionSlug } from "./map";
import { getPedestalPlacements, getHobbyPlacements } from "./content-placement";
import {
  buildInteractables,
  findNearest,
  INTERACT_RANGE,
  type Interactable,
} from "./interaction";
import { Terrain } from "./Terrain";
import { Buildings } from "./Buildings";
import { Lighting } from "./Lighting";
import { CameraRig, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM } from "./CameraRig";
import { Player, type PlayerHandle } from "./Player";
import { Hud } from "./Hud";
import { Panels } from "./Panels";
import { REGION_ANCHORS } from "./map";

const GRID_OFFSET = GRID_SIZE / 2;
const DEBUG =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("debug") === "1";

interface SceneProps {
  playerRef: React.RefObject<PlayerHandle | null>;
  zoomRef: React.RefObject<number>;
  reducedMotion: boolean;
  onNearestChange: (
    nearest: { interactable: Interactable; inRange: boolean } | null,
  ) => void;
  onRegionChange: (region: RegionSlug | "home") => void;
  onArrival: (id: string) => void;
  pendingInteractIdRef: React.RefObject<string | null>;
  isTouch: boolean;
}

function Scene({
  playerRef,
  zoomRef,
  reducedMotion,
  onNearestChange,
  onRegionChange,
  onArrival,
  pendingInteractIdRef,
  isTouch,
}: SceneProps) {
  const map = useMemo(() => generateMap(), []);
  const pedestals = useMemo(() => getPedestalPlacements(), []);
  const hobbies = useMemo(() => getHobbyPlacements(), []);
  const interactables = useMemo(
    () => buildInteractables(pedestals, hobbies),
    [pedestals, hobbies],
  );

  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  const lastNearestId = useRef<string | null>(null);
  const lastRegion = useRef<RegionSlug | "home" | null>(null);

  const internalPlayerRef = useRef<PlayerHandle | null>(null);

  useFrame(() => {
    const player = internalPlayerRef.current;
    if (!player) return;
    targetRef.current.copy(player.position);

    const nearest = findNearest(
      interactables,
      player.position.x,
      player.position.z,
    );
    const inRange = !!nearest && nearest.distance <= INTERACT_RANGE;
    const id = inRange ? nearest!.interactable.id : null;
    if (id !== lastNearestId.current) {
      lastNearestId.current = id;
      onNearestChange(
        inRange && nearest
          ? { interactable: nearest.interactable, inRange: true }
          : null,
      );
    }

    if (inRange && pendingInteractIdRef.current === id && id) {
      pendingInteractIdRef.current = null;
      onArrival(id);
    }

    const tileX = Math.round(player.position.x + GRID_OFFSET);
    const tileZ = Math.round(player.position.z + GRID_OFFSET);
    const region = getRegionAt(tileX, tileZ);
    if (region !== lastRegion.current) {
      lastRegion.current = region;
      onRegionChange(region);
    }
  });

  const handleInteract = useCallback(
    (id: string) => {
      const target = interactables.find((i) => i.id === id);
      if (!target) return;
      const player = internalPlayerRef.current;
      if (!player) return;
      const dx = target.worldX - player.position.x;
      const dz = target.worldZ - player.position.z;
      if (Math.sqrt(dx * dx + dz * dz) <= INTERACT_RANGE) {
        onArrival(id);
      } else {
        pendingInteractIdRef.current = id;
        player.moveTo(target.worldX, target.worldZ);
      }
    },
    [interactables, onArrival, pendingInteractIdRef],
  );

  useEffect(() => {
    playerRef.current = internalPlayerRef.current;
  });

  return (
    <>
      <Lighting shadows={!isTouch} />
      <CameraRig
        targetRef={targetRef}
        zoomRef={zoomRef}
        reducedMotion={reducedMotion}
      />
      <Terrain map={map} />
      <Buildings
        pedestals={pedestals}
        hobbies={hobbies}
        onInteract={handleInteract}
      />
      <Player
        ref={internalPlayerRef}
        tiles={map.tiles}
        gridOffset={GRID_OFFSET}
        reducedMotion={reducedMotion}
      />
      {/* Cheap blob shadow under the player — doubles as the touch-device
          shadow substitute and a subtle grounding cue on desktop too. */}
      <BlobShadow targetRef={targetRef} />
      {DEBUG && <Stats />}
    </>
  );
}

function BlobShadow({
  targetRef,
}: {
  targetRef: React.RefObject<THREE.Vector3>;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    mesh.position.set(targetRef.current.x, 0.11, targetRef.current.z);
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.35, 12]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.25} />
    </mesh>
  );
}

export function World() {
  const reducedMotion = usePrefersReducedMotion();
  const [isTouch, setIsTouch] = useState(false);
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");
  const [nearest, setNearest] = useState<{
    interactable: Interactable;
    inRange: boolean;
  } | null>(null);
  const [region, setRegion] = useState<RegionSlug | "home">("home");
  const [openPanel, setOpenPanel] = useState<Interactable | null>(null);

  const playerRef = useRef<PlayerHandle | null>(null);
  const zoomRef = useRef(DEFAULT_ZOOM);
  const pendingInteractIdRef = useRef<string | null>(null);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    queueMicrotask(() => setIsTouch(coarse));

    const onVisibility = () =>
      setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const handleArrival = useCallback((id: string) => {
    const interactables = buildInteractables(
      getPedestalPlacements(),
      getHobbyPlacements(),
    );
    const target = interactables.find((i) => i.id === id);
    if (target) setOpenPanel(target);
  }, []);

  // ?debug exposes a direct trigger alongside window.__world.player — lets a
  // test (or Jordan, poking around) open any panel by id without having to
  // click the exact 3D object on screen.
  useEffect(() => {
    if (!DEBUG) return;
    const w = window as Window & { __world?: Record<string, unknown> };
    w.__world ??= {};
    w.__world.interact = handleArrival;
  }, [handleArrival]);

  // "E" opens whatever's currently in range — the HUD prompt button does the
  // same thing, this is just the keyboard path to it.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "e" || e.repeat) return;
      if (nearest?.inRange) handleArrival(nearest.interactable.id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nearest, handleArrival]);

  // Esc is handled by the Sheet itself; this just returns focus to the world
  // container once a panel closes, so keyboard users aren't left stranded.
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openPanel) containerRef.current?.focus();
  }, [openPanel]);

  const handleFastTravel = useCallback((regionSlug: string) => {
    const anchor = REGION_ANCHORS.find((a) => a.slug === regionSlug);
    const player = playerRef.current;
    if (!player) return;
    if (anchor) {
      const door = {
        x: anchor.x + anchor.doorFacing.x * 3,
        z: anchor.z + anchor.doorFacing.z * 3,
      };
      player.moveTo(door.x - GRID_OFFSET, door.z - GRID_OFFSET);
    } else {
      player.moveTo(0, 0); // "home" = plaza centre
    }
    setOpenPanel(null);
  }, []);

  const applyZoomDelta = useCallback((delta: number) => {
    zoomRef.current = THREE.MathUtils.clamp(
      zoomRef.current + delta,
      MIN_ZOOM,
      MAX_ZOOM,
    );
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      applyZoomDelta(-e.deltaY * 0.05);
    },
    [applyZoomDelta],
  );

  // Pinch-to-zoom: track two-pointer distance deltas.
  const pinchState = useRef<{ startDist: number; startZoom: number } | null>(
    null,
  );
  const activePointers = useRef(new Map<number, { x: number; y: number }>());

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.current.size === 2) {
      const [a, b] = [...activePointers.current.values()];
      pinchState.current = {
        startDist: Math.hypot(a.x - b.x, a.y - b.y),
        startZoom: zoomRef.current,
      };
    }
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.current.size === 2 && pinchState.current) {
      const [a, b] = [...activePointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const ratio = dist / pinchState.current.startDist;
      zoomRef.current = THREE.MathUtils.clamp(
        pinchState.current.startZoom * ratio,
        MIN_ZOOM,
        MAX_ZOOM,
      );
    }
  }, []);
  const onPointerUp = useCallback((e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) pinchState.current = null;
  }, []);

  // Click-to-move: raycast handled by drei's plane via onClick on the ground;
  // simplest here is a pointer-up on the canvas background (not consumed by
  // an interactable's own onClick, which stops propagation implicitly by
  // being a closer hit in R3F's raycast order).
  const handleGroundClick = useCallback((e: { point: THREE.Vector3 }) => {
    playerRef.current?.moveTo(e.point.x, e.point.z);
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="bg-background relative h-dvh w-full touch-none overflow-hidden outline-none"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Canvas
        dpr={[1, 2]}
        shadows={!isTouch}
        frameloop={frameloop}
        aria-label="Jord World — explorable voxel overworld"
        onPointerMissed={() => setOpenPanel(null)}
        onCreated={(state) => {
          if (!DEBUG) return;
          const w = window as Window & { __world?: Record<string, unknown> };
          w.__world ??= {};
          w.__world.renderer = state.gl;
        }}
      >
        <color attach="background" args={["#0b1020"]} />
        <fog attach="fog" args={["#0b1020", 40, 90]} />
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.01, 0]}
          onClick={(e) => {
            e.stopPropagation();
            handleGroundClick(e);
          }}
        >
          <planeGeometry args={[GRID_SIZE + 10, GRID_SIZE + 10]} />
          <meshBasicMaterial visible={false} />
        </mesh>
        <Scene
          playerRef={playerRef}
          zoomRef={zoomRef}
          reducedMotion={reducedMotion}
          onNearestChange={setNearest}
          onRegionChange={setRegion}
          onArrival={handleArrival}
          pendingInteractIdRef={pendingInteractIdRef}
          isTouch={isTouch}
        />
      </Canvas>

      <Hud
        region={region}
        nearest={nearest}
        isTouch={isTouch}
        onInteract={handleArrival}
        reducedMotion={reducedMotion}
        onZoomIn={() => applyZoomDelta(8)}
        onZoomOut={() => applyZoomDelta(-8)}
      />
      <Panels
        open={openPanel}
        onClose={() => setOpenPanel(null)}
        onFastTravel={handleFastTravel}
      />
    </div>
  );
}
