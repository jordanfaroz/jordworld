"use client";

import { useState } from "react";
import Link from "next/link";

import { TextRoll } from "@/components/motion-primitives/text-roll";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Button } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/dot-pattern";
import { StarField } from "@/components/star-field";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { getProject } from "@/content/projects";

export function Hero() {
  const reducedMotion = usePrefersReducedMotion();
  const [replayKey, setReplayKey] = useState(0);
  const nbody = getProject("nbody");

  return (
    <section
      id="top"
      className="relative overflow-hidden px-4 py-24 text-center sm:py-32"
    >
      <DotPattern className="[mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
      <StarField />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4">
        <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          Jord World
        </p>
        <h1
          className="font-heading text-foreground text-4xl sm:text-6xl"
          onMouseEnter={() => setReplayKey((k) => k + 1)}
        >
          {reducedMotion ? (
            "JORDAN FAROZ"
          ) : (
            <TextRoll key={replayKey}>JORDAN FAROZ</TextRoll>
          )}
        </h1>
        <p className="text-muted-foreground max-w-md">
          I build worlds, simulations and tools.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {nbody?.url && (
            <ShimmerButton
              background="var(--primary)"
              shimmerColor="var(--background)"
              className="text-primary-foreground"
              onClick={() =>
                window.open(nbody.url, "_blank", "noopener,noreferrer")
              }
            >
              Play N-Body
            </ShimmerButton>
          )}
          <Button
            variant="outline"
            render={<Link href="/" />}
            nativeButton={false}
          >
            Enter World
          </Button>
        </div>
      </div>
    </section>
  );
}
