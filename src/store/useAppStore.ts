import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from "zustand/middleware";
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  initialAppState,
  type AppState,
  type AssetId,
  type Holding,
  type LessonId,
  type LessonProgress,
  type UnitNumber,
  type Trade,
  type UserState,
} from "./schema";
import { lessonById } from "@/content/lessons";
import { assets } from "@/content/assets";
import { bumpStreak, isUnitUp, unitForCompleted } from "@/lib/xp";
import { canUseFractional } from "@/lib/guards";
import { nextPrice, nextSeed } from "@/lib/market";
import { currentWeekId } from "@/lib/league";
import {
  buyExecutionPrice,
  feeFor,
  FEE_RATE,
  type OrderType,
} from "@/lib/trading";
import { pcMoney } from "@/lib/format";

// -------- Storage with graceful fallbacks --------

const memoryBackedStorage = (): StateStorage => {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
};

const safeStorage = (): StateStorage => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return memoryBackedStorage();
    }
    const probe = "__iinvest_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return memoryBackedStorage();
  }
};

// -------- Store --------

export interface CompleteLessonResult {
  xpGained: number;
  cashGained: number;
  unitUp: boolean;
  bonus: number;
  newUnit: UnitNumber;
}

/** What a buy actually filled at — feeds the purchase-confirmation screen. */
export interface BuyExecution {
  assetId: AssetId;
  units: number;
  execPrice: number;
  fee: number;
  /** Cash actually debited. Below the requested amount when units were snapped
   * to whole numbers; the difference is change. */
  spent: number;
  newTotalUnits: number;
  newAvgCost: number;
}

export interface TradeResult {
  ok: boolean;
  reason?: string;
  execution?: BuyExecution;
}

export interface BuyOptions {
  orderType?: OrderType;
  limitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface AppActions {
  setUser: (patch: Partial<UserState>) => void;
  completeOnboarding: (placementUnit: UnitNumber) => void;
  setLessonProgress: (progress: LessonProgress | undefined) => void;
  completeLesson: (lessonId: LessonId) => CompleteLessonResult | null;
  initMarket: () => void;
  tick: () => void;
  /** Sell a share count. Proceeds are credited net of the transaction fee. */
  sell: (assetId: AssetId, units: number) => TradeResult;
  /** Buy with a pc$ amount — the amount is what leaves your cash, and the fee
   * comes out of it before shares are priced. */
  buyWithAmount: (
    assetId: AssetId,
    amount: number,
    opts?: BuyOptions,
  ) => TradeResult;
  resetAll: () => void;
  consumeLessonCompleteAnimation: () => void;
  rolloverWeekIfNeeded: () => void;
}

export interface PendingLessonComplete {
  lessonId: LessonId;
  unitUp: boolean;
  newUnit: UnitNumber;
}

/** Session-only UI signals — never persisted (see `partialize` below). */
export interface TransientState {
  /** Set by every real lesson completion; consumed once `/lessons` has played its reveal animation. */
  pendingLessonComplete: PendingLessonComplete | null;
}

export type AppStore = AppState & TransientState & AppActions;

const genId = (): string => {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialAppState(),
      pendingLessonComplete: null,

      setUser: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),

      completeOnboarding: (placementUnit) =>
        set((s) => ({
          user: {
            ...s.user,
            onboarded: true,
            placementUnit,
            cash: 1000,
          },
        })),

      setLessonProgress: (progress) =>
        set((s) => ({ user: { ...s.user, lessonProgress: progress } })),

      completeLesson: (lessonId) => {
        const lesson = lessonById(lessonId);
        if (!lesson) return null;
        const state = get();
        if (state.user.completedLessons.includes(lessonId)) {
          return {
            xpGained: 0,
            cashGained: 0,
            unitUp: false,
            bonus: 0,
            newUnit: unitForCompleted(state.user.completedLessons),
          };
        }
        const before = state.user.completedLessons;
        const after = [...before, lessonId];
        const unitUp = isUnitUp(before, after);
        const bonus = unitUp ? 2000 : 0;
        const newUnit = unitForCompleted(after);
        const xpGained = lesson.reward.xp;
        const cashGained = lesson.reward.cash + bonus;
        set((s) => {
          const wk = currentWeekId();
          const weeklyBase = s.user.weekId === wk ? s.user.weeklyXp : 0;
          return {
            user: {
              ...s.user,
              completedLessons: [...s.user.completedLessons, lessonId],
              xp: s.user.xp + xpGained,
              weekId: wk,
              weeklyXp: weeklyBase + xpGained,
              cash: s.user.cash + cashGained,
              streak: bumpStreak(s.user.streak),
              lessonProgress: undefined,
            },
            pendingLessonComplete: { lessonId, unitUp, newUnit },
          };
        });
        return { xpGained, cashGained, unitUp, bonus, newUnit };
      },

      initMarket: () =>
        set((s) => {
          const now = Date.now();
          const map = { ...s.market.assets };
          let changed = false;
          for (const a of assets) {
            if (!map[a.id]) {
              map[a.id] = {
                last: { price: a.startPrice, at: now },
                seed: a.seed,
              };
              changed = true;
            }
          }
          if (!changed) return {} as Partial<AppStore>;
          return { market: { ...s.market, assets: map } };
        }),

      tick: () =>
        set((s) => {
          const now = Date.now();
          const newAssets = { ...s.market.assets };
          for (const a of assets) {
            const cur = newAssets[a.id] ?? {
              last: { price: a.startPrice, at: now },
              seed: a.seed,
            };
            const seed = nextSeed(cur.seed);
            const price = nextPrice(
              cur.last.price,
              a.drift,
              a.volatility,
              seed,
            );
            newAssets[a.id] = { last: { price, at: now }, seed };
          }
          let total = s.user.cash;
          for (const [id, h] of Object.entries(s.portfolio.holdings)) {
            const price = newAssets[id]?.last.price ?? 0;
            total += h.units * price;
          }
          const prev = s.market.sessionSeries ?? [];
          const sessionSeries = [...prev, { at: now, total }].slice(-120);
          return { market: { assets: newAssets, sessionSeries } };
        }),

      sell: (assetId, unitsRaw) => {
        const state = get();
        const def = assets.find((a) => a.id === assetId);
        if (!def) return { ok: false, reason: "Unknown asset" };
        const unit = unitForCompleted(state.user.completedLessons);
        if (def.unlockAfterUnit > unit) return { ok: false, reason: "Locked" };

        const units = Number(unitsRaw);
        if (!Number.isFinite(units) || units <= 0) {
          return { ok: false, reason: "Enter units above 0" };
        }
        const holding = state.portfolio.holdings[assetId];
        if (!holding || holding.units + 1e-9 < units) {
          return { ok: false, reason: "Not enough units" };
        }

        // Sells fill at the quoted price — slippage is applied on the buy side
        // only, matching how the invest sheet presents it.
        const price =
          state.market.assets[assetId]?.last.price ?? def.startPrice;
        const gross = units * price;
        const fee = feeFor(gross);

        set((s) => {
          const h: Holding = s.portfolio.holdings[assetId] ?? {
            units: 0,
            avgCost: 0,
          };
          const remaining = h.units - units;
          const holdings = { ...s.portfolio.holdings };
          if (remaining <= 1e-7) {
            delete holdings[assetId];
          } else {
            holdings[assetId] = { units: remaining, avgCost: h.avgCost };
          }
          const trade: Trade = {
            id: genId(),
            assetId,
            side: "sell",
            units,
            price,
            fee,
            at: new Date().toISOString(),
          };
          return {
            user: {
              ...s.user,
              cash: s.user.cash + gross - fee,
              streak: bumpStreak(s.user.streak),
            },
            portfolio: {
              holdings,
              history: [trade, ...s.portfolio.history].slice(0, 200),
            },
          };
        });
        return { ok: true };
      },

      buyWithAmount: (assetId, amountRaw, opts) => {
        const state = get();
        const def = assets.find((a) => a.id === assetId);
        if (!def) return { ok: false, reason: "Unknown asset" };
        const unit = unitForCompleted(state.user.completedLessons);
        if (def.unlockAfterUnit > unit) return { ok: false, reason: "Locked" };

        const amount = Number(amountRaw);
        if (!Number.isFinite(amount) || amount <= 0) {
          return { ok: false, reason: "Enter an amount above 0" };
        }
        if (amount > state.user.cash)
          return { ok: false, reason: "Insufficient cash" };

        const quoted =
          state.market.assets[assetId]?.last.price ?? def.startPrice;
        const orderType: OrderType = opts?.orderType ?? "market";
        const limit = opts?.limitPrice;
        // A limit order fills at the price you named; a market order takes
        // whatever the book gives you, which is never better than quoted.
        const execPrice =
          orderType === "limit" &&
          Number.isFinite(limit) &&
          (limit as number) > 0
            ? (limit as number)
            : buyExecutionPrice(quoted);

        const fee = feeFor(amount);
        const invested = amount - fee;
        const rawUnits = invested / execPrice;

        // Below unit 3 the learner hasn't met fractional shares yet, so the
        // amount buys whole units and the remainder is returned as change.
        const fractional = canUseFractional(unit);
        const units = fractional ? rawUnits : Math.floor(rawUnits);
        if (units <= 0) {
          return {
            ok: false,
            reason: `Not enough for one whole unit — you need ${pcMoney(execPrice / (1 - FEE_RATE))}`,
          };
        }

        const gross = units * execPrice;
        const spent = gross + fee;

        const prev: Holding = state.portfolio.holdings[assetId] ?? {
          units: 0,
          avgCost: 0,
        };
        const newTotalUnits = prev.units + units;
        const newAvgCost =
          newTotalUnits > 0
            ? (prev.units * prev.avgCost + units * execPrice) / newTotalUnits
            : 0;

        set((s) => {
          const trade: Trade = {
            id: genId(),
            assetId,
            side: "buy",
            units,
            price: execPrice,
            fee,
            at: new Date().toISOString(),
            orderType,
            ...(opts?.stopLoss ? { stopLoss: opts.stopLoss } : {}),
            ...(opts?.takeProfit ? { takeProfit: opts.takeProfit } : {}),
          };
          return {
            user: {
              ...s.user,
              cash: s.user.cash - spent,
              streak: bumpStreak(s.user.streak),
            },
            portfolio: {
              holdings: {
                ...s.portfolio.holdings,
                [assetId]: { units: newTotalUnits, avgCost: newAvgCost },
              },
              history: [trade, ...s.portfolio.history].slice(0, 200),
            },
          };
        });

        return {
          ok: true,
          execution: {
            assetId,
            units,
            execPrice,
            fee,
            spent,
            newTotalUnits,
            newAvgCost,
          },
        };
      },

      resetAll: () =>
        set(() => ({ ...initialAppState(), pendingLessonComplete: null })),

      consumeLessonCompleteAnimation: () =>
        set({ pendingLessonComplete: null }),

      rolloverWeekIfNeeded: () =>
        set((s) => {
          const wk = currentWeekId();
          if (s.user.weekId === wk) return {};
          return { user: { ...s.user, weekId: wk, weeklyXp: 0 } };
        }),
    }),

    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => safeStorage()),
      partialize: (state) =>
        ({
          version: state.version,
          user: state.user,
          portfolio: state.portfolio,
          market: {
            assets: state.market.assets,
            // sessionSeries intentionally omitted
          },
        }) as unknown as AppStore,
      migrate: (_persisted, version) => {
        if (version !== STORAGE_VERSION) return initialAppState();
        return _persisted as AppState;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          try {
            if (typeof window !== "undefined") {
              window.localStorage.removeItem(STORAGE_KEY);
            }
          } catch {
            /* noop */
          }
          useAppStore.setState(initialAppState());
        } else if (state) {
          state.market.sessionSeries = [];
        }
      },
    },
  ),
);
