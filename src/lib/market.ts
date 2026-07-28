// Seeded RNG and geometric-random-walk price engine.
// All functions pure and deterministic given seed.

export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard-normal via Box–Muller. */
export function gauss(rand: () => number): number {
  const u = Math.max(1e-9, rand());
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** next = last * (1 + drift + vol*gauss), clamped ≥ 0.01. */
export function nextPrice(
  last: number,
  drift: number,
  volatility: number,
  seed: number,
): number {
  const rand = mulberry32(seed);
  const p = last * (1 + drift + volatility * gauss(rand));
  return Math.max(0.01, p);
}

/** Deterministic seed advance (LCG). */
export function nextSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}
