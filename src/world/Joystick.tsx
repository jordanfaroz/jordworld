"use client";

import { useRef } from "react";
import type { JoystickVector } from "./Player";

const BASE_SIZE = 110;
const RADIUS = BASE_SIZE / 2;
const KNOB_SIZE = 48;

export interface JoystickProps {
  /** Mutated in place every frame — read directly by Player, not passed
   * through React state (same pattern as the keyboard's keysDown set). */
  vectorRef: React.RefObject<JoystickVector>;
}

/** Bottom-left virtual joystick, touch devices only (the caller gates
 * rendering on `matchMedia("(pointer: coarse)")`). 8-direction analog: the
 * reported vector is normalized screen-space (x: right+/left-, y: up+/
 * down-), which Player.tsx blends into the same SCREEN_DIRS used by WASD —
 * so joystick and keyboard produce identical directions, just one discrete
 * and one continuous. Pushing to the edge (|v| >= 0.92, matching Player's
 * RUN_THRESHOLD) is a run, same as holding Shift on desktop. */
export function Joystick({ vectorRef }: JoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activePointerId = useRef<number | null>(null);
  const originRef = useRef({ x: 0, y: 0 });

  const setVector = (x: number, y: number) => {
    const v = vectorRef.current;
    v.x = x;
    v.y = y;
  };

  const updateKnob = (dx: number, dy: number) => {
    const knob = knobRef.current;
    if (knob) knob.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const updateFromPointer = (clientX: number, clientY: number) => {
    const origin = originRef.current;
    let dx = clientX - origin.x;
    let dy = clientY - origin.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, RADIUS);
    if (dist > 0) {
      dx = (dx / dist) * clamped;
      dy = (dy / dist) * clamped;
    }
    updateKnob(dx, dy);
    const magnitude = clamped / RADIUS;
    // Screen Y grows downward; "up" on the stick should read as +1.
    const nx = clamped > 0 ? dx / clamped : 0;
    const ny = clamped > 0 ? -dy / clamped : 0;
    setVector(nx * magnitude, ny * magnitude);
  };

  const release = () => {
    activePointerId.current = null;
    updateKnob(0, 0);
    setVector(0, 0);
  };

  // stopPropagation on every handler, not just preventDefault on down: the
  // world container tracks its own pointer events for pinch-to-zoom (two
  // simultaneous pointers), and without this a joystick touch would feed
  // that tracking too — harmless with one finger, but it'd throw pinch math
  // off if a second finger landed elsewhere for a zoom while the joystick
  // was in use.
  const onPointerDown = (e: React.PointerEvent) => {
    const base = baseRef.current;
    if (!base) return;
    e.preventDefault();
    e.stopPropagation();
    base.setPointerCapture(e.pointerId);
    activePointerId.current = e.pointerId;
    const rect = base.getBoundingClientRect();
    originRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    updateFromPointer(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (activePointerId.current !== e.pointerId) return;
    e.stopPropagation();
    updateFromPointer(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (activePointerId.current !== e.pointerId) return;
    e.stopPropagation();
    release();
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="border-border bg-background/35 pointer-events-auto absolute bottom-4 left-4 z-10 touch-none rounded-full border-2 backdrop-blur-sm select-none"
      style={{
        width: BASE_SIZE,
        height: BASE_SIZE,
        marginBottom: "env(safe-area-inset-bottom)",
        marginLeft: "env(safe-area-inset-left)",
      }}
      aria-hidden="true"
    >
      <div
        ref={knobRef}
        className="border-grass/60 bg-foreground/30 pointer-events-none absolute top-1/2 left-1/2 rounded-full border-2"
        style={{
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          marginTop: -KNOB_SIZE / 2,
          marginLeft: -KNOB_SIZE / 2,
        }}
      />
    </div>
  );
}
