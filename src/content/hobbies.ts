import type { Hobby } from "./types";

export const hobbies: Hobby[] = [
  {
    slug: "gaming",
    title: "Gaming",
    blurb:
      "Minecraft modpacks and 2-player co-op: Grounded, Palworld, Astroneer, Helldivers 2.",
    icon: "Gamepad2",
    size: "lg",
  },
  {
    slug: "chess",
    title: "Chess",
    blurb: "Always up for a game. Openings are a work in progress.",
    icon: "ChessKnight",
    size: "sm",
  },
  {
    slug: "football",
    title: "Football",
    blurb: "Playing it, watching it, arguing about it.",
    icon: "Goal",
    size: "sm",
  },
  {
    slug: "gym",
    title: "Gym",
    blurb: "Lifting to balance out the hours at the keyboard.",
    icon: "Dumbbell",
    size: "md",
  },
  {
    slug: "hiking",
    title: "Hiking",
    blurb: "Trails, views and the occasional wrong turn.",
    icon: "HikingStick",
    size: "md",
  },
  {
    slug: "swimming",
    title: "Swimming",
    blurb: "Laps in the pool to reset the brain.",
    icon: "Waves",
    size: "sm",
  },
  {
    slug: "collecting",
    title: "Collecting",
    blurb: "A collector of niche things. Ask me about it.",
    icon: "Package",
    size: "md",
  },
];
