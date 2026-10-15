import Link from "next/link";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { ProjectActions } from "@/components/project-actions";
import { ContactForm } from "@/components/contact-form";
import { getProject } from "@/content/projects";
import { hobbies } from "@/content/hobbies";
import { regions } from "@/content/regions";
import type { Interactable } from "./interaction";

export interface PanelsProps {
  open: Interactable | null;
  onClose: () => void;
  onFastTravel: (regionSlug: string) => void;
}

export function Panels({ open, onClose, onFastTravel }: PanelsProps) {
  const isOpen = open !== null;

  let title = "";
  let body: React.ReactNode = null;

  if (open?.kind === "project") {
    const slug = open.id.replace("project:", "");
    const project = getProject(slug);
    if (project) {
      title = project.title;
      body = (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <StatusPill status={project.status} />
          </div>
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

  return (
    <Sheet open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="font-heading">{title}</SheetTitle>
        </SheetHeader>
        <div className="p-4">{body}</div>
      </SheetContent>
    </Sheet>
  );
}
