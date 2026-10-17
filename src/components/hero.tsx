"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { getProject } from "@/content/projects";
import { profile } from "@/content/profile";
import {
  generateBlackHoleImage,
  BLACK_HOLE_SEED,
} from "@/components/hero/black-hole-source";

const DESKTOP_SIZE = { width: 1600, height: 900 };
const MOBILE_SIZE = { width: 900, height: 1200 };

// Code-split: liquid-sculpture-hero.tsx is ~2000 lines, most of it GLSL
// shader source embedded as template strings. A static import bundles all
// of that into the page's initial chunk and pays its parse/compile cost
// before first paint even though the component can't render anything
// until the generated images are ready. next/dynamic (ssr:false, same
// pattern as src/world/WorldLoader.tsx) defers the fetch+parse to a
// separate chunk, only once it's actually needed.
const SculptureHero = dynamic(
  () => import("@/components/ui/liquid-sculpture-hero"),
  {
    ssr: false,
  },
);

const IMAGE_ALT =
  "A black hole's shadow ringed by a bright photon ring, with a thin violet-to-blue accretion disk crossing in front and a soft lensed halo above and below it";

function firstSentence(text: string): string {
  const idx = text.indexOf(". ");
  return idx === -1 ? text : text.slice(0, idx + 1);
}

/** The same static layout for two cases: reduced motion (no particle engine
 * at all), and the brief window before the generated images are ready (so
 * SculptureHero is never mounted with its own default `src`, which points
 * at 21st.dev's CDN — we never want that to flash on screen, even once). */
function StaticHero({
  body,
  nbodyUrl,
  bg,
}: {
  body: string;
  nbodyUrl: string;
  bg: string | null;
}) {
  // min-h-[100svh]: matches SculptureHero's own fixed `height="100svh"` so
  // swapping from this placeholder to the real engine (once `images` is
  // ready) never changes the document's height — that mismatch was causing
  // a huge CLS hit (~1.7) as everything below the hero jumped once the
  // short, content-sized placeholder was replaced by a full-viewport
  // section.
  return (
    <section className="bg-background relative flex min-h-[100svh] flex-col items-center justify-end overflow-hidden px-4 pt-24 pb-16 text-center sm:pb-20">
      {bg && (
        <img
          src={bg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-top opacity-80"
        />
      )}
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4">
        <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          Jord World
        </p>
        <h1 className="font-heading text-foreground text-4xl sm:text-6xl">
          I build worlds,
          <br />
          simulations and tools.
        </h1>
        <p className="text-muted-foreground max-w-md">{body}</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <ShimmerButton
            background="var(--primary)"
            shimmerColor="var(--background)"
            className="text-primary-foreground"
            onClick={() =>
              window.open(nbodyUrl, "_blank", "noopener,noreferrer")
            }
          >
            Play N-Body
          </ShimmerButton>
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

export function Hero() {
  const reducedMotion = usePrefersReducedMotion();
  const nbody = getProject("nbody");
  const nbodyUrl = nbody?.url ?? "https://nbody.jordworld.com";
  const body = firstSentence(profile.bio);

  const [images, setImages] = useState<{
    desktop: string;
    mobile: string;
  } | null>(null);

  useEffect(() => {
    // Generated regardless of reduced-motion: the static fallback needs the
    // same image, just without SculptureHero's particle engine mounted.
    // Deferred to a frame after mount so generation never competes with
    // first paint.
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      const desktop = generateBlackHoleImage({
        ...DESKTOP_SIZE,
        seed: BLACK_HOLE_SEED,
        warmHighlight: true,
      });
      const mobile = generateBlackHoleImage({
        ...MOBILE_SIZE,
        seed: BLACK_HOLE_SEED + 1,
        warmHighlight: true,
      });
      if (!cancelled) setImages({ desktop, mobile });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  // A stable wrapper id, not one on either branch directly: the navbar's
  // logo links to #top, and SculptureHero's own root has no `id` prop to
  // set — without this wrapper, that anchor would vanish the instant the
  // generated images are ready and SculptureHero replaces StaticHero.
  // min-h-[100svh] here too, not just on StaticHero: SculptureHero is loaded
  // via next/dynamic(ssr:false) with no `loading` fallback, so there's a
  // real gap between `images` becoming ready (StaticHero unmounts) and that
  // chunk finishing load (it renders null until then) — without a height
  // reserved on the wrapper itself, the whole page collapses and snaps back
  // during that gap, which was the single largest layout-shift source here.
  return (
    <div id="top" className="min-h-[100svh]">
      {reducedMotion || !images ? (
        <StaticHero
          body={body}
          nbodyUrl={nbodyUrl}
          bg={images?.desktop ?? null}
        />
      ) : (
        <SculptureHero
          src={images.desktop}
          darkSrc={images.desktop}
          mobileSrc={images.mobile}
          mobileDarkSrc={images.mobile}
          imageAlt={IMAGE_ALT}
          showNav={false}
          eyebrow="JORD WORLD"
          headline={"I build worlds,\nsimulations and tools."}
          headlineAccent="simulations and tools."
          body={body}
          primaryCta={{ label: "Play N-Body", href: nbodyUrl }}
          secondaryCta={{ label: "Enter World", href: "/" }}
          hint="Stir the dust"
          hintTouch="Touch to stir"
          background="#0b1020"
          theme="dark"
          themeToggle={false}
          accentColor="#22d3ee"
          backdropText="JORD"
          interactive
          // The component's own buildParticles() walks every cell of a
          // baseGrid*sqrt(density) grid synchronously on the main thread — a
          // real Lighthouse mobile TBT/bootup-time cost (confirmed directly:
          // pushing this to 1.8, the density the brief originally asked for,
          // measurably doubled main-thread blocking time in local testing).
          // 0.8 is a deliberate compromise below that ask, trading some of
          // the "finer dust" look for staying inside the performance budget.
          // Spawn is now stochastic on source alpha (see buildParticles in
          // liquid-sculpture-hero.tsx) instead of a hard threshold, so going
          // denser reads as finer dust rather than a visibly denser grid —
          // lowPower devices still clamp the grid itself (baseGrid 640 vs
          // 1000) independently of this.
          particleDensity={0.8}
          dotSize={0.85}
          restStyle="particles"
          ambient
          ambientIntensity={1.1}
          turbulence={1.3}
          liquid={1.3}
          streaks
          intro={false}
          showCredit
          height="100svh"
        />
      )}
    </div>
  );
}
