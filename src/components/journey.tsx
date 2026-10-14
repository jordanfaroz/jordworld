import { Timeline, type TimelineEntry } from "@/components/ui/timeline";
import { Badge } from "@/components/ui/badge";
import { profile } from "@/content/profile";
import { timeline } from "@/content/timeline";

function toTimelineData(entries: typeof timeline): TimelineEntry[] {
  return entries.map((e) => ({
    title: e.date,
    content: <p className="text-muted-foreground text-sm">{e.description}</p>,
  }));
}

export function Journey() {
  return (
    <section id="journey">
      <div className="mx-auto max-w-5xl px-4 pt-20">
        <h2 className="font-heading text-foreground mb-4 text-2xl">Journey</h2>
        <p className="text-muted-foreground max-w-2xl">{profile.bio}</p>

        <div className="mt-8">
          <h3 className="text-muted-foreground mb-3 font-mono text-sm tracking-widest uppercase">
            Toolbox
          </h3>
          <div className="flex flex-col gap-4">
            {Object.entries(profile.skills).map(([group, items]) => (
              <div key={group}>
                <p className="text-foreground mb-1.5 text-sm font-medium">
                  {group}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Timeline
        data={toTimelineData(timeline)}
        heading="Timeline"
        subheading="A rough history of what I've built and worked on."
      />
    </section>
  );
}
