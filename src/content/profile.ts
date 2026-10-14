import type { Profile } from "./types";

export const profile: Profile = {
  name: "Jordan Faroz",
  handle: "Jord",
  tagline: "I build worlds, simulations and tools.",
  email: "jordanfaroz.jf@gmail.com",
  github: "https://github.com/jordanfaroz",
  linkedin: "https://www.linkedin.com/in/jordan-faroz",
  bio: "I'm Jordan, an integration engineer in fintech by day and a builder of physics simulations, games and tools by night. I love making systems that come alive on their own: orbits that form, creatures that learn, sand that burns. Away from the keyboard you'll find me at the gym, in the pool, on a hiking trail, or deep in a game of chess or football.",
  // TODO(jordan): review this grouping and the specific items in each group.
  skills: {
    Frontend: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    "Graphics & Simulation": [
      "Three.js",
      "Canvas 2D",
      "WebGL",
      "Physics simulation",
    ],
    "Backend & Data": ["Node.js", "PostgreSQL", "REST APIs"],
    Integration: ["CRM integration", "Webhooks", "ETL pipelines"],
  },
};
