"use client";

import Link from "next/link";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { ProjectActions } from "@/components/project-actions";
import { ContactForm } from "@/components/contact-form";
import { useMediaQuery } from "@/lib/use-media-query";
import { getProject } from "@/content/projects";
import { hobbies } from "@/content/hobbies";
import { regions, getRegion } from "@/content/regions";
import type { Interactable } from "./interaction";
import type { Project } from "@/content/types";

export interface PanelsProps {
  open: Interactable | null;
  onClose: () => void;
  onFastTravel: (regionSlug: string) => void;
  onCycle: (direction: "prev" | "next") => void;
  canCycle: boolean;
}

const STRIP_COLOR: Record<Project["status"], string> = {
  live: "bg-grass",
  "in-dev": "bg-amber",
  "coming-soon": "bg-muted-foreground/40",
};

export function Panels({
  open,
  onClose,
  onFastTravel,
  onCycle,
  canCycle,
}: PanelsProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const isOpen = open !== null;

  let title = "";
  let stripColor: string | null = null;
  let regionLabel: string | null = null;
  let body: React.ReactNode = null;
  let isProject = false;

  if (open?.kind === "project") {
    const slug = open.id.replace("project:", "");
    const project = getProject(slug);
    if (project) {
      isProject = true;
      title = project.title;
      stripColor = STRIP_COLOR[project.status];
      regionLabel = getRegion(project.region).label;
      body = (
        <div className="flex flex-col gap-3">
          <StatusPill status={project.status} />
          <p className="text-muted-foreground text-sm">{project.tagline}</p>
          <p className="text-foreground text-sm">{project.description}</p>
          {project.tech.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.tech.map((t) => (
                <Badge key={t} variant="outline">
                  {t}
                </Badge>
              ))}
            </div>
          )}
          {project.media && (
            <div className="border-border overflow-hidden rounded-md border-2">
              {/* Plain img, not next/image: media.src may be an external
                  URL and next.config has no remotePatterns configured. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.media.src}
                alt={project.media.alt}
                className="h-auto w-full"
              />
            </div>
          )}
          <ProjectActions project={project} />
          <Link
            href={`/projects/${project.slug}`}
            className="text-grass text-sm hover:underline"
          >
            Full page →
          </Link>
        </div>
      );
    }
  } else if (open?.kind === "hobby") {
    const slug = open.id.replace("hobby:", "");
    const hobby = hobbies.find((h) => h.slug === slug);
    if (hobby) {
      title = hobby.title;
      regionLabel = getRegion("park").label;
      body = <p className="text-muted-foreground text-sm">{hobby.blurb}</p>;
    }
  } else if (open?.kind === "signpost") {
    title = "Fast travel";
    body = (
      <div className="flex flex-col gap-2">
        {regions.map((r) => (
          <Button
            key={r.slug}
            variant="outline"
            className="justify-start"
            onClick={() => onFastTravel(r.slug)}
          >
            {r.emoji} {r.label}
          </Button>
        ))}
      </div>
    );
  } else if (open?.kind === "mailbox") {
    title = "Contact";
    body = <ContactForm />;
  }

  const header = (
    <>
      {stripColor && <div className={`h-1.5 w-full ${stripColor}`} />}
      <div className="flex items-start justify-between gap-2 px-4 pt-3">
        <div className="flex flex-col gap-0.5">
          {regionLabel && (
            <span className="text-muted-foreground font-mono text-xs">
              {regionLabel}
            </span>
          )}
          <span className="font-heading text-foreground text-lg">{title}</span>
        </div>
        <div className="flex shrink-0 gap-1">
          {isProject && canCycle && isDesktop && (
            <>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous project"
                onClick={() => onCycle("prev")}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next project"
                onClick={() => onCycle("next")}
              >
                →
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>
      </div>
    </>
  );

  const cycleButtonsMobile = isProject && canCycle && !isDesktop && (
    <div className="flex justify-center gap-2 px-4 pt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onCycle("prev")}
        className="flex-1"
      >
        ← Prev
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onCycle("next")}
        className="flex-1"
      >
        Next →
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={(next) => !next && onClose()}>
        <SheetContent
          side="right"
          className="w-[420px] gap-0 p-0 sm:max-w-[420px]"
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          {header}
          <div className="overflow-y-auto p-4">{body}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(next) => !next && onClose()}
      snapPoints={[0.5, 1]}
      showSwipeHandle
    >
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        {header}
        {cycleButtonsMobile}
        <div className="overflow-y-auto p-4">{body}</div>
      </DrawerContent>
    </Drawer>
  );
}
