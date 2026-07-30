// Progressive disclosure for the simulator.
//
// The asset-detail screen and the invest sheet each reveal sections as the
// learner completes lessons, so nobody meets an order book before they know
// what a share is. Thresholds are counts of completed lessons; the curriculum
// has 29, and the tables top out at 25 and 28 respectively.
//
// Components MUST read through `isUnlocked` / `nextUnlock` rather than
// comparing lesson counts inline.

export interface DisclosureLevel<K extends string = string> {
  level: number;
  /** Completed-lesson count at which this section appears. */
  threshold: number;
  key: K;
  /** Shown in the locked teaser. */
  label: string;
}

export type AssetSectionKey =
  | "price"
  | "position"
  | "timeframes"
  | "avgPrice"
  | "composition"
  | "history"
  | "marketData"
  | "supplyAth"
  | "tradingActivity"
  | "orderBook";

export const ASSET_DISCLOSURE_LEVELS: DisclosureLevel<AssetSectionKey>[] = [
  { level: 1, threshold: 0, key: "price", label: "Price & chart" },
  { level: 2, threshold: 1, key: "position", label: "Your position" },
  {
    level: 3,
    threshold: 9,
    key: "timeframes",
    label: "Timeframes & 52-week range",
  },
  {
    level: 4,
    threshold: 13,
    key: "avgPrice",
    label: "Average purchase price & fees",
  },
  { level: 5, threshold: 14, key: "composition", label: "Fund composition" },
  { level: 6, threshold: 17, key: "history", label: "Purchase history & tips" },
  { level: 7, threshold: 19, key: "marketData", label: "Market data" },
  {
    level: 8,
    threshold: 21,
    key: "supplyAth",
    label: "Supply & all-time high",
  },
  {
    level: 9,
    threshold: 23,
    key: "tradingActivity",
    label: "Trading activity & About",
  },
  { level: 10, threshold: 25, key: "orderBook", label: "Candles & order book" },
];

export type InvestSectionKey =
  | "amount"
  | "feesBalance"
  | "preview"
  | "orderType"
  | "protections"
  | "proDetails";

export const INVEST_DISCLOSURE_LEVELS: DisclosureLevel<InvestSectionKey>[] = [
  { level: 1, threshold: 0, key: "amount", label: "Amount to invest" },
  {
    level: 2,
    threshold: 2,
    key: "feesBalance",
    label: "Fees & available balance",
  },
  { level: 3, threshold: 12, key: "preview", label: "Preview after purchase" },
  {
    level: 4,
    threshold: 26,
    key: "orderType",
    label: "Market vs limit orders",
  },
  {
    level: 5,
    threshold: 27,
    key: "protections",
    label: "Stop-loss & take-profit",
  },
  {
    level: 6,
    threshold: 28,
    key: "proDetails",
    label: "Pro details (execution, slippage)",
  },
];

/** Highest level whose threshold the learner has reached. */
export const disclosureLevel = (
  completedCount: number,
  levels: DisclosureLevel[],
): number => {
  let reached = 0;
  for (const l of levels) {
    if (completedCount >= l.threshold) reached = l.level;
  }
  return reached;
};

export const isUnlocked = (
  completedCount: number,
  levels: DisclosureLevel[],
  level: number,
): boolean => {
  const target = levels.find((l) => l.level === level);
  return target ? completedCount >= target.threshold : false;
};

/** Lessons still to complete before `level` appears. 0 once it's unlocked. */
export const nextUnlock = (
  completedCount: number,
  levels: DisclosureLevel[],
  level: number,
): number => {
  const target = levels.find((l) => l.level === level);
  if (!target) return 0;
  return Math.max(0, target.threshold - completedCount);
};

/** The next section the learner hasn't reached, for the teaser at the end. */
export const nextLockedLevel = <K extends string>(
  completedCount: number,
  levels: DisclosureLevel<K>[],
): DisclosureLevel<K> | undefined =>
  levels.find((l) => completedCount < l.threshold);
