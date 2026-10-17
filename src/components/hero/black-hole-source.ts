/**
 * Procedural black-hole artwork for the classic-view hero's SculptureHero
 * background. Drawn on an offscreen <canvas> rather than shipped as a photo
 * or pulled from a CDN — nothing here is a licensed/sourced image, and the
 * seeded noise makes every visitor see the exact same artwork.
 *
 * "Gargantua" style, matching a purple reference render closely:
 *   - a thin, nearly edge-on outer disk running the full width (or height,
 *     on the mobile/portrait variant), purple near the hole fading to
 *     blue/teal and dark grey at the tips, with fine fibrous streaks
 *   - a thick lensed halo (the bent far side of the disk) arcing over the
 *     top and under the bottom of the shadow
 *   - a crisp, bright magenta-violet photon ring hugging the shadow itself
 *   - the disk's near edge redrawn on top, clipped to the shadow's lower
 *     half, so it visibly crosses in front of (occludes) the bottom of the
 *     shadow rather than just disappearing behind it
 *   - the whole system tilted ~10°, descending left-to-right
 * The desktop image lays the disk out horizontally; the mobile image is the
 * same scene with the disk vertical, so it fills a portrait frame — driven
 * automatically by whichever of width/height is larger, not a separate flag.
 *
 * Transparent background (not a flat color): SculptureHero auto-detects an
 * image as a "cutout" when enough of it is transparent and keys by alpha,
 * which is cleaner than color-distance keying against a flat `imageBackground`
 * and needs no extra prop. The site's own navy (#0b1020) shows through from
 * the `darkBackground` prop passed to SculptureHero, not from this PNG.
 */

// Halo: purple core, lavender highlight
const HALO_LAVENDER = [196, 181, 253] as const; // #c4b5fd
const HALO_PURPLE = [109, 40, 217] as const; // #6d28d9
// Disk: purple near the hole, fading to blue/teal, dark grey at the tips
const DISK_PURPLE = [139, 92, 246] as const; // #8b5cf6
const DISK_BLUE_DEEP = [30, 58, 138] as const; // #1e3a8a
const DISK_TEAL = [14, 116, 144] as const; // #0e7490
const DISK_BLUE_LIGHT = [96, 165, 250] as const; // #60a5fa
const DISK_GREY = [51, 65, 85] as const; // #334155
// Photon ring: thin, bright, magenta-violet
const PHOTON_HOT = [255, 255, 255] as const;
const PHOTON_MAGENTA = [232, 121, 249] as const; // #e879f9

const TILT_RAD = (10 * Math.PI) / 180;

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

/** Thick halo around the shadow — the far side of the disk, bent into view
 * by lensing. Stretched into an upright oval (taller than wide) rather than
 * a perfect circle, so it reads as a thick band arcing specifically over
 * the top and under the bottom of the shadow, not a uniform ring — on top
 * of that, the disk itself (drawn after) covers most of its left/right
 * extent anyway. Purple core with a bright lavender inner highlight, soft
 * at the outer edge. */
function drawLensedHalo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(0.86, 1.18);
  const g = ctx.createRadialGradient(0, 0, rInner * 0.65, 0, 0, rOuter);
  g.addColorStop(0, rgba(HALO_LAVENDER, 0));
  g.addColorStop(0.1, rgba(HALO_LAVENDER, 0.95));
  g.addColorStop(0.3, rgba(HALO_LAVENDER, 0.7));
  g.addColorStop(0.55, rgba(HALO_PURPLE, 0.5));
  g.addColorStop(0.82, rgba(HALO_PURPLE, 0.16));
  g.addColorStop(1, rgba(HALO_PURPLE, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
  ctx.arc(0, 0, rInner * 0.5, 0, Math.PI * 2, true);
  ctx.fill("evenodd");
  ctx.restore();
}

/** The long, thin, nearly edge-on outer disk, drawn in the disk's own local
 * (rotated, squashed) coordinate system — purple near the hole fading to
 * blue/teal and dark grey at the tips, doppler-brightened on the approaching
 * side, with a handful of soft fibrous streaks along its length. Blurred
 * for smooth gradients rather than a hard-edged shape. */
function drawDiskLocal(
  ctx: CanvasRenderingContext2D,
  rOuter: number,
  rInner: number,
  rand: () => number,
) {
  const base = ctx.createRadialGradient(0, 0, rInner * 0.8, 0, 0, rOuter);
  base.addColorStop(0, rgba(DISK_PURPLE, 0.95));
  base.addColorStop(0.3, rgba(DISK_PURPLE, 0.85));
  base.addColorStop(0.52, rgba(DISK_BLUE_DEEP, 0.62));
  base.addColorStop(0.72, rgba(DISK_TEAL, 0.44));
  base.addColorStop(0.9, rgba(DISK_BLUE_LIGHT, 0.26));
  base.addColorStop(1, rgba(DISK_GREY, 0));
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
  ctx.arc(0, 0, rInner * 0.55, 0, Math.PI * 2, true);
  ctx.fill("evenodd");

  // Doppler beaming: the approaching side reads brighter, near-white at its
  // core, fading smoothly — the receding side (not touched here) stays the
  // cooler blue/teal of the base gradient above.
  ctx.globalCompositeOperation = "lighter";
  const beamX = rOuter * 0.42;
  const beam = ctx.createRadialGradient(beamX, 0, 0, beamX, 0, rOuter * 0.78);
  beam.addColorStop(0, rgba(PHOTON_HOT, 0.75));
  beam.addColorStop(0.35, rgba(PHOTON_MAGENTA, 0.45));
  beam.addColorStop(1, rgba(PHOTON_MAGENTA, 0));
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  // Fine fibrous streaks along the disk's length — thin, low-opacity curved
  // strokes rather than a noise field, so the result stays smooth, not grainy.
  const streakPalette = [
    DISK_PURPLE,
    DISK_BLUE_DEEP,
    DISK_TEAL,
    DISK_BLUE_LIGHT,
  ] as const;
  ctx.lineCap = "round";
  for (let i = 0; i < 10; i++) {
    const yOff = (rand() - 0.5) * rOuter * 0.5;
    const xStart = -rOuter * (0.7 + rand() * 0.3);
    const xEnd = rOuter * (0.7 + rand() * 0.3);
    const bow = (rand() - 0.5) * rOuter * 0.12;
    const color = streakPalette[Math.floor(rand() * streakPalette.length)];
    ctx.strokeStyle = rgba(color, 0.12 + rand() * 0.16);
    ctx.lineWidth = rOuter * (0.015 + rand() * 0.02);
    ctx.beginPath();
    ctx.moveTo(xStart, yOff);
    ctx.quadraticCurveTo(0, yOff + bow, xEnd, yOff);
    ctx.stroke();
  }
}

/** Draws the outer disk tilted and squashed into an edge-on band. `vertical`
 * adds a 90° base rotation for the mobile/portrait frame; the ~10° tilt is
 * layered on top either way, so the disk always reads as descending
 * left-to-right like the reference. */
function drawOuterDisk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  vertical: boolean,
  rand: () => number,
  squash = 0.1,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((vertical ? Math.PI / 2 : 0) + TILT_RAD);
  ctx.scale(1, squash);
  drawDiskLocal(ctx, rOuter, rInner, rand);
  ctx.restore();
}

/** Redraws the disk's near edge on top of everything, clipped to the lower
 * half of the shadow's own circle, so it visibly crosses in front of
 * (occludes) the bottom of the shadow instead of just stopping at its edge —
 * the far side is what the lensed halo above represents instead. Noticeably
 * thicker (bigger squash) and brighter than the outer disk: this is the
 * near, hottest part of the material, close enough to fill most of the
 * shadow's lower half rather than a thin sliver through it. */
function drawFrontDiskSlice(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  vertical: boolean,
  shadowR: number,
  rand: () => number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, shadowR * 1.02, 0, Math.PI * 2);
  ctx.clip();
  // The occlusion boundary follows the disk's own tilt (and its 90° base
  // rotation on the vertical/mobile frame), not a plain horizontal line —
  // the near/far transition should run along the disk's own plane. The clip
  // and the disk draw both need to happen inside this same rotated frame
  // (an inner save/restore around just the clip would undo it again before
  // the draw), so this calls drawDiskLocal directly instead of going
  // through drawOuterDisk, which would re-apply its own translate/rotate.
  ctx.translate(cx, cy);
  ctx.rotate((vertical ? Math.PI / 2 : 0) + TILT_RAD);
  ctx.beginPath();
  ctx.rect(-shadowR * 2 - 4, 0, shadowR * 4 + 8, shadowR * 2 + 4);
  ctx.clip();
  ctx.scale(1, 0.3);
  ctx.globalAlpha = 0.92;
  // rInner=0, not the real disk inner radius: at this much bigger squash the
  // annulus's inner cutout would open up into a visible gap/hole through
  // the middle of the band instead of staying hidden the way it does on the
  // thin outer disk.
  drawDiskLocal(ctx, rOuter * 0.85, 0, rand);
  ctx.restore();
}

/** The sharpest element in the scene: a thin, crisp, bright magenta-violet
 * ring hugging the shadow directly, with the pure-black event horizon on
 * top. */
function drawPhotonRingAndHorizon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  const photon = ctx.createRadialGradient(cx, cy, r * 0.88, cx, cy, r * 1.18);
  photon.addColorStop(0, rgba(PHOTON_HOT, 0));
  photon.addColorStop(0.38, rgba(PHOTON_HOT, 0.95));
  photon.addColorStop(0.6, rgba(PHOTON_MAGENTA, 0.85));
  photon.addColorStop(0.85, rgba(PHOTON_MAGENTA, 0.35));
  photon.addColorStop(1, rgba(PHOTON_MAGENTA, 0));
  ctx.fillStyle = photon;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.18, 0, Math.PI * 2);
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
  /** Shadow radius as a fraction of min(width, height). The caller works
   * this out from how big SculptureHero actually renders the image (via
   * `sculptureScale`/`mobileSculptureScale`) so the shadow lands at a
   * specific fraction of the hero's own height on screen — that on-screen
   * target doesn't translate to one fixed fraction of the source image,
   * since the desktop and mobile images end up displayed at different
   * scale factors. Defaults to the proportions this was designed at. */
  shadowRadiusFraction?: number;
}

/** Draws the full scene and returns a `data:image/png;base64,...` URL.
 * Must run client-side (uses the Canvas 2D API and `filter: blur()`). */
export function generateBlackHoleImage({
  width,
  height,
  seed,
  shadowRadiusFraction = 0.11,
}: BlackHoleImageOptions): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const rand = mulberry32(seed);
  const vertical = height > width;
  const cx = width * 0.5;
  const cy = height * 0.5;
  const unit = Math.min(width, height);

  // Background stays fully transparent — never filled — so the PNG keys by
  // alpha instead of a flat color.
  drawStars(ctx, width, height, rand, Math.round(unit * 0.06));

  const horizonR = unit * shadowRadiusFraction;
  const diskOuter = unit * 0.54;
  const diskInner = horizonR * 1.25;
  // Relative to horizonR, not a fixed unit fraction, so the halo band stays
  // proportionally the same thickness regardless of shadowRadiusFraction.
  const haloOuter = horizonR * 1.7;

  // A light blur softens every gradient shape drawn after it's applied —
  // smooth bands rather than hard-edged or stippled shapes.
  ctx.filter = `blur(${Math.max(1, unit * 0.003)}px)`;
  drawLensedHalo(ctx, cx, cy, haloOuter, horizonR * 1.05);
  drawOuterDisk(ctx, cx, cy, diskOuter, diskInner, vertical, rand);
  ctx.filter = "none";

  drawPhotonRingAndHorizon(ctx, cx, cy, horizonR);
  drawFrontDiskSlice(
    ctx,
    cx,
    cy,
    diskOuter,
    diskInner,
    vertical,
    horizonR,
    rand,
  );

  // A second, sparser star pass on top reads as foreground dust.
  drawStars(ctx, width, height, rand, Math.round(unit * 0.015));

  return canvas.toDataURL("image/png");
}

export const BLACK_HOLE_SEED = 1337;
