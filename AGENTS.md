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
