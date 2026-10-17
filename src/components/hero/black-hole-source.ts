/**
 * Procedural black-hole artwork for the classic-view hero's SculptureHero
 * background. Drawn on an offscreen <canvas> rather than shipped as a photo
 * or pulled from a CDN — nothing here is a licensed/sourced image, and the
 * seeded noise makes every visitor see the exact same artwork.
 *
 * Transparent background (not a flat color): SculptureHero auto-detects an
 * image as a "cutout" when enough of it is transparent and keys by alpha,
 * which is cleaner than color-distance keying against a flat `imageBackground`
 * and needs no extra prop.
 */

const PURPLE = [76, 29, 149] as const; // #4c1d95
const MAGENTA = [192, 38, 211] as const; // #c026d3
const CYAN = [34, 211, 238] as const; // #22d3ee
const AMBER = [251, 191, 36] as const; // #fbbf24 — matches the site's --amber token

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

/** Deterministic 2D value noise (seeded lattice + bilinear interpolation),
 * with a small fbm wrapper for layered "fractal" cloud detail. */
function makeNoise2D(seed: number) {
  const size = 256;
  const mask = size - 1;
  const rand = mulberry32(seed);
  const lattice = new Float32Array(size * size);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rand();

  const at = (x: number, y: number) => lattice[(y & mask) * size + (x & mask)];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

  return function noise2D(x: number, y: number): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const tx = fade(x - x0);
    const ty = fade(y - y0);
    const a = at(x0, y0);
    const b = at(x0 + 1, y0);
    const c = at(x0, y0 + 1);
    const d = at(x0 + 1, y0 + 1);
    const ab = a + (b - a) * tx;
    const cd = c + (d - c) * tx;
    return ab + (cd - ab) * ty;
  };
}

function fbm(
  noise: (x: number, y: number) => number,
  x: number,
  y: number,
  octaves: number,
): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let max = 0;
  for (let o = 0; o < octaves; o++) {
    sum += noise(x * freq, y * freq) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return sum / max;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mixColor(
  c1: readonly [number, number, number],
  c2: readonly [number, number, number],
  t: number,
) {
  return [
    lerp(c1[0], c2[0], t),
    lerp(c1[1], c2[1], t),
    lerp(c1[2], c2[2], t),
  ] as const;
}

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
    const r = 0.4 + rand() * 1.3;
    const a = 0.2 + rand() * 0.55;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Layered fractal-noise clouds in purple/magenta/cyan/amber, fading to
 * transparent at the canvas edges so the cutout reads cleanly.
 *
 * Rendered onto a small offscreen canvas (long edge ~170px) via a single
 * ImageData write, then scaled up with drawImage — not one fillRect per
 * sample point on the full-size canvas. The first version did ~40,000
 * fillRect calls with a fillStyle change each time on the real (1600x900)
 * canvas, which single-handedly blew the Lighthouse mobile performance
 * budget (7+ seconds of main-thread work — this is a one-time generation,
 * but it still has to happen before the hero is interactive). The low-res
 * pass is ~50x fewer samples, and the upscale's bilinear smoothing softens
 * the cloud edges, which reads better as diffuse gas than the old grid
 * anyway — faster and better looking. */
function drawNebula(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cx: number,
  cy: number,
  noise: (x: number, y: number) => number,
) {
  const longEdge = 170;
  const lw = w >= h ? longEdge : Math.round((longEdge * w) / h);
  const lh = w >= h ? Math.round((longEdge * h) / w) : longEdge;
  const small = document.createElement("canvas");
  small.width = lw;
  small.height = lh;
  const sctx = small.getContext("2d")!;
  const image = sctx.createImageData(lw, lh);
  const data = image.data;

  const palette = [PURPLE, MAGENTA, CYAN, AMBER, AMBER] as const; // amber weighted lightly
  const scale = 3.2 / Math.min(w, h);
  const edge = Math.min(w, h) * 0.52;
  const toFull = w / lw; // small-canvas px -> full-canvas px, for the radial/vignette falloff

  for (let ly = 0; ly < lh; ly++) {
    for (let lx = 0; lx < lw; lx++) {
      const x = lx * toFull;
      const y = ly * toFull;
      const n = fbm(noise, x * scale, y * scale, 3);
      const n2 = fbm(noise, x * scale * 2.3 + 11.7, y * scale * 2.3 + 4.2, 2);
      const density = Math.max(0, n * 0.7 + n2 * 0.3 - 0.32);

      const i = (ly * lw + lx) * 4;
      if (density <= 0) continue;

      const d = Math.hypot(x - cx, y - cy);
      const radial = 1 - Math.min(1, d / (Math.max(w, h) * 0.75));
      const vignette = Math.max(
        0,
        Math.min(1, Math.min(x, w - x, y, h - y) / (edge * 0.4)),
      );
      const alpha =
        Math.min(0.5, density * 0.9) * (0.35 + radial * 0.65) * vignette;
      if (alpha <= 0.004) continue;

      const paletteT =
        (noise(x * scale * 0.6 + 50, y * scale * 0.6 + 50) + 1) / 2;
      const idx = Math.min(
        palette.length - 1,
        Math.floor(paletteT * palette.length),
      );
      const next = palette[Math.min(palette.length - 1, idx + 1)];
      const [r, g, b] = mixColor(
        palette[idx],
        next,
        paletteT * palette.length - idx,
      );

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = alpha * 255;
    }
  }

  sctx.putImageData(image, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small, 0, 0, lw, lh, 0, 0, w, h);
}

/** Tilted elliptical accretion disk with doppler beaming (one side brighter)
 * and soft radial falloff, drawn by scaling the context so a circular
 * gradient becomes an ellipse. */
function drawAccretionDisk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  tiltRad: number,
) {
  const squash = 0.4; // vertical compression before rotation, for the ~15deg tilt look

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tiltRad);
  ctx.scale(1, squash);

  // Base ring: warm amber/orange core fading to white at the inner edge and
  // transparent past the outer edge.
  const ring = ctx.createRadialGradient(0, 0, rInner * 0.85, 0, 0, rOuter);
  ring.addColorStop(0, "rgba(255,255,255,0.95)");
  ring.addColorStop(0.15, "rgba(255,226,170,0.9)");
  ring.addColorStop(0.45, "rgba(245,158,11,0.75)");
  ring.addColorStop(0.8, "rgba(194,80,20,0.35)");
  ring.addColorStop(1, "rgba(120,40,10,0)");
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
  ctx.arc(0, 0, rInner * 0.6, 0, Math.PI * 2, true);
  ctx.fill("evenodd");

  // Doppler beaming: the side of the disk moving toward the viewer reads
  // brighter — an off-center "lighter" blend standing in for relativistic
  // beaming without actually ray-tracing it.
  ctx.globalCompositeOperation = "lighter";
  const beam = ctx.createRadialGradient(
    -rOuter * 0.55,
    0,
    0,
    -rOuter * 0.55,
    0,
    rOuter * 0.95,
  );
  beam.addColorStop(0, "rgba(255,255,255,0.55)");
  beam.addColorStop(0.5, "rgba(255,210,140,0.22)");
  beam.addColorStop(1, "rgba(255,210,140,0)");
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawEventHorizonAndPhotonRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  // Photon ring: a thin bright annulus just outside the horizon, white
  // hottest at the inner edge cooling to pale amber at the outer edge.
  const photon = ctx.createRadialGradient(cx, cy, r * 0.92, cx, cy, r * 1.22);
  photon.addColorStop(0, "rgba(255,255,255,0)");
  photon.addColorStop(0.35, "rgba(255,255,255,0.95)");
  photon.addColorStop(0.65, "rgba(255,221,170,0.55)");
  photon.addColorStop(1, "rgba(255,221,170,0)");
  ctx.fillStyle = photon;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.22, 0, Math.PI * 2);
  ctx.fill();

  // Pure-black event horizon on top, slightly smaller than the photon ring's
  // inner edge so the ring reads as a visible rim around it.
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
}

/** Draws the full scene and returns a `data:image/png;base64,...` URL.
 * Must run client-side (uses the Canvas 2D API). */
export function generateBlackHoleImage({
  width,
  height,
  seed,
}: BlackHoleImageOptions): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const rand = mulberry32(seed);
  const noise = makeNoise2D(seed + 1);

  const cx = width * 0.5;
  const cy = height * 0.48;
  const unit = Math.min(width, height);

  // Background stays fully transparent — never filled — so the PNG keys by
  // alpha instead of a flat color.
  drawStars(ctx, width, height, rand, Math.round(unit * 0.35));
  drawNebula(ctx, width, height, cx, cy, noise);
  // A second, denser star pass on top of the nebula reads as foreground dust.
  drawStars(ctx, width, height, rand, Math.round(unit * 0.12));

  const rOuter = unit * 0.3;
  const rInner = unit * 0.1;
  drawAccretionDisk(ctx, cx, cy, rOuter, rInner, (15 * Math.PI) / 180);
  drawEventHorizonAndPhotonRing(ctx, cx, cy, unit * 0.09);

  return canvas.toDataURL("image/png");
}

export const BLACK_HOLE_SEED = 1337;
