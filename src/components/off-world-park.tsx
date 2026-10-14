import {
  Gamepad2,
  ChessKnight,
  Goal,
  Dumbbell,
  HikingStick,
  Waves,
  Package,
  type LucideIcon,
} from "lucide-react";

import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { hobbies } from "@/content/hobbies";

const ICONS: Record<string, LucideIcon> = {
  Gamepad2,
  ChessKnight,
  Goal,
  Dumbbell,
  HikingStick,
  Waves,
  Package,
};

const SIZE_CLASS: Record<(typeof hobbies)[number]["size"], string> = {
  lg: "col-span-2 row-span-2",
  md: "col-span-1 row-span-1",
  sm: "col-span-1 row-span-1",
};

export function OffWorldPark() {
  return (
    <section id="off-world" className="mx-auto max-w-5xl px-4 py-20">
      <h2 className="font-heading text-foreground mb-6 text-2xl">
        🌳 Off-World Park
      </h2>
      <BentoGrid>
        {hobbies.map((h) => (
          <BentoCard
            key={h.slug}
            name={h.title}
            description={h.blurb}
            Icon={ICONS[h.icon]}
            className={SIZE_CLASS[h.size]}
          />
        ))}
      </BentoGrid>
    </section>
  );
}
