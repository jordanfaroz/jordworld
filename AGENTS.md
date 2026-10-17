<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rules

- **Never let `npx shadcn add` overwrite existing files in `src/components/ui`.**
  Don't pass `-y`/`-o` when an item would pull in files already present. After
  any `add`, run `git diff --stat src/components/ui` and restore anything that
  changed without your intent.
- **Customised UI files that must never be replaced by a registry version**
  (update this list whenever a `src/components/ui` component is hand-edited):
  - `src/components/ui/badge.tsx` — chunky 2px border, squared radius, and the
    `live`/`in-dev`/`coming-soon` status-pill variants (C11)
  - `src/components/ui/card.tsx` — chunky 2px border, squared radius
  - `src/components/ui/bento-grid.tsx` — rewritten: optional `href`/`cta` (a
    purely informational card has neither), token colors instead of
    hardcoded neutrals, `lucide-react` icon instead of `@radix-ui/react-icons`,
    dense packing (`grid-flow-row-dense`) by default
  - `src/components/ui/timeline.tsx` — rewritten: removed the hardcoded
    light/dark palette and Aceternity's own placeholder copy, `heading`/
    `subheading` are now props, grass/cyan gradient instead of purple/blue
  - `src/components/ui/dot-pattern.tsx` — token color instead of a hardcoded
    neutral; `Math.random()` replaced with a deterministic `pseudoRandom()`
    (the React Compiler's purity rule forbids impure calls during render,
    `useMemo` does not exempt it — the compute still runs in the render phase)
  - `src/components/ui/shimmer-button.tsx` — squared default `borderRadius`
    and a `--primary`-based default `background`, matching the pixel-game
    aesthetic instead of the registry's pill-shaped black default
  - `src/components/motion-primitives/spotlight.tsx` — cyan gradient instead
    of the registry's zinc/white glow (C3 spec calls for cyan specifically)
  - `src/components/motion-primitives/text-roll.tsx` — splits by grapheme
    cluster (`Intl.Segmenter`, with an `Array.from` fallback) instead of the
    registry's `.split("")`, which breaks surrogate-pair emoji into mojibake
    by splitting on UTF-16 code units
  - `src/components/ui/liquid-sculpture-hero.tsx` — a 21st.dev component
    ("Sculpture Hero" by guglielmogiannattasio.it, pasted in directly, not
    via `shadcn add`). Fixed two copy/paste-corrupted string literals
    (`headline` in `DEFAULTS` and `renderHeadline`'s `text.split(...)`) where
    a `\n` escape had been flattened into a literal line break, which is
    invalid JS. `showCredit` stays `true` — the platform's own terms require
    visible attribution to the original author for a derived component like
    this one. See `src/components/hero.tsx` for how it's wired up (a
    procedurally generated black-hole image, no stock photo or CDN asset).
    Further hand-edits for the Gargantua-style redesign: `buildParticles()`
    spawns particles with probability proportional to source alpha (no hard
    threshold) and carries that alpha into the colour texture's own alpha
    channel, read back in `PART_VS` as per-particle opacity; the particle
    draw pass blends additively (`gl.ONE, gl.ONE`) instead of over, dimmed by
    a `*0.3` factor in `PART_VS` so a denser particle count doesn't clip
    straight to white. `intro` is left `false` for this hero specifically —
    with it on, the curl-noise intro scatter's residual velocity gets frozen
    into the idle render once the engine stops simulating (a latent bug: the
    idle path stops updating `st.zw` but `streaks` keeps using whatever
    value was last there), which read as a permanent stray "flame"
    distorting the shape. A bounded "ambient orbital sway" was prototyped in
    `PART_VS` (tangential
    drift around the image centre) but measurably added ~1.3s of Lighthouse
    mobile TBT — shader-compile cost under this dev machine's software GL
    rendering — for a subtle effect, so it was pulled back out; the ambient
    drift visible at rest is `ambientField`'s existing turbulence only.
    `particleDensity` was first capped at a flat 0.8 (well below the 1.8–2 a
    brief asked for, since pushing it that high measurably cost real
    Lighthouse mobile TBT), then made adaptive instead — see
    `detectParticleDensity()` in `src/components/hero.tsx`, tiered by rough
    device capability and only read after mount (browser-only APIs). A later
    brief also switched `restStyle` from `"particles"` to `"image"`: the
    crisp generated image shows at rest, particles only where the pointer
    disturbs it. Two more small hand-edits support that redesign:
    `aspectRef`'s initial value (used before the real `<img>` has loaded) was
    changed from the registry default (1983/793) to this repo's own desktop
    source image aspect (1600/900), and a second, redundant `relayout()`
    call after `engine.setImage()` was removed — both were contributing to a
    measured, if smaller, CLS hit from `.sh-fallback` resizing after first
    paint; the `[sculptureScale, ...]` effect that gives it its first
    size/position was also changed from `useEffect` to `useLayoutEffect` for
    the same reason (run before paint, not after). See `src/components/hero.tsx`
    for all of these trade-offs in context, including the `min-h-[100svh]`
    note explaining the main CLS fix: the wrapper around
    `StaticHero`/`SculptureHero` needs a fixed height matching SculptureHero's
    own `height="100svh"`, or the swap between them (and the gap while its
    `next/dynamic(ssr:false)` chunk loads) causes a large, measured layout
    shift in everything below the hero. Also note `loadFonts={false}` there,
    paired with `headingFont`/`accentFont` pointing at `var(--font-sans)` and
    a new `var(--font-instrument-serif)` set up in `src/app/layout.tsx` via
    `next/font/google` — the component's own default (`loadFonts: true`)
    injects a runtime Google Fonts `<link>` with `display=swap`, which was a
    real, measured CLS source (the headline reflowing once the font swap
    landed); the site already loads "Geist" through `next/font` anyway, so
    this also avoids fetching it a second time. The backdrop word (`.sh-backdrop`)
    was later brought back — hardcoded to this site's own pixel font
    (`var(--font-pixel)`, ligatures off the same way `.font-pixel` does it in
    `globals.css`) and a vertical gradient-text fill instead of the
    registry's single flat colour, both specific enough to this project that
    they're just written directly into the CSS rule rather than exposed as
    more props. Also added `backdropTextMobile?: string[]`: an opt-in array
    of lines (each its own `.sh-backdrop-line`) shown instead of
    `backdropText` once the component's own `isMobile` state flips, so a
    long word (`"JORDWORLD"`) can split in two there instead of just
    shrinking to fit one line — `relayout()`'s font-size calc now sizes
    against the widest of however many lines are present, not a single
    hardcoded text source.
