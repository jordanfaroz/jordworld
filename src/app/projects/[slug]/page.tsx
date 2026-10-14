import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { StatusPill } from "@/components/status-pill";
import { ProjectActions } from "@/components/project-actions";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getProject, getVisibleProjects } from "@/content/projects";

export function generateStaticParams() {
  return getVisibleProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return {
    title: `${project.title} — Jord World`,
    description: project.tagline,
    openGraph: {
      title: project.title,
      description: project.tagline,
      type: "website",
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="mb-3 flex items-center gap-3">
          <h1 className="font-heading text-foreground text-3xl">
            {project.title}
          </h1>
          <StatusPill status={project.status} />
        </div>
        <p className="text-muted-foreground mb-6 text-lg">{project.tagline}</p>
        <p className="text-foreground mb-6">{project.description}</p>

        {project.tech.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {project.tech.map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
        )}

        <ProjectActions project={project} />
      </main>
      <Footer />
    </>
  );
}
