import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string;
  className: string;
  background?: ReactNode;
  Icon: React.ElementType;
  description: string;
  /** Omit for a purely informational card with no click-through. */
  href?: string;
  cta?: string;
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        // dense packing: differently-sized cells (hobbies' sm/md/lg) still
        // fill every row with no leftover gaps.
        "grid w-full grid-flow-row-dense auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[12rem] sm:grid-cols-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      // Pixel-game aesthetic: chunky 2px border, squared radius, no hover
      // box-shadow trick — just a border color shift.
      "group border-border bg-card hover:border-grass/50 relative col-span-3 flex flex-col justify-between overflow-hidden rounded-lg border-2 transition-colors",
      className,
    )}
    {...props}
  >
    {background && <div>{background}</div>}
    <div className="p-4">
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 transition-all duration-300 lg:group-hover:-translate-y-6">
        <Icon className="text-foreground/70 group-hover:text-grass h-10 w-10 origin-left transform-gpu transition-all duration-300 ease-in-out group-hover:scale-75" />
        <h3 className="font-heading text-foreground text-lg">{name}</h3>
        <p className="text-muted-foreground max-w-lg text-sm">{description}</p>
      </div>
    </div>

    {href && cta && (
      <div className="pointer-events-none absolute bottom-0 flex w-full translate-y-8 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <a
          href={href}
          className="text-grass pointer-events-auto flex items-center gap-1 text-sm font-medium hover:underline"
        >
          {cta}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    )}
  </div>
);

export { BentoCard, BentoGrid };
