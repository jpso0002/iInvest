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

// -------- Deterministic history generators --------
// Everything below is a pure function of an asset's numeric `seed`, so the
// generated history is identical on every reload and across devices. Nothing
// here touches Math.random or an external feed.

/** Fold a label into a seed so each series off one asset gets its own stream. */
export function seedWith(seed: number, label: string): number {
  let h = seed | 0;
  for (let i = 0; i < label.length; i++) {
    h = (Math.imul(31, h) + label.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

/**
 * Drifting random walk of `steps` points starting at `basePrice`.
 * The 0.48 offset gives a very slight upward bias, so long ranges trend up the
 * way a broad market chart does rather than wandering flat.
 */
export function randomWalk(
  seed: number,
  label: string,
  basePrice: number,
  steps: number,
  volatility: number,
): number[] {
  const rand = mulberry32(seedWith(seed, label));
  const points: number[] = [basePrice];
  let price = basePrice;
  for (let i = 1; i < steps; i++) {
    const change = (rand() - 0.48) * volatility * price;
    price = Math.max(price * 0.15, price + change);
    points.push(price);
  }
  return points;
}

export interface Candle {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
}

/** `count` daily OHLC candles ending on `endDate`. */
export function buildCandles(
  seed: number,
  basePrice: number,
  count: number,
  volatility: number,
  endDate: string,
): Candle[] {
  const rand = mulberry32(seedWith(seed, "candles"));
  const candles: Candle[] = [];
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  let price = basePrice;
  for (let i = count - 1; i >= 0; i--) {
    const open = price;
    const change = (rand() - 0.48) * volatility * price;
    const close = Math.max(open * 0.2, open + change);
    candles.push({
      date: new Date(end - i * dayMs).toISOString().slice(0, 10),
      open,
      high: Math.max(open, close) * (1 + rand() * volatility * 0.5),
      low: Math.min(open, close) * (1 - rand() * volatility * 0.5),
      close,
    });
    price = close;
  }
  return candles;
}

export interface OrderBookEntry {
  price: number;
  qty: number;
}

export interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

/** Symmetric ladder of bids/asks around `price`, deepest at the far end. */
export function buildOrderBook(
  seed: number,
  price: number,
  depth = 6,
): OrderBookData {
  const rand = mulberry32(seedWith(seed, "book"));
  const tick = price * 0.0015;
  const side = (dir: 1 | -1): OrderBookEntry[] =>
    Array.from({ length: depth }, (_, i) => ({
      price: price + dir * tick * (i + 1),
      qty: Math.round((rand() * 800 + 40) * (depth - i)) / 10,
    }));
  // Bids first so both ladders draw from the stream in a stable order.
  const bids = side(-1);
  const asks = side(1);
  return { bids, asks };
}
