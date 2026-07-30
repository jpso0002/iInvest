// iInvest — persisted state schema.
// Bump STORAGE_VERSION on breaking changes; V1 has no migrations (wipe on mismatch).

import { currentWeekId } from "@/lib/league";

// v5: Trade records gained fee/execPrice/orderType/protections when the
// simulator started charging fees and applying slippage.
// v6: portfolio gained `orders` — limit buys and stop/target orders now rest
// until a tick triggers them instead of resolving at submit time.
export const STORAGE_VERSION = 6;
export const STORAGE_KEY = "iinvest.v1";

export type LessonId = string; // e.g. "U1.2"
export type AssetId = string; // e.g. "TIDE"
/** Curriculum unit 1–6 (see content/lessons.ts). */
export type UnitNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface StreakState {
  count: number;
  lastActiveDay: string; // YYYY-MM-DD (UTC)
}

export interface LessonProgress {
  lessonId: LessonId;
  stepIndex: number;
}

export interface RealActions {
  openedBrokerage?: string; // ISO date
  firstRealTrade?: string;
  startedAutoInvest?: string;
}

export type Goal = "learn" | "save" | "invest";

export interface Profile {
  name: string;
  email: string;
  goal: Goal | null;
}

export interface UserState {
  onboarded: boolean;
  placementUnit: UnitNumber;
  xp: number;
  weeklyXp: number;
  weekId: number;
  streak: StreakState;
  cash: number; // practice currency (pc$)
  completedLessons: LessonId[];
  lessonProgress?: LessonProgress;
  realActions: RealActions;
  joinedAt: string; // ISO
  profile: Profile;
}

export interface Holding {
  units: number;
  avgCost: number;
}

export interface Trade {
  id: string;
  assetId: AssetId;
  side: "buy" | "sell";
  units: number;
  /** Price the trade actually filled at — includes buy-side slippage. */
  price: number;
  /** Transaction fee charged, in pc$. */
  fee: number;
  at: string; // ISO
  /** How the trade came about. Absent on legacy records. */
  orderType?: OrderKind | "market";
}

/** Orders that don't execute at submit time — they wait for a price. */
export type OrderKind = "limit-buy" | "stop-loss" | "take-profit";

export interface RestingOrder {
  id: string;
  assetId: AssetId;
  kind: OrderKind;
  /** Price at which the order becomes eligible to fill. */
  trigger: number;
  /** `limit-buy`: pc$ to spend (already reserved from cash).
   *  `stop-loss` / `take-profit`: units to sell. */
  size: number;
  placedAt: string; // ISO
}

export interface PortfolioState {
  holdings: Record<AssetId, Holding>;
  history: Trade[];
  /** Open orders only — filled and cancelled ones leave the list entirely,
   * with fills recorded in `history`. Keeps the tick loop scanning a short
   * array rather than a growing log. */
  orders: RestingOrder[];
}

export interface MarketTick {
  price: number;
  at: number; // epoch ms
}

export interface AssetMarket {
  last: MarketTick;
  seed: number;
}

export interface MarketState {
  assets: Record<AssetId, AssetMarket>;
  /** Session-only equity time series (NOT persisted). */
  sessionSeries?: { at: number; total: number }[];
}

export interface AppState {
  version: number;
  user: UserState;
  portfolio: PortfolioState;
  market: MarketState;
}

export const initialUser = (): UserState => ({
  onboarded: false,
  placementUnit: 1,
  xp: 0,
  weeklyXp: 0,
  weekId: currentWeekId(),
  streak: { count: 0, lastActiveDay: "" },
  cash: 0,
  completedLessons: [],
  realActions: {},
  joinedAt: new Date().toISOString(),
  profile: { name: "", email: "", goal: null },
});

export const initialPortfolio = (): PortfolioState => ({
  holdings: {},
  history: [],
  orders: [],
});

export const initialMarket = (): MarketState => ({
  assets: {},
  sessionSeries: [],
});

export const initialAppState = (): AppState => ({
  version: STORAGE_VERSION,
  user: initialUser(),
  portfolio: initialPortfolio(),
  market: initialMarket(),
});
