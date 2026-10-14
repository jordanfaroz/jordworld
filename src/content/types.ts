export type Region = "lab" | "arcade" | "workshop" | "park" | "home";

export type ProjectRegion = Exclude<Region, "park" | "home">;

export type ProjectStatus = "live" | "in-dev" | "coming-soon";

// To launch a project, deploy it, then set deployed: true.
export interface Project {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  region: ProjectRegion;
  status: ProjectStatus;
  url?: string;
  /** Whether `url` actually resolves yet — a project can have its future URL
   * decided before it's live there. */
  deployed: boolean;
  /** Excluded from every list, page, the sitemap, and the world. */
  hidden?: boolean;
  repo?: string;
  tech: string[];
  featured: boolean;
  media?: { src: string; alt: string };
  date?: string;
}

export interface Profile {
  name: string;
  handle: string;
  tagline: string;
  email: string;
  github: string;
  linkedin: string;
  bio: string;
  skills: Record<string, string[]>;
}

export interface Hobby {
  slug: string;
  title: string;
  blurb: string;
  /** Lucide icon name, e.g. "Dumbbell". */
  icon: string;
  /** Bento Grid cell size hint. */
  size: "sm" | "md" | "lg";
}

export interface TimelineEntry {
  date: string;
  title: string;
  description: string;
}

export interface RegionInfo {
  slug: Region;
  emoji: string;
  label: string;
}
