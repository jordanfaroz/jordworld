// Deterministic pseudo-random positions (a tiny LCG, not Math.random()) so the
// server-rendered and client-hydrated markup match exactly — true randomness
// here would produce a hydration mismatch on every star.
function seededStars(count: number) {
  let seed = 42;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed % 1000) / 1000;
  };
  return Array.from({ length: count }, (_, i) => ({
    key: i,
    top: `${(next() * 100).toFixed(2)}%`,
    left: `${(next() * 100).toFixed(2)}%`,
    size: next() > 0.85 ? 2 : 1,
    duration: `${(2 + next() * 3).toFixed(2)}s`,
    delay: `-${(next() * 5).toFixed(2)}s`,
  }));
}

const STARS = seededStars(60);

/** C9: hero-only star twinkle (the Dot Pattern used behind other sections is
 * static/faded, not animated). Pure CSS — no per-frame JS. */
export function StarField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {STARS.map((s) => (
        <span
          key={s.key}
          className="star-twinkle bg-foreground absolute rounded-full"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDuration: s.duration,
            animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
}
