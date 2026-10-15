"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

function LoadingScreen() {
  return (
    <div className="bg-background flex h-dvh w-full flex-col items-center justify-center gap-4">
      <p className="font-heading text-foreground text-xl">Loading world…</p>
      <div className="border-border h-2 w-48 overflow-hidden rounded-full border-2">
        <div className="bg-grass h-full w-full origin-left animate-[loading-bar_1.4s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

const WorldCanvas = dynamic(() => import("./World").then((m) => m.World), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function UnsupportedFallback() {
  return (
    <div className="bg-background flex h-dvh w-full flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-heading text-foreground text-xl">
        This browser can&apos;t run the world
      </p>
      <p className="text-muted-foreground max-w-sm text-sm">
        The voxel world needs WebGL, which doesn&apos;t seem to be available
        here.
      </p>
      <a
        href="/classic"
        className="text-grass font-mono text-sm hover:underline"
      >
        Open classic view →
      </a>
    </div>
  );
}

/** Starts `null` (renders nothing) on both the server render and the first
 * client render — `document` doesn't exist during the server prerender, so
 * resolving this in an effect keeps the two in sync instead of risking a
 * hydration mismatch. */
export function WorldLoader() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const ok = hasWebGL();
    queueMicrotask(() => setSupported(ok));
  }, []);

  if (supported === null) return <LoadingScreen />;
  if (!supported) return <UnsupportedFallback />;
  return <WorldCanvas />;
}
