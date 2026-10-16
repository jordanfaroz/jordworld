"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stats, Html } from "@react-three/drei";
import * as THREE from "three";

import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { useMediaQuery } from "@/lib/use-media-query";
import {
  generateMap,
  GRID_SIZE,
  getRegionAt,
  type MapData,
  type RegionSlug,
} from "./map";
import {
  getPedestalPlacements,
  getHobbyPlacements,
  type PedestalPlacement,
} from "./content-placement";
import { getProject } from "@/content/projects";
import {
  buildInteractables,
  findNearest,
  INTERACT_RANGE,
  type Interactable,
} from "./interaction";
import { Terrain } from "./Terrain";
import { Buildings } from "./Buildings";
import { Lighting } from "./Lighting";
import { WORLD_COLORS } from "./colors";
import { CameraRig, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM } from "./CameraRig";
import { Player, type PlayerHandle } from "./Player";
import { Hud } from "./Hud";
import { Panels } from "./Panels";
import { EnterWorldIntro, INTRO_STORAGE_KEY } from "./EnterWorldIntro";
import { REGION_ANCHORS } from "./map";

const GRID_OFFSET = GRID_SIZE / 2;
const DEBUG =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("debug") === "1";

interface SceneProps {
  map: MapData;
  pedestals: PedestalPlacement[];
  playerRef: React.RefObject<PlayerHandle | null>;
  zoomRef: React.RefObject<number>;
  reducedMotion: boolean;
  onNearestChange: (
    nearest: { interactable: Interactable; inRange: boolean } | null,
  ) => void;
  onRegionChange: (region: RegionSlug | "home") => void;
  onArrival: (id: string) => void;
  onHoverChange: (id: string | null) => void;
  onFirstMove: () => void;
  pendingInteractIdRef: React.RefObject<string | null>;
  isTouch: boolean;
}

function Scene({
  map,
  pedestals,
  playerRef,
  zoomRef,
  reducedMotion,
  onNearestChange,
  onRegionChange,
  onArrival,
  onHoverChange,
  onFirstMove,
  pendingInteractIdRef,
  isTouch,
}: SceneProps) {
  const hobbies = useMemo(() => getHobbyPlacements(), []);
  const interactables = useMemo(
    () => buildInteractables(pedestals, hobbies),
    [pedestals, hobbies],
  );
  const hasMoved = useRef(false);

  // Mirrors what's bubbled to onNearestChange — kept locally too so
  // InteractPrompt (rendered inside the Canvas, right here in Scene) can
  // anchor itself to the interactable's actual world position via Html,
  // instead of the fixed screen position it used to render at.
  const [nearestState, setNearestState] = useState<{
    interactable: Interactable;
    inRange: boolean;
  } | null>(null);

  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  const lastNearestId = useRef<string | null>(null);
  const lastRegion = useRef<RegionSlug | "home" | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const glowTargetRef = useRef<{ x: number; z: number } | null>(null);

  const internalPlayerRef = useRef<PlayerHandle | null>(null);

  const handleHover = useCallback(
    (id: string | null) => {
      hoveredIdRef.current = id;
      onHoverChange(id);
    },
    [onHoverChange],
  );

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
      const next =
        inRange && nearest
          ? { interactable: nearest.interactable, inRange: true }
          : null;
      onNearestChange(next);
      setNearestState(next);
    }

    if (inRange && pendingInteractIdRef.current === id && id) {
      pendingInteractIdRef.current = null;
      onArrival(id);
    }

    // Glow whatever's hovered (desktop mouse), falling back to whatever's
    // in walking range (touch/keyboard users without a hover signal).
    const glowId = hoveredIdRef.current ?? id;
    const glowTarget = glowId
      ? interactables.find((i) => i.id === glowId)
      : null;
    glowTargetRef.current = glowTarget
      ? { x: glowTarget.worldX, z: glowTarget.worldZ }
      : null;

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
        onHover={handleHover}
        playerPositionRef={targetRef}
        hoveredIdRef={hoveredIdRef}
      />
      <InteractPrompt
        nearest={nearestState}
        isTouch={isTouch}
        onInteract={onArrival}
      />
      <Player
        ref={internalPlayerRef}
        tiles={map.tiles}
        gridOffset={GRID_OFFSET}
        reducedMotion={reducedMotion}
        onMovingChange={(moving) => {
          if (moving && !hasMoved.current) {
            hasMoved.current = true;
            onFirstMove();
          }
        }}
      />
      {/* Cheap blob shadow under the player — doubles as the touch-device
          shadow substitute and a subtle grounding cue on desktop too. */}
      <BlobShadow targetRef={targetRef} />
      <InteractGlow targetRef={glowTargetRef} />
      {DEBUG && <Stats />}
    </>
  );
}

/** Anchored to the interactable's own world position via drei's Html —
 * previously this rendered as a fixed-position HUD button that stayed at
 * the bottom of the screen regardless of where the object actually was.
 *
 * The Html wrapper itself stays mounted at all times (parked off-world when
 * there's nothing in range) rather than conditionally rendering it — drei's
 * Html creates its own portal root, and mounting/unmounting that every time
 * the player walks in and out of range was tripping React's "unmount while
 * rendering" warning. Only the button inside toggles. */
function InteractPrompt({
  nearest,
  isTouch,
  onInteract,
}: {
  nearest: { interactable: Interactable; inRange: boolean } | null;
  isTouch: boolean;
  onInteract: (id: string) => void;
}) {
  const visible = !!nearest?.inRange;
  const interactable = nearest?.interactable;
  const position: [number, number, number] = interactable
    ? [interactable.worldX, 1.9, interactable.worldZ]
    : [0, -1000, 0];

  return (
    <Html position={position} center zIndexRange={[15, 0]}>
      {visible && interactable && (
        <button
          onClick={() => onInteract(interactable.id)}
          className="border-grass/50 bg-background/90 text-foreground pointer-events-auto rounded-md border-2 px-4 py-2 font-mono text-sm whitespace-nowrap backdrop-blur-sm"
        >
          {isTouch ? "Tap to open" : `[E] ${interactable.label}`}
        </button>
      )}
    </Html>
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

/** Ring under whatever's hovered or in interact range — hidden (not
 * unmounted) when there's nothing to point at, so toggling it doesn't cost
 * a mount/unmount every time the player walks in and out of range. */
function InteractGlow({
  targetRef,
}: {
  targetRef: React.RefObject<{ x: number; z: number } | null>;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const target = targetRef.current;
    mesh.visible = !!target;
    if (target) {
      mesh.position.set(target.x, 0.06, target.z);
      const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.08;
      mesh.scale.setScalar(pulse);
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.45, 0.62, 24]} />
      <meshBasicMaterial
        color={WORLD_COLORS.neonSign}
        transparent
        opacity={0.85}
        toneMapped={false}
      />
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [controlsHintVisible, setControlsHintVisible] = useState(true);
  const [worldReady, setWorldReady] = useState(false);

  const isMobile = useMediaQuery("(max-width: 639px)");
  const [minimapCollapsedOverride, setMinimapCollapsedOverride] = useState<
    boolean | null
  >(null);
  const minimapCollapsed = minimapCollapsedOverride ?? isMobile;

  const map = useMemo(() => generateMap(), []);
  const pedestals = useMemo(() => getPedestalPlacements(), []);

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

  // Prev/Next in the project panel: find the project's siblings in the same
  // region's pedestal row, wrap around, and walk there — reusing the same
  // "approach, then open on arrival" path a pedestal click already takes,
  // rather than teleporting the panel out from under the player.
  const handleCycle = useCallback(
    (direction: "prev" | "next") => {
      if (!openPanel || openPanel.kind !== "project") return;
      const slug = openPanel.id.replace("project:", "");
      const current = getProject(slug);
      const player = playerRef.current;
      if (!current || !player) return;
      const siblings = pedestals.filter(
        (p) => p.project.region === current.region,
      );
      const index = siblings.findIndex((p) => p.project.slug === slug);
      if (index === -1 || siblings.length < 2) return;
      const nextIndex =
        direction === "next"
          ? (index + 1) % siblings.length
          : (index - 1 + siblings.length) % siblings.length;
      const target = siblings[nextIndex];
      const id = `project:${target.project.slug}`;
      setOpenPanel(null);
      pendingInteractIdRef.current = id;
      player.moveTo(target.x - GRID_OFFSET, target.z - GRID_OFFSET);
    },
    [openPanel, pedestals],
  );

  const handleReplayIntro = useCallback(() => {
    try {
      localStorage.removeItem(INTRO_STORAGE_KEY);
    } catch {
      // Storage blocked — nothing to clean up, reload still replays fine
      // since "unreadable flag" already falls through to showing the card.
    }
    window.location.reload();
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

  // "E" opens whatever's currently in range, "M" toggles the minimap, "?"
  // reopens the help dialog (and the controls hint behind it). Skipped
  // while a form field has focus — the mailbox panel has a real text input,
  // and "?" in particular is easy to type by accident (Shift+/).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const active = document.activeElement;
      const typing =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement;
      if (typing) return;

      if (e.key.toLowerCase() === "e") {
        if (nearest?.inRange) handleArrival(nearest.interactable.id);
      } else if (e.key.toLowerCase() === "m") {
        setMinimapCollapsedOverride((prev) => !(prev ?? isMobile));
      } else if (e.key === "?") {
        setHelpOpen(true);
        setControlsHintVisible(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nearest, handleArrival, isMobile]);

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

  const toggleMinimap = useCallback(() => {
    setMinimapCollapsedOverride((prev) => !(prev ?? isMobile));
  }, [isMobile]);

  const canCycle = useMemo(() => {
    if (!openPanel || openPanel.kind !== "project") return false;
    const current = getProject(openPanel.id.replace("project:", ""));
    if (!current) return false;
    return (
      pedestals.filter((p) => p.project.region === current.region).length > 1
    );
  }, [openPanel, pedestals]);

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
        style={{ cursor: hoveredId ? "pointer" : undefined }}
        onCreated={(state) => {
          setWorldReady(true);
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
          map={map}
          pedestals={pedestals}
          playerRef={playerRef}
          zoomRef={zoomRef}
          reducedMotion={reducedMotion}
          onNearestChange={setNearest}
          onRegionChange={setRegion}
          onArrival={handleArrival}
          onHoverChange={setHoveredId}
          onFirstMove={() => setControlsHintVisible(false)}
          pendingInteractIdRef={pendingInteractIdRef}
          isTouch={isTouch}
        />
      </Canvas>

      <Hud
        region={region}
        isTouch={isTouch}
        reducedMotion={reducedMotion}
        onZoomIn={() => applyZoomDelta(8)}
        onZoomOut={() => applyZoomDelta(-8)}
        controlsHintVisible={controlsHintVisible}
        helpOpen={helpOpen}
        onHelpOpenChange={setHelpOpen}
        onReplayIntro={handleReplayIntro}
        tiles={map.tiles}
        playerRef={playerRef}
        minimapCollapsed={minimapCollapsed}
        onToggleMinimap={toggleMinimap}
        onFastTravel={handleFastTravel}
      />
      <Panels
        open={openPanel}
        onClose={() => setOpenPanel(null)}
        onFastTravel={handleFastTravel}
        onCycle={handleCycle}
        canCycle={canCycle}
      />
      <EnterWorldIntro ready={worldReady} reducedMotion={reducedMotion} />
    </div>
  );
}
