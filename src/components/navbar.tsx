"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import { TextRoll } from "@/components/motion-primitives/text-roll";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

const LINKS = [
  { href: "#projects", label: "Projects" },
  { href: "#journey", label: "Journey" },
  { href: "#off-world", label: "Off-World" },
  { href: "#contact", label: "Contact" },
];

function NavLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  // TextRoll animates once on mount, not on an actual "hover" signal — a key
  // bump forces a remount (and so a replay) each time the pointer enters.
  const [replayKey, setReplayKey] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <a
      href={href}
      onClick={onClick}
      onMouseEnter={() => setReplayKey((k) => k + 1)}
      className="text-muted-foreground hover:text-foreground font-mono text-sm transition-colors"
    >
      {reducedMotion ? label : <TextRoll key={replayKey}>{label}</TextRoll>}
    </a>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 w-full border-b-2 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <a href="#top" className="font-heading text-foreground text-sm">
          Jord World
        </a>

        <div className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.href} {...l} />
          ))}
        </div>

        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button size="icon" variant="ghost" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              }
            />
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="font-heading">Jord World</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 p-4">
                {LINKS.map((l) => (
                  <NavLink key={l.href} {...l} onClick={() => setOpen(false)} />
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
