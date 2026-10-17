/**
 * Procedural black-hole artwork for the classic-view hero's SculptureHero
 * background. Drawn on an offscreen <canvas> rather than shipped as a photo
 * or pulled from a CDN — nothing here is a licensed/sourced image, and the
 * seeded noise makes every visitor see the exact same artwork.
 *
 * "Gargantua" style: a thin, nearly edge-on accretion disk crossing in front
 * of a pure-black shadow, with a soft circular lensing halo showing through
 * above and below it (the bent far side of the disk) and a crisp bright
 * photon ring hugging the shadow's own edge. The desktop image lays the disk
 * out horizontally; the mobile image is the same scene with the disk
 * vertical, so it fills a portrait frame — driven automatically by whichever
 * of width/height is larger, not a separate flag.
 *
 * Transparent background (not a flat color): SculptureHero auto-detects an
 * image as a "cutout" when enough of it is transparent and keys by alpha,
 * which is cleaner than color-distance keying against a flat `imageBackground`
 * and needs no extra prop. The site's own navy (#0b1020) shows through from
 * the `background` prop passed to SculptureHero, not from this PNG.
 */

// Halo / inner-disk violets
const HALO_INNER = [196, 181, 253] as const; // #c4b5fd
const HALO_MID = [139, 92, 246] as const; // #8b5cf6
const HALO_DEEP = [109, 40, 217] as const; // #6d28d9
// Outer-disk blues fading to cool grey
const BLUE_MID = [37, 99, 235] as const; // #2563eb
const BLUE_LIGHT = [96, 165, 250] as const; // #60a5fa
const GREY_1 = [51, 65, 85] as const; // #334155
const GREY_2 = [100, 116, 139] as const; // #64748b
// Photon ring: near-white with a blue tint
const PHOTON_WHITE = [255, 255, 255] as const;
const PHOTON_TINT = [199, 210, 254] as const; // #c7d2fe
// Reserved for the optional "warm highlight" variant only — never used by
// default, and never for clouds/blobs.
const WARM = [251, 191, 36] as const; // #fbbf24

/** Mulberry32 — same tiny deterministic PRNG used elsewhere in this repo
 * (src/world/map.ts, EnterWorldIntro.tsx) for seeded-but-reproducible output. */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rgba(c: readonly [number, number, number], a: number): string {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

/** Sparse background stars — small specks, no clumps, a few brighter twinkles. */
function drawStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rand: () => number,
  count: number,
) {
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const bright = rand() > 0.92;
    const r = bright ? 0.9 + rand() * 1.1 : 0.35 + rand() * 0.6;
    const a = bright ? 0.6 + rand() * 0.35 : 0.15 + rand() * 0.35;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Soft circular lensing halo around the shadow — the bent light from the far
 * side of the disk, reading as a glow that frames the shadow above and below
 * wherever the edge-on disk band doesn't cover it. Brighter near the hole,
 * violet fading through blue to grey. */
function drawLensingHalo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
) {
  const g = ctx.createRadialGradient(cx, cy, rInner * 0.7, cx, cy, rOuter);
  g.addColorStop(0, rgba(HALO_INNER, 0));
  g.addColorStop(0.1, rgba(HALO_INNER, 0.85));
  g.addColorStop(0.32, rgba(HALO_MID, 0.5));
  g.addColorStop(0.58, rgba(BLUE_MID, 0.28));
  g.addColorStop(0.82, rgba(GREY_1, 0.12));
  g.addColorStop(1, rgba(GREY_1, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
  ctx.arc(cx, cy, rInner * 0.55, 0, Math.PI * 2, true);
  ctx.fill("evenodd");
}

/** Thin, nearly edge-on accretion disk crossing in front of the shadow, with
 * doppler beaming (one side noticeably brighter). `vertical` rotates the
 * whole band 90° for the mobile/portrait frame — same gradients, same
 * doppler side, just turned on its axis. `warmHighlight` adds a small warm
 * accent on the bright side only (variant C). */
function drawAccretionDisk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  vertical: boolean,
  warmHighlight: boolean,
) {
  const squash = 0.12; // thin, nearly edge-on

  ctx.save();
  ctx.translate(cx, cy);
  if (vertical) ctx.rotate(Math.PI / 2);
  ctx.scale(1, squash);

  const ring = ctx.createRadialGradient(0, 0, rInner * 0.8, 0, 0, rOuter);
  ring.addColorStop(0, rgba(HALO_INNER, 0.95));
  ring.addColorStop(0.16, rgba(HALO_MID, 0.85));
  ring.addColorStop(0.36, rgba(HALO_DEEP, 0.6));
  ring.addColorStop(0.6, rgba(BLUE_MID, 0.45));
  ring.addColorStop(0.82, rgba(BLUE_LIGHT, 0.25));
  ring.addColorStop(1, rgba(GREY_2, 0));
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
  ctx.arc(0, 0, rInner * 0.55, 0, Math.PI * 2, true);
  ctx.fill("evenodd");

  // Doppler beaming: the approaching side of the disk reads brighter.
  ctx.globalCompositeOperation = "lighter";
  const beamX = rOuter * 0.55;
  const beam = ctx.createRadialGradient(beamX, 0, 0, beamX, 0, rOuter * 0.9);
  beam.addColorStop(0, rgba(PHOTON_WHITE, 0.55));
  beam.addColorStop(0.45, rgba(HALO_INNER, 0.28));
  beam.addColorStop(1, rgba(HALO_INNER, 0));
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
  ctx.fill();

  if (warmHighlight) {
    const warm = ctx.createRadialGradient(
      beamX * 0.8,
      0,
      0,
      beamX * 0.8,
      0,
      rOuter * 0.4,
    );
    warm.addColorStop(0, rgba(WARM, 0.2));
    warm.addColorStop(1, rgba(WARM, 0));
    ctx.fillStyle = warm;
    ctx.beginPath();
    ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/** The sharpest element in the scene: a thin, crisp, bright ring hugging the
 * shadow directly, white at its hottest cooling to a pale blue tint, with
 * the pure-black event horizon on top. */
function drawPhotonRingAndHorizon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  const photon = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.16);
  photon.addColorStop(0, rgba(PHOTON_WHITE, 0));
  photon.addColorStop(0.4, rgba(PHOTON_WHITE, 0.98));
  photon.addColorStop(0.68, rgba(PHOTON_TINT, 0.65));
  photon.addColorStop(1, rgba(PHOTON_TINT, 0));
  ctx.fillStyle = photon;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

export interface BlackHoleImageOptions {
  width: number;
  height: number;
  /** Any integer — the same seed always produces the same artwork. */
  seed: number;
  /** Small warm accent on the disk's bright side. Off by default — the
   * palette is otherwise strictly violet/blue/grey, no amber blobs. */
  warmHighlight?: boolean;
}

/** Draws the full scene and returns a `data:image/png;base64,...` URL.
 * Must run client-side (uses the Canvas 2D API). */
export function generateBlackHoleImage({
  width,
  height,
  seed,
  warmHighlight = false,
}: BlackHoleImageOptions): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const rand = mulberry32(seed);
  const vertical = height > width;
  const cx = width * 0.5;
  const cy = height * (vertical ? 0.5 : 0.48);
  const unit = Math.min(width, height);

  // Background stays fully transparent — never filled — so the PNG keys by
  // alpha instead of a flat color.
  drawStars(ctx, width, height, rand, Math.round(unit * 0.07));

  const horizonR = unit * 0.11;
  drawLensingHalo(ctx, cx, cy, unit * 0.2, horizonR * 1.05);
  drawAccretionDisk(
    ctx,
    cx,
    cy,
    unit * 0.34,
    horizonR * 1.3,
    vertical,
    warmHighlight,
  );
  drawPhotonRingAndHorizon(ctx, cx, cy, horizonR);

  return canvas.toDataURL("image/png");
}

export const BLACK_HOLE_SEED = 1337;
