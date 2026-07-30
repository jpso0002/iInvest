// iInvest — persisted state schema.
// Bump STORAGE_VERSION on breaking changes; V1 has no migrations (wipe on mismatch).

import { currentWeekId } from "@/lib/league";

// v5: Trade records gained fee/execPrice/orderType/protections when the
// simulator started charging fees and applying slippage.
export const STORAGE_VERSION = 5;
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
  /** Buys only. Sells are always market orders. */
  orderType?: "market" | "limit";
  stopLoss?: number;
  takeProfit?: number;
}

export interface PortfolioState {
  holdings: Record<AssetId, Holding>;
  history: Trade[];
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
