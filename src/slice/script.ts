// The beat script — the entire guided demo as data.
//
// The director walks this list. Each beat says which screen to show, what the
// coach says, what the market does, and what the learner must do to advance.
// Editing the experience means editing this file, not the components.
//
// Target runtime ~8 minutes: welcome → L1 → sim → news → L2 → sim → L3 → sim
// → montage (L4–7) → the fully-unlocked screen → L8 → limit order → done.

export type Screen =
  | "welcome"
  | "lesson"
  | "simulator"
  | "asset"
  | "news"
  | "montage"
  | "completion";

/** Capabilities the learner earns. Screens read these to decide what exists. */
export type Unlock =
  | "buy" // L1 — my first position
  | "liveChart" // L2 — 1-day live price
  | "twoAssets" // L3 — Helio + SteadyGoods
  | "fund" // L4 — Broad Index Fund + pie
  | "timeframes" // L5 — 1M / 1Y / 5Y
  | "range52w" // L6 — 52-week range + composition
  | "candles" // L7 — candlestick view
  | "limitOrders"; // L8 — limit orders + order book

export interface Beat {
  id: string;
  screen: Screen;
  /** Which asset the asset screen shows. */
  assetId?: string;
  lessonId?: string;
  newsId?: string;
  /** Coach lines, shown one card at a time before the beat becomes interactive. */
  coach?: string[];
  /** Highlighted element key — matches `data-slice-target` in the DOM. */
  spotlight?: string;
  /** Label on the advance button when the beat advances by tap. */
  cta?: string;
  /** What the learner must do. `auto` advances on a timer. */
  advance: "tap" | "lesson" | "buy" | "limitOrder" | "auto";
  autoMs?: number;
  /** Granted when the beat is *entered*. */
  grants?: Unlock[];
  /** Full-screen unlock celebration before the beat renders. */
  celebrate?: { title: string; blurb: string; lessonN: number };
  /** Scripted market move applied on entry, as a fraction (0.06 = +6%). */
  marketMove?: { assetId: string; pct: number; overMs: number };
  /** Drives the price just past the resting order so the fill is guaranteed.
   *  A percentage can land a cent short, and the demo's payoff can't depend on
   *  a rounding margin. */
  driveToFill?: { assetId: string; overMs: number };
}

export const SCRIPT: Beat[] = [
  // ---------------------------------------------------------- welcome ---
  {
    id: "welcome",
    screen: "welcome",
    advance: "tap",
    cta: "Start",
  },
  {
    id: "intro",
    screen: "simulator",
    coach: [
      "This is your portfolio. Every number in here is practice money — pc$. None of it is real, and none of it ever will be.",
      "Right now you can see a price. You can't see whether it's a good price, what the company does, or what happens if it drops.",
      "Each lesson turns one of those on. Eight lessons, eight new abilities. Let's earn the first one.",
    ],
    spotlight: "portfolio-card",
    advance: "tap",
    cta: "Teach me",
  },

  // ------------------------------------------------- lesson 1 → buying ---
  { id: "l1", screen: "lesson", lessonId: "L1", advance: "lesson" },
  {
    id: "l1-unlock",
    screen: "simulator",
    grants: ["buy"],
    celebrate: {
      title: "My First Position",
      blurb: "You understand what a share is. Now you can own one.",
      lessonN: 1,
    },
    coach: [
      "You just learned that a share is a piece of a real business. So let's buy one.",
      "Bright Bites Café Co. — a chain of cafés. Tap it and you'll become a part-owner.",
    ],
    spotlight: "asset-BRIGHT",
    advance: "tap",
    cta: "Open Bright Bites",
  },
  {
    id: "l1-buy",
    screen: "asset",
    assetId: "BRIGHT",
    coach: [
      "Notice the wording. It doesn't say 'buy stock' — it says you'll own a piece of Bright Bites. That's what's actually happening.",
    ],
    spotlight: "buy-button",
    advance: "buy",
  },
  {
    id: "l1-news",
    screen: "news",
    newsId: "N1",
    coach: [
      "You're an owner now — so company news is your news.",
      "Twelve new locations. More cafés, more customers, more profit to share. Watch what the market does with that.",
    ],
    marketMove: { assetId: "BRIGHT", pct: 0.062, overMs: 2600 },
    advance: "tap",
    cta: "Back to my position",
  },
  {
    id: "l1-reflect",
    screen: "asset",
    assetId: "BRIGHT",
    coach: [
      "Your slice is worth more than it was a minute ago. You didn't do anything — the business did.",
      "But why did the price move at all? That's the next lesson.",
    ],
    spotlight: "position-card",
    advance: "tap",
    cta: "Next lesson",
  },

  // ------------------------------------------ lesson 2 → why prices move ---
  { id: "l2", screen: "lesson", lessonId: "L2", advance: "lesson" },
  {
    id: "l2-unlock",
    screen: "asset",
    assetId: "BRIGHT",
    grants: ["liveChart"],
    celebrate: {
      title: "Live price chart",
      blurb: "You know why prices move. Now you can watch it happen.",
      lessonN: 2,
    },
    coach: [
      "That line is live. Every tick is buyers and sellers disagreeing about what Bright Bites is worth.",
    ],
    spotlight: "price-chart",
    advance: "tap",
    cta: "Got it",
  },
  {
    id: "l2-news",
    screen: "news",
    newsId: "N2",
    coach: [
      "Now the other direction. Analysts just downgraded Bright Bites.",
      "Nothing about the cafés changed this morning. Only what people believe about them.",
    ],
    marketMove: { assetId: "BRIGHT", pct: -0.048, overMs: 2600 },
    advance: "tap",
    cta: "See the effect",
  },
  {
    id: "l2-reflect",
    screen: "asset",
    assetId: "BRIGHT",
    coach: [
      "Down. Same company, same cafés, lower price — because more people were selling than buying.",
      "That's the whole mechanism. Not magic, not randomness. People.",
    ],
    spotlight: "price-chart",
    advance: "tap",
    cta: "Next lesson",
  },

  // --------------------------------------- lesson 3 → risk and reward ---
  { id: "l3", screen: "lesson", lessonId: "L3", advance: "lesson" },
  {
    id: "l3-unlock",
    screen: "simulator",
    grants: ["twoAssets"],
    celebrate: {
      title: "Two new companies",
      blurb: "One wild, one calm. Now you can feel the difference.",
      lessonN: 3,
    },
    coach: [
      "Two new companies just appeared. Helio Energy is young and volatile. SteadyGoods is old and boring.",
      "Watch them for a moment. Same market, same seconds — completely different behaviour.",
    ],
    spotlight: "risk-pair",
    advance: "auto",
    autoMs: 7000,
  },
  {
    id: "l3-news",
    screen: "news",
    newsId: "N3",
    coach: [
      "A rumour — not even confirmed — and Helio swings 15%.",
      "SteadyGoods barely moved. That gap is what 'risk' actually means.",
    ],
    marketMove: { assetId: "HELIO", pct: 0.15, overMs: 3000 },
    advance: "tap",
    cta: "I see it",
  },

  // ------------------------------------------------ montage: L4 → L7 ---
  {
    id: "montage",
    screen: "montage",
    grants: ["fund", "timeframes", "range52w", "candles"],
    advance: "tap",
    cta: "See what I've unlocked",
  },
  {
    id: "montage-payoff",
    screen: "asset",
    assetId: "HELIO",
    coach: [
      "Same screen you saw at the start. Look at it now.",
      "Timeframes, a 52-week range, candlesticks, fund composition — every one of them earned by a lesson.",
      "And that crash you just read about? Switch to 5Y.",
    ],
    spotlight: "timeframes",
    advance: "tap",
    cta: "Nearly there",
  },
  {
    id: "diversify",
    screen: "simulator",
    coach: [
      "Here's the proof. Helio fell 30% on that factory fire.",
      "Your Broad Index Fund holds dozens of companies — Helio is just one of them. Look what it did.",
    ],
    spotlight: "holdings-list",
    advance: "tap",
    cta: "One last lesson",
  },

  // ----------------------------------------------- lesson 8 → orders ---
  { id: "l8", screen: "lesson", lessonId: "L8", advance: "lesson" },
  {
    id: "l8-unlock",
    screen: "asset",
    assetId: "STEADY",
    grants: ["limitOrders"],
    celebrate: {
      title: "Limit orders & the order book",
      blurb: "You control not just what you buy, but at what price.",
      lessonN: 8,
    },
    coach: [
      "SteadyGoods is trading around pc$41. You've decided you'd only buy at pc$40.",
      "So don't watch the screen all day. Leave an order that waits for you.",
    ],
    spotlight: "buy-button",
    advance: "limitOrder",
  },
  {
    id: "l8-fill",
    screen: "asset",
    assetId: "STEADY",
    coach: [
      "There it is, sitting in the order book with everyone else's.",
      "Now watch — the price is drifting down toward your number.",
    ],
    spotlight: "order-book",
    driveToFill: { assetId: "STEADY", overMs: 5200 },
    advance: "auto",
    autoMs: 8600,
  },

  // ------------------------------------------------------ completion ---
  { id: "done", screen: "completion", advance: "tap", cta: "Start over" },
];

export const beatIndexById = (id: string): number =>
  SCRIPT.findIndex((b) => b.id === id);
