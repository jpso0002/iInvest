// Derived market history for the asset-detail screen.
//
// Every series here is a pure function of the asset's numeric `seed` in
// assets.ts, so a reload — or a different device — produces byte-identical
// history. Nothing calls an external feed, and nothing uses Math.random.
//
// The *live* price still comes from the store's random walk; this module only
// supplies the backdrop it moves against.

import { assets, type AssetDef } from "@/content/assets";
import type { AssetId } from "@/store/schema";
import {
  buildCandles,
  buildOrderBook,
  mulberry32,
  randomWalk,
  seedWith,
  type Candle,
  type OrderBookData,
} from "@/lib/market";

export type Timeframe = "1D" | "1W" | "1M" | "1Y" | "All";

export const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M", "1Y", "All"];

export interface PriceRange {
  low: number;
  high: number;
}

export interface AssetDetailData {
  /** 24-point series for the compact row sparkline. */
  sparkline: number[];
  /** Move across the sparkline, in percent. */
  dayChangePct: number;
  ranges: Record<Timeframe, number[]>;
  range52w: PriceRange;
  range24h: PriceRange;
  candles: Candle[];
  ath: number;
  athDate: string;
  marketCap: number;
  volume24h: number;
  buySellRatio: { buyPct: number; sellPct: number };
  orderBook: OrderBookData;
}

/** Anchor for generated dates. Fixed so history never shifts under the user. */
const HISTORY_END = "2026-07-23";
const ATH_DATE = "2026-02-14";

/**
 * Per-timeframe generation. Each starts further below the current price the
 * longer it looks back, so the long ranges show the climb you'd expect, and
 * uses a slice of the asset's tick volatility scaled to that window.
 */
const RANGE_SPECS: Record<
  Timeframe,
  { from: number; steps: number; volScale: number }
> = {
  "1D": { from: 0.995, steps: 24, volScale: 0.3 },
  "1W": { from: 0.97, steps: 28, volScale: 0.5 },
  "1M": { from: 0.9, steps: 30, volScale: 0.7 },
  "1Y": { from: 0.65, steps: 52, volScale: 1 },
  All: { from: 0.35, steps: 60, volScale: 1.1 },
};

// The tick volatility in assets.ts is per-3-second-tick and far too small to
// produce a legible chart over 24 points, so history is drawn at a widened
// scale. Purely cosmetic — it never feeds back into the live price engine.
const HISTORY_VOL_SCALE = 12;

function build(def: AssetDef): AssetDetailData {
  const vol = def.volatility * HISTORY_VOL_SCALE;
  const base = def.startPrice;

  const sparkline = randomWalk(def.seed, "spark", base, 24, vol);
  const price = sparkline[sparkline.length - 1];
  const prevClose = sparkline[sparkline.length - 2];
  const dayChangePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

  const ranges = Object.fromEntries(
    TIMEFRAMES.map((tf) => {
      const spec = RANGE_SPECS[tf];
      return [
        tf,
        randomWalk(
          def.seed,
          tf,
          price * spec.from,
          spec.steps,
          vol * spec.volScale,
        ),
      ];
    }),
  ) as Record<Timeframe, number[]>;

  const yearly = ranges["1Y"];
  const range52w = { low: Math.min(...yearly), high: Math.max(...yearly) };

  const candles = buildCandles(def.seed, price * 0.92, 30, vol, HISTORY_END);
  const lastCandle = candles[candles.length - 1];
  const range24h = { low: lastCandle.low, high: lastCandle.high };

  const ath =
    Math.max(...ranges.All, ...candles.map((c) => c.high), price) * 1.08;

  const rand = mulberry32(seedWith(def.seed, "misc"));
  const buyPct = Math.round(40 + rand() * 30);

  return {
    sparkline,
    dayChangePct,
    ranges,
    range52w,
    range24h,
    candles,
    ath,
    athDate: ATH_DATE,
    marketCap: price * def.circulatingSupply,
    volume24h: price * (500_000 + rand() * 2_000_000),
    buySellRatio: { buyPct, sellPct: 100 - buyPct },
    orderBook: buildOrderBook(def.seed, price),
  };
}

// Built once at module load — the generators are deterministic, so there is
// nothing to invalidate.
const detailById: Record<AssetId, AssetDetailData> = Object.fromEntries(
  assets.map((a) => [a.id, build(a)]),
);

export const assetDetail = (id: AssetId): AssetDetailData | undefined =>
  detailById[id];
