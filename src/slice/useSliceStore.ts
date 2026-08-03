// The director — owns the whole guided session.
//
// Deliberately separate from `useAppStore` and never persisted: the slice is a
// demo, so relaunching should always restart it cleanly, and nothing here can
// corrupt real progress or force a STORAGE_VERSION bump.
//
// It also owns the *scripted* market. The production engine random-walks, which
// is fine for a sandbox but useless for a demo where a 30% crash has to land on
// a specific beat. Here, prices drift gently and the script moves them on cue.

import { create } from "zustand";
import { SCRIPT, type Beat, type Unlock } from "./script";
import { SLICE_ASSETS } from "./content";

export interface SlicePosition {
  units: number;
  avgCost: number;
}

export interface RestingOrder {
  assetId: string;
  trigger: number;
  amount: number;
  filled: boolean;
}

interface SliceState {
  beatIndex: number;
  /** Coach cards are consumed one at a time before a beat becomes interactive. */
  coachIndex: number;
  unlocks: Set<Unlock>;
  cash: number;
  positions: Record<string, SlicePosition>;
  prices: Record<string, number>;
  /** Rolling series per asset for the live chart. */
  series: Record<string, number[]>;
  order: RestingOrder | null;
  /** Set while an unlock celebration is on screen. */
  celebrating: boolean;
  lessonsDone: number;

  beat: () => Beat;
  coachLine: () => string | null;
  nextCoach: () => void;
  advance: () => void;
  restart: () => void;
  has: (u: Unlock) => boolean;

  buy: (assetId: string, amount: number) => void;
  placeLimit: (assetId: string, trigger: number, amount: number) => void;
  dismissCelebration: () => void;

  /** Called on an interval by the shell. */
  tickPrices: () => void;
  /** Scripted move, applied smoothly over `overMs`. */
  applyMove: (assetId: string, pct: number, overMs: number) => void;
}

const SERIES_LEN = 40;

const initialPrices = (): Record<string, number> =>
  Object.fromEntries(
    Object.values(SLICE_ASSETS).map((a) => [a.id, a.startPrice]),
  );

const initialSeries = (): Record<string, number[]> =>
  Object.fromEntries(
    Object.values(SLICE_ASSETS).map((a) => [
      a.id,
      // Pre-fill so the chart is never an empty box — "never wait for content".
      Array.from({ length: SERIES_LEN }, (_, i) => {
        const drift = Math.sin(i / 5) * a.startPrice * a.volatility * 2;
        return a.startPrice + drift;
      }),
    ]),
  );

/** Scripted moves in flight, applied by `tickPrices`. */
const pending: Record<string, { target: number; endAt: number }> = {};

export const useSliceStore = create<SliceState>((set, get) => ({
  beatIndex: 0,
  coachIndex: 0,
  unlocks: new Set<Unlock>(),
  // Enough to buy comfortably without the number ever being the point.
  cash: 1000,
  positions: {},
  prices: initialPrices(),
  series: initialSeries(),
  order: null,
  celebrating: false,
  lessonsDone: 0,

  beat: () => SCRIPT[get().beatIndex],
  has: (u) => get().unlocks.has(u),

  coachLine: () => {
    const b = get().beat();
    const i = get().coachIndex;
    if (!b.coach || i >= b.coach.length) return null;
    return b.coach[i];
  },

  nextCoach: () => set((s) => ({ coachIndex: s.coachIndex + 1 })),

  advance: () =>
    set((s) => {
      const next = Math.min(s.beatIndex + 1, SCRIPT.length - 1);
      const beat = SCRIPT[next];
      const unlocks = new Set(s.unlocks);
      for (const u of beat.grants ?? []) unlocks.add(u);

      // Scripted market move fires as the beat is entered.
      if (beat.marketMove) {
        const { assetId, pct, overMs } = beat.marketMove;
        const from = s.prices[assetId] ?? 0;
        pending[assetId] = {
          target: from * (1 + pct),
          endAt: Date.now() + overMs,
        };
      }
      // Guaranteed fill: aim just below the resting trigger rather than at a
      // percentage that might stop a cent short.
      if (beat.driveToFill && s.order && !s.order.filled) {
        pending[beat.driveToFill.assetId] = {
          target: s.order.trigger * 0.985,
          endAt: Date.now() + beat.driveToFill.overMs,
        };
      }

      return {
        beatIndex: next,
        coachIndex: 0,
        unlocks,
        celebrating: Boolean(beat.celebrate),
        lessonsDone:
          SCRIPT[s.beatIndex].screen === "lesson"
            ? s.lessonsDone + 1
            : s.lessonsDone,
      };
    }),

  dismissCelebration: () => set({ celebrating: false }),

  restart: () =>
    set({
      beatIndex: 0,
      coachIndex: 0,
      unlocks: new Set<Unlock>(),
      cash: 1000,
      positions: {},
      prices: initialPrices(),
      series: initialSeries(),
      order: null,
      celebrating: false,
      lessonsDone: 0,
    }),

  buy: (assetId, amount) =>
    set((s) => {
      const price = s.prices[assetId] ?? 0;
      if (price <= 0 || amount > s.cash) return {};
      const units = amount / price;
      const prev = s.positions[assetId] ?? { units: 0, avgCost: 0 };
      const total = prev.units + units;
      return {
        cash: s.cash - amount,
        positions: {
          ...s.positions,
          [assetId]: {
            units: total,
            avgCost: (prev.units * prev.avgCost + units * price) / total,
          },
        },
      };
    }),

  placeLimit: (assetId, trigger, amount) =>
    set((s) => ({
      cash: s.cash - amount,
      order: { assetId, trigger, amount, filled: false },
    })),

  applyMove: (assetId, pct, overMs) =>
    set((s) => {
      const from = s.prices[assetId] ?? 0;
      pending[assetId] = {
        target: from * (1 + pct),
        endAt: Date.now() + overMs,
      };
      return {};
    }),

  tickPrices: () =>
    set((s) => {
      const prices = { ...s.prices };
      const series = { ...s.series };
      const now = Date.now();

      for (const asset of Object.values(SLICE_ASSETS)) {
        const cur = prices[asset.id];
        let next: number;

        const move = pending[asset.id];
        if (move) {
          // Ease toward the scripted target, then stop.
          const remaining = move.endAt - now;
          if (remaining <= 0) {
            next = move.target;
            delete pending[asset.id];
          } else {
            const stepsLeft = Math.max(1, remaining / 420);
            next = cur + (move.target - cur) / stepsLeft;
          }
        } else {
          // Idle drift, scaled by the asset's own volatility so Helio visibly
          // jumps while SteadyGoods barely moves — that contrast is lesson 3.
          //
          // Mean-reverting on purpose: a free random walk wanders far from the
          // start price over a few minutes, which buries the scripted moves in
          // noise. The scripted event must always be the visible one.
          const pull = (asset.startPrice - cur) * 0.02;
          next = cur + pull + cur * (Math.random() - 0.5) * asset.volatility;
        }

        prices[asset.id] = Math.max(0.5, next);
        const arr = series[asset.id].slice(1);
        arr.push(prices[asset.id]);
        series[asset.id] = arr;
      }

      // Resting limit order fills the moment the market reaches it.
      let order = s.order;
      let positions = s.positions;
      const cash = s.cash;
      if (order && !order.filled && prices[order.assetId] <= order.trigger) {
        const units = order.amount / order.trigger;
        const prev = positions[order.assetId] ?? { units: 0, avgCost: 0 };
        const total = prev.units + units;
        positions = {
          ...positions,
          [order.assetId]: {
            units: total,
            avgCost:
              (prev.units * prev.avgCost + units * order.trigger) / total,
          },
        };
        order = { ...order, filled: true };
      }

      return { prices, series, order, positions, cash };
    }),
}));

/** Total portfolio value — cash plus every position at its live price. */
export const usePortfolioValue = (): number =>
  useSliceStore((s) => {
    let total = s.cash;
    for (const [id, p] of Object.entries(s.positions)) {
      total += p.units * (s.prices[id] ?? 0);
    }
    return total;
  });
