import type { Project } from "./types";

// To launch a project, deploy it, then set deployed: true.
export const projects: Project[] = [
  {
    slug: "nbody",
    title: "N-Body Gravity Sandbox",
    tagline:
      "Place stars, planets, and black holes. Watch gravity do the rest.",
    description:
      "Verlet-integrated gravity simulation. Spawn stars, planets, and black holes and watch orbits form and bodies merge, with a guided tutorial and shareable scenes.",
    region: "lab",
    status: "live",
    url: "https://nbody.jordworld.com",
    deployed: true,
    repo: "https://github.com/jordanfaroz/gravity-sandbox",
    tech: ["Next.js", "TypeScript", "Canvas", "Tailwind"],
    featured: true,
  },
  {
    slug: "genesis",
    title: "Genesis",
    tagline: "Instinct vs. learning, played out across generations.",
    description:
      "A neuroevolution ecosystem: instinct vs. learner creatures with neural-network brains compete and reproduce, the Baldwin effect emerges over generations, and live population graphs track it all.",
    region: "lab",
    status: "live",
    url: "https://genesis.jordworld.com",
    deployed: false,
    // TODO(jordan): repo URL
    tech: ["Three.js", "TypeScript"],
    featured: true,
  },
  {
    slug: "crucible",
    title: "Crucible",
    tagline: "A falling-sand sandbox with real chemistry.",
    description:
      "Falling-sand physics sandbox with 21 materials and chemistry reactions — fire, lava, acid, electricity — chunked simulation running at 60fps, with 15 preset scenes.",
    region: "lab",
    status: "live",
    url: "https://crucible.jordworld.com",
    deployed: true,
    repo: "https://github.com/jordanfaroz/crucible-sandbox",
    tech: ["TypeScript", "Three.js"],
    featured: true,
  },
  {
    slug: "beaker-mixer",
    title: "Beaker Mixer",
    tagline: "TODO(jordan): write a tagline",
    // This project stays hidden until you replace this with a real description.
    description: "TODO(jordan): write a description",
    region: "lab",
    status: "live",
    url: "https://beaker.jordworld.com",
    deployed: false,
    hidden: true,
    // TODO(jordan): repo URL
    // TODO(jordan): tech stack
    tech: [],
    featured: false,
  },
  {
    slug: "orbital-timeline-resume",
    title: "Orbital Timeline Résumé",
    tagline: "A résumé that orbits.",
    description:
      "An interactive résumé with a WebGL shader background — career history laid out along an orbital timeline instead of a page of bullet points.",
    region: "workshop",
    status: "live",
    url: "https://resume.jordworld.com",
    deployed: true,
    repo: "https://github.com/jordanfaroz/orbital-timeline",
    // TODO(jordan): tech stack — WebGL shader confirmed, rest unconfirmed
    tech: [],
    featured: false,
  },
  {
    slug: "kinetiq",
    title: "Kinetiq",
    tagline: "An auto-battler arena, ball by ball.",
    description:
      "An auto-battler ball arena with named bosses and cinematic effects — set your formation, then watch the physics decide the fight.",
    region: "arcade",
    status: "in-dev",
    url: "https://kinetiq.jordworld.com",
    deployed: false,
    // TODO(jordan): repo URL
    // TODO(jordan): tech stack
    tech: [],
    featured: false,
  },
  {
    slug: "emberdepth",
    title: "Emberdepth",
    tagline: "Procedural dungeons, one turn at a time.",
    description:
      "A systemic roguelike: procedural dungeons and turn-based combat, built around systems that interact rather than a fixed script.",
    region: "arcade",
    status: "coming-soon",
    deployed: false,
    // TODO(jordan): repo URL
    // TODO(jordan): tech stack
    tech: [],
    featured: false,
  },
  {
    slug: "xslt-debugger",
    title: "XSLT Debugger",
    tagline: "See exactly why your transform did that.",
    description:
      "An XSLT 1.0 debugging tool: step tracing, an XPath REPL, template-match analysis, and error messages that actually say what went wrong.",
    region: "workshop",
    status: "coming-soon",
    url: "https://xslt.jordworld.com",
    deployed: false,
    // TODO(jordan): repo URL
    // TODO(jordan): tech stack
    tech: [],
    featured: false,
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug && !p.hidden);
}

export function getVisibleProjects(): Project[] {
  return projects.filter((p) => !p.hidden);
}

export function getFeaturedProjects(): Project[] {
  return getVisibleProjects().filter((p) => p.featured);
}

export function getProjectsByRegion(region: Project["region"]): Project[] {
  return getVisibleProjects().filter((p) => p.region === region);
}
