import { Button } from "@/components/ui/button";
import type { Project } from "@/content/types";

/**
 * Shared across project cards, detail pages, and (later) world panels — the
 * play/source/launching-soon logic must stay identical everywhere a project
 * is shown, so it lives here once instead of being re-derived per caller.
 */
export function ProjectActions({ project }: { project: Project }) {
  const { url, deployed, repo, status } = project;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {url && deployed && (
        <Button
          size="sm"
          render={<a href={url} target="_blank" rel="noopener noreferrer" />}
          nativeButton={false}
        >
          Play
        </Button>
      )}
      {repo && (
        <Button
          size="sm"
          variant="outline"
          render={<a href={repo} target="_blank" rel="noopener noreferrer" />}
          nativeButton={false}
        >
          Source
        </Button>
      )}
      {url && !deployed && status !== "coming-soon" && (
        <span className="text-muted-foreground font-mono text-xs">
          Launching soon at {new URL(url).hostname}
        </span>
      )}
    </div>
  );
}
