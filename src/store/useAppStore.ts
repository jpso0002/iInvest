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
  type OrderKind,
  type RestingOrder,
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
  fillPrice,
  shouldFill,
  FEE_RATE,
  MAX_OPEN_ORDERS_PER_ASSET,
  MAX_TARGET_FRACTION,
  MIN_LIMIT_FRACTION,
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
  /** Non-fatal problems — e.g. a protection order that couldn't be placed. */
  warnings?: string[];
}

export interface BuyOptions {
  /** Placed as resting orders against the position this buy opens. A buy that
   * fills but whose protections are rejected still succeeds — the rejections
   * come back in `warnings` rather than unwinding the trade. */
  stopLoss?: number;
  takeProfit?: number;
}

/** A resting order that fired on a tick, for the toast queue. */
export interface OrderFill {
  id: string;
  assetId: AssetId;
  kind: OrderKind;
  units: number;
  price: number;
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
  /** Place an order that waits for a price. Cash for a limit buy is reserved
   * immediately so it can't be spent twice. */
  placeOrder: (
    assetId: AssetId,
    kind: OrderKind,
    trigger: number,
    size: number,
  ) => TradeResult;
  /** Cancel an open order, refunding any reserved cash. */
  cancelOrder: (orderId: string) => void;
  consumeOrderFills: () => OrderFill[];
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
  /** Orders that fired on the last tick, waiting to be toasted. */
  pendingOrderFills: OrderFill[];
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
      pendingOrderFills: [],

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

          // --- Resting orders, evaluated against the prices just computed ---
          // Runs before portfolio value is totalled so a fill is reflected in
          // the same tick's equity point rather than lagging one behind.
          const holdings = { ...s.portfolio.holdings };
          const stillOpen: RestingOrder[] = [];
          const fills: OrderFill[] = [];
          const trades: Trade[] = [];
          let cash = s.user.cash;
          const fractional = canUseFractional(
            unitForCompleted(s.user.completedLessons),
          );

          for (const order of s.portfolio.orders ?? []) {
            const price = newAssets[order.assetId]?.last.price;
            if (
              price == null ||
              !shouldFill(order.kind, order.trigger, price)
            ) {
              stillOpen.push(order);
              continue;
            }
            const exec = fillPrice(order.kind, order.trigger, price);
            const held = holdings[order.assetId];

            if (order.kind === "limit-buy") {
              // `order.size` was reserved from cash at placement, so nothing is
              // debited here — only the unspent change is handed back.
              const fee = feeFor(order.size);
              const raw = (order.size - fee) / exec;
              const units = fractional ? raw : Math.floor(raw);
              if (units <= 0) {
                cash += order.size; // can't fill meaningfully — refund it all
                continue;
              }
              const prevUnits = held?.units ?? 0;
              const prevAvg = held?.avgCost ?? 0;
              const newUnits = prevUnits + units;
              holdings[order.assetId] = {
                units: newUnits,
                avgCost: (prevUnits * prevAvg + units * exec) / newUnits,
              };
              cash += order.size - (units * exec + fee); // change
              trades.push({
                id: genId(),
                assetId: order.assetId,
                side: "buy",
                units,
                price: exec,
                fee,
                at: new Date(now).toISOString(),
                orderType: order.kind,
              });
              fills.push({
                id: order.id,
                assetId: order.assetId,
                kind: order.kind,
                units,
                price: exec,
              });
              continue;
            }

            // Stop-loss / take-profit. Clamp to what's actually still held —
            // the position may have been sold down by hand since placement.
            const units = Math.min(order.size, held?.units ?? 0);
            if (units <= 0) continue; // position gone; drop the order
            const gross = units * exec;
            const fee = feeFor(gross);
            cash += gross - fee;
            const remaining = (held?.units ?? 0) - units;
            if (remaining <= 1e-7) {
              delete holdings[order.assetId];
            } else {
              holdings[order.assetId] = {
                units: remaining,
                avgCost: held!.avgCost,
              };
            }
            trades.push({
              id: genId(),
              assetId: order.assetId,
              side: "sell",
              units,
              price: exec,
              fee,
              at: new Date(now).toISOString(),
              orderType: order.kind,
            });
            fills.push({
              id: order.id,
              assetId: order.assetId,
              kind: order.kind,
              units,
              price: exec,
            });
          }

          let total = cash;
          for (const [id, h] of Object.entries(holdings)) {
            const price = newAssets[id]?.last.price ?? 0;
            total += h.units * price;
          }
          const prev = s.market.sessionSeries ?? [];
          const sessionSeries = [...prev, { at: now, total }].slice(-120);

          const market = { assets: newAssets, sessionSeries };
          if (fills.length === 0) return { market };

          return {
            market,
            user: { ...s.user, cash },
            portfolio: {
              ...s.portfolio,
              holdings,
              orders: stillOpen,
              history: [...trades, ...s.portfolio.history].slice(0, 200),
            },
            pendingOrderFills: [...s.pendingOrderFills, ...fills],
          };
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
              ...s.portfolio,
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

        // Market only. A limit price is a *request* to trade later, never an
        // execution price — routing one through here is what let a limit of
        // pc$0.01 mint 9,950 units for pc$100. Limit buys go to `placeOrder`.
        const quoted =
          state.market.assets[assetId]?.last.price ?? def.startPrice;
        const execPrice = buyExecutionPrice(quoted);

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
            orderType: "market",
          };
          return {
            user: {
              ...s.user,
              cash: s.user.cash - spent,
              streak: bumpStreak(s.user.streak),
            },
            portfolio: {
              ...s.portfolio,
              holdings: {
                ...s.portfolio.holdings,
                [assetId]: { units: newTotalUnits, avgCost: newAvgCost },
              },
              history: [trade, ...s.portfolio.history].slice(0, 200),
            },
          };
        });

        // Protections attach to the position the buy just opened. A rejected
        // protection is a warning, not a failure — the shares are already
        // bought, and unwinding a good trade over a bad stop price is worse.
        const warnings: string[] = [];
        const attach = (kind: OrderKind, trigger: number | undefined) => {
          if (!trigger) return;
          const res = get().placeOrder(assetId, kind, trigger, newTotalUnits);
          if (!res.ok && res.reason) warnings.push(res.reason);
        };
        attach("stop-loss", opts?.stopLoss);
        attach("take-profit", opts?.takeProfit);

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
          ...(warnings.length ? { warnings } : {}),
        };
      },

      placeOrder: (assetId, kind, triggerRaw, sizeRaw) => {
        const state = get();
        const def = assets.find((a) => a.id === assetId);
        if (!def) return { ok: false, reason: "Unknown asset" };
        const unit = unitForCompleted(state.user.completedLessons);
        if (def.unlockAfterUnit > unit) return { ok: false, reason: "Locked" };

        const trigger = Number(triggerRaw);
        const size = Number(sizeRaw);
        if (!Number.isFinite(trigger) || trigger <= 0) {
          return { ok: false, reason: "Enter a trigger price above 0" };
        }
        if (!Number.isFinite(size) || size <= 0) {
          return { ok: false, reason: "Nothing to order" };
        }

        const open = state.portfolio.orders ?? [];
        if (
          open.filter((o) => o.assetId === assetId).length >=
          MAX_OPEN_ORDERS_PER_ASSET
        ) {
          return {
            ok: false,
            reason: `You already have ${MAX_OPEN_ORDERS_PER_ASSET} open orders on ${assetId}`,
          };
        }

        const quoted =
          state.market.assets[assetId]?.last.price ?? def.startPrice;

        if (kind === "limit-buy") {
          // Must be below market — at or above it, it's just a market order —
          // and within a band, so the trigger can't be a fantasy price.
          if (trigger >= quoted) {
            return {
              ok: false,
              reason: `A limit buy sits below the market. ${assetId} is ${pcMoney(quoted)} — buy now instead.`,
            };
          }
          if (trigger < quoted * MIN_LIMIT_FRACTION) {
            return {
              ok: false,
              reason: `Too far below market. The lowest limit for ${assetId} is ${pcMoney(quoted * MIN_LIMIT_FRACTION, { cents: true })}.`,
            };
          }
          if (size > state.user.cash) {
            return { ok: false, reason: "Insufficient cash to reserve" };
          }
        } else {
          const held = state.portfolio.holdings[assetId]?.units ?? 0;
          if (held <= 0) {
            return {
              ok: false,
              reason: `You don't own any ${assetId} to protect`,
            };
          }
          if (kind === "stop-loss" && trigger >= quoted) {
            return {
              ok: false,
              reason: `A stop-loss sits below the market (${pcMoney(quoted)}).`,
            };
          }
          if (kind === "take-profit" && trigger <= quoted) {
            return {
              ok: false,
              reason: `A take-profit sits above the market (${pcMoney(quoted)}).`,
            };
          }
          if (trigger > quoted * MAX_TARGET_FRACTION) {
            return {
              ok: false,
              reason: "That target is unrealistically far away",
            };
          }
        }

        const order: RestingOrder = {
          id: genId(),
          assetId,
          kind,
          trigger,
          size,
          placedAt: new Date().toISOString(),
        };

        set((s) => ({
          // Reserving the cash up front is what stops one balance funding two
          // limit buys; `cancelOrder` refunds it.
          user:
            kind === "limit-buy"
              ? { ...s.user, cash: s.user.cash - size }
              : s.user,
          portfolio: {
            ...s.portfolio,
            orders: [...(s.portfolio.orders ?? []), order],
          },
        }));
        return { ok: true };
      },

      cancelOrder: (orderId) =>
        set((s) => {
          const order = (s.portfolio.orders ?? []).find(
            (o) => o.id === orderId,
          );
          if (!order) return {};
          return {
            user:
              order.kind === "limit-buy"
                ? { ...s.user, cash: s.user.cash + order.size }
                : s.user,
            portfolio: {
              ...s.portfolio,
              orders: (s.portfolio.orders ?? []).filter(
                (o) => o.id !== orderId,
              ),
            },
          };
        }),

      consumeOrderFills: () => {
        const fills = get().pendingOrderFills;
        if (fills.length) set({ pendingOrderFills: [] });
        return fills;
      },

      resetAll: () =>
        set(() => ({
          ...initialAppState(),
          pendingLessonComplete: null,
          pendingOrderFills: [],
        })),

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
