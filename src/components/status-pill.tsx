import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Project } from "@/content/types";

const LABEL: Record<Project["status"], string> = {
  live: "Live",
  "in-dev": "In dev",
  "coming-soon": "Coming soon",
};

/** C11: live (grass, pulsing dot), in-dev (amber), coming-soon (muted). */
export function StatusPill({
  status,
  className,
}: {
  status: Project["status"];
  className?: string;
}) {
  return (
    <Badge variant={status} className={cn("gap-1.5", className)}>
      {status === "live" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="bg-grass absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 motion-reduce:animate-none" />
          <span className="bg-grass relative inline-flex h-1.5 w-1.5 rounded-full" />
        </span>
      )}
      {LABEL[status]}
    </Badge>
  );
}
