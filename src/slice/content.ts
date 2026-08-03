// Vertical-slice content — assets, lessons and news for the guided demo.
//
// Source of truth is the Unit 1 curriculum ("Your First Investing Decisions").
// Concept copy and quiz options are taken from it close to verbatim; only the
// four lessons the demo actually plays are here (1, 2, 3, 8). Lessons 4–7 are
// represented by the montage, which names their unlocks without running them.
//
// Everything is fictional. No asset maps to a real company or ticker.

export interface SliceAsset {
  id: string;
  name: string;
  short: string;
  kind: string;
  startPrice: number;
  /** Per-tick swing as a fraction. Drives how jumpy the line looks. */
  volatility: number;
  blurb: string;
  about: string;
  /** Funds only — drives the composition pie. */
  composition?: { name: string; pct: number; color: string }[];
  /** 52-week band, for the range bar unlocked at lesson 6. */
  range52w: { low: number; high: number };
}

export const SLICE_ASSETS: Record<string, SliceAsset> = {
  BRIGHT: {
    id: "BRIGHT",
    name: "Bright Bites Café Co.",
    short: "Bright Bites",
    kind: "Company · Food & drink",
    startPrice: 24.0,
    volatility: 0.012,
    blurb: "A growing café chain. Your first slice of ownership.",
    about:
      "Bright Bites runs a chain of neighbourhood cafés. When you own a share, you own a real piece of the business — the ovens, the brand, the customers.",
    range52w: { low: 18.4, high: 29.8 },
  },
  HELIO: {
    id: "HELIO",
    name: "Helio Energy Co.",
    short: "Helio",
    kind: "Company · Energy",
    startPrice: 88.0,
    // Deliberately the jumpiest thing in the demo — lesson 3 needs the contrast.
    volatility: 0.055,
    blurb: "Young, fast-moving energy company. Big swings both ways.",
    about:
      "Helio builds solar and battery projects. Young companies like this can grow fast — and fall just as fast when the news turns.",
    range52w: { low: 41.0, high: 132.0 },
  },
  STEADY: {
    id: "STEADY",
    name: "SteadyGoods Inc.",
    short: "SteadyGoods",
    kind: "Company · Household goods",
    startPrice: 41.0,
    volatility: 0.004,
    blurb: "Established, slow-moving. The calm end of the scale.",
    about:
      "SteadyGoods makes household products people buy in every economy. Growth is slow, but so are the drops.",
    range52w: { low: 37.2, high: 46.9 },
  },
  BROAD: {
    id: "BROAD",
    name: "Broad Index Fund",
    short: "Broad Index",
    kind: "Fund · Many companies",
    startPrice: 112.0,
    volatility: 0.006,
    blurb: "One purchase. Dozens of companies inside.",
    about:
      "A single fund holding dozens of companies at once. When one of them has a bad day, the rest carry the weight.",
    composition: [
      { name: "Technology", pct: 28, color: "var(--brand-purple)" },
      { name: "Healthcare", pct: 19, color: "var(--status-success)" },
      { name: "Food & drink", pct: 16, color: "var(--status-warning)" },
      { name: "Energy", pct: 14, color: "var(--status-info)" },
      { name: "Industrials", pct: 13, color: "var(--reward-gold)" },
      { name: "Everything else", pct: 10, color: "var(--market-neutral)" },
    ],
    range52w: { low: 96.5, high: 121.4 },
  },
};

// ---------------------------------------------------------------- lessons ---

export interface SliceConcept {
  kind: "concept";
  title: string;
  body: string;
  /** Which illustration to draw. Each is hand-built for its lesson. */
  visual?: "ownership" | "seesaw" | "riskScale" | "orderTypes";
}

export interface SliceQuiz {
  kind: "quiz";
  prompt: string;
  options: { text: string; why: string }[];
  correctIndex: number;
}

export type SliceStep = SliceConcept | SliceQuiz;

export interface SliceLesson {
  n: number;
  id: string;
  title: string;
  objective: string;
  steps: SliceStep[];
  /** Named in the curriculum's simulator-progression table. */
  unlockTitle: string;
  unlockBlurb: string;
}

export const SLICE_LESSONS: Record<string, SliceLesson> = {
  L1: {
    n: 1,
    id: "L1",
    title: "Owning a Piece of Something",
    objective: "A share is real ownership — not a ticker or a moving number.",
    unlockTitle: "My First Position",
    unlockBlurb: "You can now buy your first slice of a company.",
    steps: [
      {
        kind: "concept",
        title: "It starts with a taco truck",
        body: "Imagine your friend opens a taco truck and needs pc$10,000 to buy it. You give her pc$100 in exchange for 1% ownership. If the truck makes money, you get 1% of the profit. If it closes, you lose your pc$100. That's a stock — a small slice of ownership in a company, sold to raise money.",
        visual: "ownership",
      },
      {
        kind: "concept",
        title: "You're an owner, not a bettor",
        body: "Companies sell these ownership slices — called shares — on an exchange, a marketplace where people buy and sell them. When you buy a share, you're not betting on a number. You're becoming a tiny owner of a real business with real employees, products and customers.",
      },
      {
        kind: "quiz",
        prompt: "What does owning one share of a company actually mean?",
        correctIndex: 1,
        options: [
          {
            text: "You lent the company money that must be repaid",
            why: "That describes a bond, not a stock.",
          },
          {
            text: "You own a small piece of that company",
            why: "Exactly — a share is a unit of ownership in the business.",
          },
          {
            text: "You work for the company part-time",
            why: "Ownership and employment are unrelated.",
          },
          {
            text: "You get a discount on their products",
            why: "Some companies offer this, but it isn't what a share is.",
          },
        ],
      },
      {
        kind: "quiz",
        prompt:
          "You bought 1% of the taco truck for pc$100. It earns pc$1,000 profit this year. What should you expect?",
        correctIndex: 1,
        options: [
          {
            text: "Exactly pc$100 back",
            why: "A profit share isn't a refund of what you put in.",
          },
          {
            text: "Around pc$10 — your 1% share of the profit",
            why: "Right. Ownership entitles you to a proportional share.",
          },
          {
            text: "Nothing, you didn't work there",
            why: "Ownership, not labour, entitles you to profit.",
          },
          {
            text: "The full pc$1,000",
            why: "You own 1%, not the whole thing.",
          },
        ],
      },
    ],
  },

  L2: {
    n: 2,
    id: "L2",
    title: "Why Prices Move",
    objective:
      "Prices move on collective buying and selling — not randomness or magic.",
    unlockTitle: "Live price chart",
    unlockBlurb: "You can now watch the price move in real time.",
    steps: [
      {
        kind: "concept",
        title: "Supply and demand, nothing more",
        body: "Prices aren't set by the company — they're set by everyone trying to buy and sell at once. If more people want to buy Bright Bites shares than sell them, the price rises. If more want to sell, it falls. Just like concert tickets before a sold-out show.",
        visual: "seesaw",
      },
      {
        kind: "concept",
        title: "People trade on beliefs",
        body: "Prices often move on beliefs about the future, not just today's facts. If people believe Bright Bites will grow, they buy now — pushing the price up before the growth has even happened.",
      },
      {
        kind: "quiz",
        prompt:
          "Why did Bright Bites' price rise after the news about new locations?",
        correctIndex: 1,
        options: [
          {
            text: "The company printed more shares",
            why: "More shares usually dilutes the price, not raises it.",
          },
          {
            text: "More investors wanted to buy, expecting future growth",
            why: "Yes — rising demand from optimistic buyers pushes price up.",
          },
          {
            text: "The government set a new price",
            why: "Prices aren't government-set in open markets.",
          },
          {
            text: "The market closed early",
            why: "Unrelated to price movement.",
          },
        ],
      },
      {
        kind: "quiz",
        prompt: "A price dropping in one day means…",
        correctIndex: 1,
        options: [
          {
            text: "The company is definitely failing",
            why: "Short-term drops usually reflect sentiment, not failure.",
          },
          {
            text: "More people were selling than buying that day",
            why: "Correct — price falls when selling pressure wins.",
          },
          {
            text: "The stock has been frozen",
            why: "Prices move continuously while the market is open.",
          },
          {
            text: "You lost your ownership",
            why: "A price drop changes the value, never the ownership.",
          },
        ],
      },
    ],
  },

  L3: {
    n: 3,
    id: "L3",
    title: "Risk and Reward Are Partners",
    objective:
      "Higher potential returns come with higher potential losses. Always both.",
    unlockTitle: "Two new companies",
    unlockBlurb: "Helio Energy and SteadyGoods — one wild, one calm.",
    steps: [
      {
        kind: "concept",
        title: "Everything sits on a scale",
        body: "Every investment sits somewhere on a risk-and-reward scale. A savings account barely grows but almost never loses. A brand-new company might double — or lose most of its value. There's no universally right spot; the right spot depends on the outcome you can tolerate.",
        visual: "riskScale",
      },
      {
        kind: "concept",
        title: "The first behaviour lesson",
        body: "Successful investors don't chase the highest possible reward. They choose a risk level they can emotionally handle for years — because panic-selling during a dip destroys more wealth than the dip itself.",
      },
      {
        kind: "quiz",
        prompt:
          "Why doesn't an experienced investor just pick the highest possible return?",
        correctIndex: 1,
        options: [
          {
            text: "High-return options are illegal for beginners",
            why: "No such restriction exists.",
          },
          {
            text: "Higher returns bring higher losses, which trigger panic decisions",
            why: "Exactly — risk and reward move together.",
          },
          {
            text: "High-return investments don't really exist",
            why: "They exist — they simply carry more risk.",
          },
          { text: "Returns are fixed by law", why: "Returns are market-set." },
        ],
      },
      {
        kind: "quiz",
        prompt:
          "Helio Energy (volatile, young) vs SteadyGoods (stable, established). Which is most accurate?",
        correctIndex: 2,
        options: [
          {
            text: "Helio is always better because it can grow faster",
            why: "Faster potential growth means bigger potential loss.",
          },
          {
            text: "SteadyGoods guarantees no losses",
            why: "No stock guarantees against loss.",
          },
          {
            text: "Helio offers higher potential reward and higher potential loss",
            why: "That's the risk/reward relationship in one sentence.",
          },
          {
            text: "Both carry identical risk since both are stocks",
            why: "Risk varies enormously between companies.",
          },
        ],
      },
    ],
  },

  L8: {
    n: 8,
    id: "L8",
    title: "Making Your Move: Order Types",
    objective:
      "Market orders buy now at any price. Limit orders buy only at your price.",
    unlockTitle: "Limit orders & the order book",
    unlockBlurb: "You now control not just what you buy, but at what price.",
    steps: [
      {
        kind: "concept",
        title: "Two ways to place an order",
        body: "A market order says 'buy right now, at whatever the price is'. It's fast and guarantees you get in — but you don't control the exact price. A limit order says 'only buy if the price reaches the number I choose'. You control the price, but there's no guarantee it's ever reached.",
        visual: "orderTypes",
      },
      {
        kind: "quiz",
        prompt:
          "You want to buy Bright Bites immediately and don't mind the exact price. Which fits?",
        correctIndex: 1,
        options: [
          {
            text: "Limit order",
            why: "A limit order isn't guaranteed to fill immediately.",
          },
          {
            text: "Market order",
            why: "Right — market orders execute now at the best available price.",
          },
          {
            text: "Neither allows this",
            why: "This is exactly what a market order is for.",
          },
          { text: "A 52-week range order", why: "Not a real order type." },
        ],
      },
      {
        kind: "quiz",
        prompt:
          "You only want SteadyGoods if it drops to pc$40, not a cent higher. Which order?",
        correctIndex: 1,
        options: [
          {
            text: "Market order at pc$40",
            why: "Market orders can't fix a price.",
          },
          {
            text: "Limit order set at pc$40",
            why: "Correct — a limit order only fills at your price or better.",
          },
          {
            text: "Wait and check the price all day",
            why: "A limit order automates exactly that.",
          },
          {
            text: "Any order type works equally",
            why: "Only a limit order caps the price you pay.",
          },
        ],
      },
    ],
  },
};

// ------------------------------------------------------------------- news ---

export interface SliceNews {
  id: string;
  source: string;
  time: string;
  headline: string;
  body: string;
  /** Shown as the market reaction under the headline. */
  move: number;
  assetId: string;
  /** The coach's question, straight from the curriculum's news integration. */
  prompt: string;
}

export const SLICE_NEWS: Record<string, SliceNews> = {
  N1: {
    id: "N1",
    source: "The Daily Ledger",
    time: "Just now",
    headline: "Bright Bites Café Co. Opens 12 New Locations",
    body: "The café chain announced twelve new sites this quarter, its fastest expansion yet. Management pointed to strong repeat custom in existing neighbourhoods.",
    move: 6.2,
    assetId: "BRIGHT",
    prompt:
      "As an owner, how do you think this affects your slice of the company?",
  },
  N2: {
    id: "N2",
    source: "Market Wire",
    time: "2 min ago",
    headline: "Analysts Downgrade Bright Bites After Slower Sales Report",
    body: "Two analysts lowered their outlook this morning, citing softer sales growth than expected. The company has not commented.",
    move: -4.8,
    assetId: "BRIGHT",
    prompt: "More people are selling than buying. Watch what that does.",
  },
  N3: {
    id: "N3",
    source: "Energy Desk",
    time: "1 min ago",
    headline:
      "Helio Energy Shares Swing 15% in a Day on Battery Breakthrough Rumour",
    body: "An unconfirmed report of a battery efficiency breakthrough sent Helio sharply higher, then partly back down, within a single session.",
    move: 15.0,
    assetId: "HELIO",
    prompt: "Now compare that to SteadyGoods on the same day.",
  },
  N4: {
    id: "N4",
    source: "Breaking · Energy Desk",
    time: "Now",
    headline: "Helio Energy Co. Shares Fall 30% After Factory Fire",
    body: "A fire at Helio's main assembly plant halted production overnight. The company says it is assessing the damage.",
    move: -30.0,
    assetId: "HELIO",
    prompt: "Now look at your Broad Index Fund. Same market, same minute.",
  },
  N8: {
    id: "N8",
    source: "Market Wire",
    time: "Now",
    headline: "Volatility Spikes as Helio Reports Earnings After Close",
    body: "Traders expect a sharp open tomorrow. Spreads have widened across the sector this afternoon.",
    move: 0,
    assetId: "HELIO",
    prompt:
      "Would a market order or a limit order protect you from a sudden jump?",
  },
};

/** Lessons 4–7 — shown in the montage, not played. Titles and unlocks come
 *  straight from the curriculum's simulator-progression table. */
export const MONTAGE_LESSONS = [
  {
    n: 4,
    title: "Don't Put All Your Eggs in One Truck",
    unlock: "Broad Index Fund + portfolio pie chart",
    takeaway: "One bad company stops being one bad portfolio.",
  },
  {
    n: 5,
    title: "Zoom Out: Investing Is a Long Game",
    unlock: "1M / 1Y / 5Y chart timeframes",
    takeaway: "The crash that felt fatal became a bump.",
  },
  {
    n: 6,
    title: "Reading the 52-Week Range",
    unlock: "52-week range + fund composition",
    takeaway: "You can finally tell a high price from a low one.",
  },
  {
    n: 7,
    title: "Thinking in Probabilities",
    unlock: "Candlestick charts",
    takeaway: "Four numbers a day instead of one.",
  },
];
