"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/status-pill";
import { ProjectActions } from "@/components/project-actions";
import { Tilt } from "@/components/motion-primitives/tilt";
import { Spotlight } from "@/components/motion-primitives/spotlight";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import type { Project } from "@/content/types";

/** C3: Tilt (max ~6°) + cyan Spotlight around a Card. Neither runs on touch
 * (there's no hover/mouse-move signal to drive them) or under reduced motion. */
export function ProjectCard({ project }: { project: Project }) {
  const reducedMotion = usePrefersReducedMotion();
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    queueMicrotask(() => setIsTouch(coarse));
  }, []);

  const card = (
    <Card className="hover:border-grass/50 relative h-full justify-between transition-colors">
      {!isTouch && !reducedMotion && <Spotlight size={250} />}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>
            <Link
              href={`/projects/${project.slug}`}
              className="hover:text-grass"
            >
              {project.title}
            </Link>
          </CardTitle>
          <StatusPill status={project.status} />
        </div>
        <CardDescription>{project.tagline}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {project.tech.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tech.map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
        )}
        <ProjectActions project={project} />
      </CardContent>
    </Card>
  );

  if (isTouch || reducedMotion) return card;

  return (
    <Tilt rotationFactor={6} springOptions={{ stiffness: 300, damping: 30 }}>
      {card}
    </Tilt>
  );
}
