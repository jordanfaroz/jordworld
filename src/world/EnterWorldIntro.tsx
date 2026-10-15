"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { TextRoll } from "@/components/motion-primitives/text-roll";
import { ShimmerButton } from "@/components/ui/shimmer-button";

export const INTRO_STORAGE_KEY = "jordworld:intro-seen";
const TEAR_DURATION_MS = 1100;

/** Mulberry32, same as map.ts — a deterministic jagged tear line, not a
 * random one: re-rendering (or a different visitor) gets the exact same
 * shape. Math.random() would also trip the React Compiler's purity rule if
 * this ran during render instead of once at module scope. */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildTearPolygons() {
  const rand = mulberry32(2024);
  const steps = 9;
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const x = (i / steps) * 100;
    const y = 50 + (rand() - 0.5) * 11;
    return { x, y };
  });

  const top = [
    "0% 0%",
    "100% 0%",
    ...[...points].reverse().map((p) => `${p.x}% ${p.y}%`),
  ].join(", ");
  const bottom = [
    ...points.map((p) => `${p.x}% ${p.y}%`),
    "100% 100%",
    "0% 100%",
  ].join(", ");

  return { top: `polygon(${top})`, bottom: `polygon(${bottom})` };
}

const TEAR_POLYGONS = buildTearPolygons();

type Phase = "pending" | "card" | "tearing" | "done";

export interface EnterWorldIntroProps {
  ready: boolean;
  reducedMotion: boolean;
}

/** Full-screen paper-map title card shown over the loading/loaded world on
 * a first visit; "Enter World" tears the paper open to reveal it. Returning
 * visitors (localStorage) and reduced-motion users skip straight past the
 * tear — see HelpDialog's "Replay intro" for how to see it again. */
export function EnterWorldIntro({
  ready,
  reducedMotion,
}: EnterWorldIntroProps) {
  const [phase, setPhase] = useState<Phase>("pending");

  useEffect(() => {
    queueMicrotask(() => {
      let seen = false;
      try {
        seen = localStorage.getItem(INTRO_STORAGE_KEY) === "1";
      } catch {
        // Private mode / blocked storage: fall through and show the intro.
      }
      setPhase(seen ? "done" : "card");
    });
  }, []);

  const handleEnter = () => {
    if (!ready) return;
    try {
      localStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {
      // Storage blocked — the intro will just replay next visit, not fatal.
    }
    if (reducedMotion) {
      setPhase("done");
      return;
    }
    setPhase("tearing");
    window.setTimeout(() => setPhase("done"), TEAR_DURATION_MS);
  };

  if (phase === "pending" || phase === "done") return null;

  const tearing = phase === "tearing";

  return (
    <div className="fixed inset-0 z-50" aria-hidden={tearing || undefined}>
      <div
        className="bg-card absolute inset-0"
        style={{
          clipPath: TEAR_POLYGONS.top,
          animation: tearing
            ? `tear-open-top ${TEAR_DURATION_MS}ms ease-in forwards`
            : undefined,
        }}
      />
      <div
        className="bg-card absolute inset-0"
        style={{
          clipPath: TEAR_POLYGONS.bottom,
          animation: tearing
            ? `tear-open-bottom ${TEAR_DURATION_MS}ms ease-in forwards`
            : undefined,
        }}
      />

      {!tearing && (
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-6 px-4 text-center">
          <h1 className="font-heading text-foreground text-4xl sm:text-5xl">
            {reducedMotion ? "JORD WORLD" : <TextRoll>JORD WORLD</TextRoll>}
          </h1>
          <p className="text-muted-foreground max-w-sm">
            I build worlds, simulations and tools.
          </p>
          <p
            className="text-muted-foreground font-mono text-xs"
            aria-live="polite"
          >
            {ready ? "Ready." : "Generating island…"}
          </p>
          <ShimmerButton
            onClick={handleEnter}
            aria-disabled={!ready}
            autoFocus
            background="var(--primary)"
            className={!ready ? "cursor-not-allowed opacity-60" : undefined}
          >
            Enter World
          </ShimmerButton>
          <Link href="/classic" className="text-grass text-sm hover:underline">
            Classic view
          </Link>
        </div>
      )}
    </div>
  );
}
