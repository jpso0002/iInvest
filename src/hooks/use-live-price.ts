import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

/** Points kept in the rolling window. */
const WINDOW = 44;
const TICK_MS = 1000;
/** How hard each tick is pulled back toward the store price. */
const PULL = 0.6;

export interface LivePrice {
  price: number;
  series: number[];
  changePct: number;
}

/**
 * A per-second chart for the asset-detail hero.
 *
 * The store only ticks every 3 seconds, which makes for a visibly stepped
 * chart, so this fills in the gaps. The wobble is mean-reverting: each point is
 * pulled back toward the store price, so the line moves without ever drifting
 * away from reality. That matters — the price shown in the hero has to be the
 * price the trade sheets quote and the store executes at, so `price` is the
 * store's value verbatim and only the *series* is embellished.
 *
 * Under `prefers-reduced-motion` the ticking stops and the series settles to
 * the asset's generated history.
 */
export function useLivePrice(
  assetId: string | undefined,
  storePrice: number,
  volatility: number,
  history: number[],
): LivePrice {
  const reduced = usePrefersReducedMotion();

  // Historical shape, rescaled to end exactly at the current price so the
  // seeded tail joins the live points without a visible step.
  const seed = (() => {
    if (!history.length) return [storePrice];
    const tail = history.slice(-WINDOW);
    const last = tail[tail.length - 1];
    if (!last) return [storePrice];
    const scale = storePrice / last;
    return tail.map((v) => v * scale);
  })();

  const [series, setSeries] = useState<number[]>(seed);
  const priceRef = useRef(storePrice);
  const storeRef = useRef(storePrice);
  storeRef.current = storePrice;

  // Re-anchor when the viewed asset changes.
  useEffect(() => {
    priceRef.current = storePrice;
    setSeries(seed);
    // Keyed on the asset alone — re-seeding on every store tick would erase
    // the rolling window three times a second.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId]);

  useEffect(() => {
    if (!assetId || reduced) return undefined;
    const id = window.setInterval(() => {
      const anchor = storeRef.current;
      const drift = (priceRef.current - anchor) * PULL;
      const noise = (Math.random() - 0.5) * volatility * anchor;
      const next = Math.max(anchor * 0.5, anchor + drift + noise);
      priceRef.current = next;
      setSeries((prev) => {
        const arr = prev.length >= WINDOW ? prev.slice(1) : prev.slice();
        arr.push(next);
        return arr;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [assetId, volatility, reduced]);

  const effectiveSeries = reduced ? seed : series;
  const open = effectiveSeries[0] ?? storePrice;
  const changePct = open ? ((storePrice - open) / open) * 100 : 0;

  return { price: storePrice, series: effectiveSeries, changePct };
}
