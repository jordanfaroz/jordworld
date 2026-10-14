import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://jordworld.com",
      lastModified: new Date(),
    },
  ];
}
