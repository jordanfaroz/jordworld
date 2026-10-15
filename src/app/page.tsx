import Link from "next/link";

import { WorldLoader } from "@/world/WorldLoader";
import { getVisibleProjects } from "@/content/projects";

export default function Home() {
  const projects = getVisibleProjects();

  return (
    <>
      {/* Always server-rendered: real content for SEO, no-JS, and screen
          readers, visually hidden once the world mounts over it but still
          reachable by keyboard (sr-only, revealed on focus). */}
      <div className="focus-within:bg-background sr-only focus-within:not-sr-only focus-within:fixed focus-within:inset-0 focus-within:z-50 focus-within:p-4">
        <h1 className="font-heading text-foreground text-2xl">
          Jord World — Jordan Faroz
        </h1>
        <p className="text-muted-foreground">
          I build worlds, simulations and tools.
        </p>
        <nav className="mt-4 flex flex-col gap-2">
          <Link href="/classic" className="text-grass hover:underline">
            Classic view
          </Link>
          {projects.map((p) => (
            <Link
              key={p.slug}
              href={`/projects/${p.slug}`}
              className="text-grass hover:underline"
            >
              {p.title}
            </Link>
          ))}
        </nav>
      </div>

      <WorldLoader />
    </>
  );
}
