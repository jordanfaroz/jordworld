# Jord World

Jordan Faroz's personal site, deployed at [jordworld.com](https://jordworld.com).

## Vision

Two ways to see the same content:

- **`/`** — an explorable voxel overworld. Walk around an island; regions hold
  projects (The Lab), hobby projects (The Arcade), tools (The Workshop), and
  hobbies (Off-World Park).
- **`/classic`** — a fast, accessible, conventional portfolio page for
  recruiters, SEO, slow phones, and screen readers.

Both views read from the same source of truth in `src/content/` — the world
and the classic view never duplicate project/profile data, they only render it
differently.

## Folder structure

```
src/
├── app/              # Routes, layout, metadata, sitemap/robots
├── components/
│   ├── ui/           # shadcn/ui primitives — see AGENTS.md before editing these
│   └── classic/       # Classic portfolio view components (Phase 1)
├── content/           # Single source of truth: projects, profile, hobbies, timeline, regions
├── lib/               # Shared utilities
└── world/             # Explorable voxel world, react-three-fiber (Phase 2)
```

## Phase roadmap

- **Phase 0** — project setup: Next.js, TypeScript, Tailwind v4, and
  shadcn/ui, plus fonts/tokens, folder scaffolding, and tooling.
- **Phase 1** — content model (`src/content/`) + the classic portfolio view,
  rendered at both `/` and `/classic` until Phase 2 builds the world.
- **Phase 2** — the voxel world: island, camera, movement, content-driven
  region/project placement.
- **Phase 3** — HUD, panels, and the "Enter World" intro.

## UI libraries

Beyond shadcn/ui (MIT): [motion-primitives](https://motion-primitives.com)
(TextRoll, Tilt, Spotlight — MIT), [Aceternity UI](https://ui.aceternity.com)
(Timeline — free component, not one of their paid blocks), and
[Magic UI](https://magicui.design) (Bento Grid, Dot Pattern, Shimmer Button —
MIT). Several of these were restyled after install to match our tokens —
see the "Customised UI files" list in `AGENTS.md` before overwriting one via
`shadcn add`.

## Visual identity

"Voxel world + pixel-game UI": chunky borders, slightly squared radii, dark
night-sky palette. Dark mode only — there is no light theme.

- **Pixelify Sans** (`font-heading` / `.font-pixel`) — headings only.
  Ligatures are disabled (see the comment in `globals.css`): its "fi" glyph
  otherwise renders as a single blob that makes "fintech" read as "Antech".
- **Geist** (`font-sans`) — body text.
- **Geist Mono** (`font-mono`) — labels and code.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run lint          # ESLint
npm run format        # Prettier, writes changes
npm run format:check  # Prettier, check only (CI-safe)
npm run build          # Production build
```
