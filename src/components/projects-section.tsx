import { ProjectCard } from "@/components/project-card";
import { getFeaturedProjects, getProjectsByRegion } from "@/content/projects";
import { getRegion } from "@/content/regions";
import type { ProjectRegion } from "@/content/types";

const REGION_ORDER: ProjectRegion[] = ["lab", "arcade", "workshop"];

export function ProjectsSection() {
  const featured = getFeaturedProjects();

  return (
    <section id="projects" className="mx-auto max-w-5xl px-4 py-20">
      {featured.length > 0 && (
        <div className="mb-16">
          <h2 className="font-heading text-foreground mb-6 text-2xl">
            Featured
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </div>
      )}

      {REGION_ORDER.map((regionSlug) => {
        const regionProjects = getProjectsByRegion(regionSlug);
        if (regionProjects.length === 0) return null;
        const region = getRegion(regionSlug);

        return (
          <div key={regionSlug} className="mb-16">
            <h2 className="font-heading text-foreground mb-6 text-2xl">
              {region.emoji} {region.label}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {regionProjects.map((p) => (
                <ProjectCard key={p.slug} project={p} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
