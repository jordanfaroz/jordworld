import type { MetadataRoute } from "next";

import { getVisibleProjects } from "@/content/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: "https://jordworld.com", lastModified: now },
    { url: "https://jordworld.com/classic", lastModified: now },
    ...getVisibleProjects().map((p) => ({
      url: `https://jordworld.com/projects/${p.slug}`,
      lastModified: now,
    })),
  ];
}
