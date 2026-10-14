import type { TimelineEntry } from "./types";

// Professional entry stays generic by design — never name the employer's
// clients, internal systems, or databases.
export const timeline: TimelineEntry[] = [
  {
    date: "2025 – present",
    title: "Integration Engineer — fintech CRM",
    description:
      "Building and maintaining integrations for a fintech CRM platform.",
  },
  // TODO(jordan): confirm the actual date for each project milestone below.
  {
    date: "2025",
    title: "N-Body Gravity Sandbox",
    description:
      "Launched an N-body gravity simulation with a guided tutorial and shareable scenes.",
  },
  {
    date: "2025",
    title: "Genesis",
    description:
      "Built a neuroevolution ecosystem exploring instinct vs. learned behavior.",
  },
  {
    date: "2025",
    title: "Crucible",
    description:
      "Built a falling-sand physics sandbox with full chemistry simulation.",
  },
  {
    date: "2025",
    title: "Jord World",
    description:
      "Started building this site — an explorable voxel world for projects and hobbies.",
  },
];
