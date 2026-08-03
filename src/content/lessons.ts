// Curriculum — 6 units, 29 lessons, ported from starter-react-app's course.
// Unit 1 carries rich multi-block concept steps with inline visuals; units 2-6
// are single-concept lessons. Every lesson has 3 MCQs (the original quiz from
// the source course plus two written from the same lesson body).
//
// Money figures are written in practice currency (pc$) so lesson copy matches
// the rest of the app — nothing here refers to real money.

import type { LessonId, UnitNumber } from "@/store/schema";

// ---------- Visual definitions ----------

export interface VisualPie {
  type: "pie";
  segments: { label: string; value: number; color: string }[];
}
export interface VisualBars {
  type: "bars";
  unit?: string;
  max: number;
  series: { label: string; value: number; color: string }[];
}
export interface VisualStack {
  type: "stack";
  layers: { label: string; color: string; width: number }[];
}
export interface VisualFlow {
  type: "flow";
  steps: { icon: string; title: string; sub?: string; color: string }[];
}
export type FormulaPart =
  { value: string; label: string; color: string } | { op: string };
export interface VisualFormula {
  type: "formula";
  parts: FormulaPart[];
}

export type LessonVisual =
  VisualPie | VisualBars | VisualStack | VisualFlow | VisualFormula;

// ---------- Lesson structure ----------

export interface McqStep {
  kind: "mcq";
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface ConceptStep {
  kind: "concept";
  title: string;
  body: string;
  visual?: LessonVisual;
}

export type LessonStep = ConceptStep | McqStep;

export interface LessonReward {
  xp: number;
  cash: number;
}

export interface LessonDef {
  id: LessonId;
  unit: UnitNumber;
  order: number;
  title: string;
  summary: string;
  steps: LessonStep[];
  reward: LessonReward;
}

export interface UnitDef {
  id: UnitNumber;
  title: string;
  subtitle: string;
}

export const units: UnitDef[] = [
  {
    id: 1,
    title: "Savings basics",
    subtitle: "Understand your money before growing it.",
  },
  {
    id: 2,
    title: "Discovering the market",
    subtitle: "How prices and markets actually work.",
  },
  {
    id: 3,
    title: "Becoming a shareholder",
    subtitle: "Your first steps placing a buy order.",
  },
  {
    id: 4,
    title: "Building a portfolio",
    subtitle: "Spread out to weather the storms.",
  },
  {
    id: 5,
    title: "Analyzing an asset",
    subtitle: "The data to know before investing.",
  },
  {
    id: 6,
    title: "Using the market",
    subtitle: "The tools of a real investment platform.",
  },
];

export const unitById = (id: UnitNumber): UnitDef | undefined =>
  units.find((u) => u.id === id);

const R: LessonReward = { xp: 20, cash: 500 };

// Palette used by the lesson diagrams. These reference the shared design
// tokens rather than their own hexes, so a diagram can never drift away from
// the rest of the app — and they follow dark mode for free.
const C_INDIGO = "var(--brand-purple)";
const C_TEAL = "var(--status-success)";
const C_AMBER = "var(--status-warning)";
const C_ROSE = "var(--status-error)";
const C_VIOLET = "var(--league-master)";
const C_SLATE = "var(--market-neutral)";

export const lessons: LessonDef[] = [
  // ================= UNIT 1 — Savings basics =================
  {
    id: "U1.1",
    unit: 1,
    order: 1,
    title: "What is money, and why save?",
    summary: "Money is a tool — saving is what turns it into options.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Money as a tool of exchange",
        body: "Money is used to trade goods and services without having to barter directly. Its real value lies in what it lets you do: feed yourself, house yourself, plan for the future.",
        visual: {
          type: "flow",
          steps: [
            {
              icon: "briefcase",
              title: "Work",
              sub: "Time & skills",
              color: C_INDIGO,
            },
            {
              icon: "coin",
              title: "Money",
              sub: "Universal exchange",
              color: C_AMBER,
            },
            {
              icon: "shopping-cart",
              title: "Goods & services",
              sub: "What you actually need",
              color: C_TEAL,
            },
          ],
        },
      },
      {
        kind: "concept",
        title: "Why save?",
        body: "Saving means setting aside part of what you earn today to protect yourself from unexpected events and fund future projects — a trip, studies, a big purchase, or simply peace of mind.",
        visual: {
          type: "stack",
          layers: [
            { label: "Future projects", color: C_VIOLET, width: 55 },
            { label: "Safety cushion", color: C_TEAL, width: 75 },
            { label: "Today's income", color: C_INDIGO, width: 100 },
          ],
        },
      },
      {
        kind: "mcq",
        prompt: "What is the main benefit of saving regularly?",
        options: [
          "Protecting yourself from surprises and funding future projects",
          "Having more paper bills at home",
          "Paying more in taxes",
          "It doesn't really matter",
        ],
        correctIndex: 0,
        explanation:
          "Savings build a safety cushion and give you the means to reach your goals without relying on debt.",
      },
      {
        kind: "mcq",
        prompt: "Money's real value comes from…",
        options: [
          "The paper it's printed on",
          "What it lets you buy and plan for",
          "The bank that issues it",
          "How old the notes are",
        ],
        correctIndex: 1,
        explanation:
          "Money is a tool of exchange — its worth is in what it can be traded for.",
      },
      {
        kind: "mcq",
        prompt: "Saving means…",
        options: [
          "Spending everything you earn",
          "Setting aside part of what you earn today",
          "Borrowing against the future",
          "Never buying anything",
        ],
        correctIndex: 1,
        explanation:
          "It's about holding back a portion now so future-you has options.",
      },
    ],
  },
  {
    id: "U1.2",
    unit: 1,
    order: 2,
    title: "The budget",
    summary: "Track income and expenses to see what's really left.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Know where your money goes",
        body: "A budget is simply the list of what you earn (income) and what you spend (fixed costs, fun, surprises). Without this overview, it's impossible to know how much you can really save.",
        visual: {
          type: "flow",
          steps: [
            {
              icon: "wallet",
              title: "Income",
              sub: "What comes in",
              color: C_TEAL,
            },
            {
              icon: "receipt",
              title: "Expenses",
              sub: "Fixed · fun · surprises",
              color: C_ROSE,
            },
            {
              icon: "piggy-bank",
              title: "What's left",
              sub: "Room to save",
              color: C_INDIGO,
            },
          ],
        },
      },
      {
        kind: "concept",
        title: "The simple 50/30/20 rule",
        body: "A common method: 50% of income for essential needs, 30% for wants, 20% for savings and investments. Not an absolute rule, but a good starting point.",
        visual: {
          type: "pie",
          segments: [
            { label: "Needs", value: 50, color: C_INDIGO },
            { label: "Wants", value: 30, color: C_AMBER },
            { label: "Savings", value: 20, color: C_TEAL },
          ],
        },
      },
      {
        kind: "mcq",
        prompt: "In the 50/30/20 rule, how much goes to savings?",
        options: ["50%", "30%", "20%", "0%"],
        correctIndex: 2,
        explanation:
          "20% of income is a reasonable target to devote to savings and investing each month.",
      },
      {
        kind: "mcq",
        prompt: "A budget is essentially…",
        options: [
          "A list of what you earn and what you spend",
          "A type of loan",
          "A tax form",
          "An investment account",
        ],
        correctIndex: 0,
        explanation:
          "Income in, expenses out — that overview is the whole point.",
      },
      {
        kind: "mcq",
        prompt: "In the 50/30/20 rule, the 50% covers…",
        options: ["Wants", "Essential needs", "Savings", "Investments"],
        correctIndex: 1,
        explanation: "Half of income goes to the essentials you can't skip.",
      },
    ],
  },
  {
    id: "U1.3",
    unit: 1,
    order: 3,
    title: "Emergency savings",
    summary: "A cushion for surprises — built before you invest.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "A safety cushion",
        body: "Emergency savings are money available immediately, reserved for surprises (car repairs, job loss, medical bills). A typical target is 3 to 6 months of expenses.",
        visual: {
          type: "bars",
          unit: "",
          max: 6,
          series: [
            { label: "Minimum", value: 3, color: C_AMBER },
            { label: "Comfortable", value: 6, color: C_TEAL },
          ],
        },
      },
      {
        kind: "concept",
        title: "Before investing",
        body: "It's best to build this emergency fund before you start investing: it prevents you from having to sell investments in a hurry — sometimes at a loss — when trouble hits.",
        visual: {
          type: "flow",
          steps: [
            {
              icon: "shield-check",
              title: "Step 1 — Emergency fund",
              sub: "3 to 6 months of expenses",
              color: C_TEAL,
            },
            {
              icon: "trending-up",
              title: "Step 2 — Invest",
              sub: "Only with what remains",
              color: C_INDIGO,
            },
          ],
        },
      },
      {
        kind: "mcq",
        prompt: "What should you generally do before starting to invest?",
        options: [
          "Borrow as much as possible",
          "Build an emergency fund",
          "Invest everything immediately",
          "Wait until retirement",
        ],
        correctIndex: 1,
        explanation:
          "An emergency fund prevents you from having to sell investments in a rush during unexpected events.",
      },
      {
        kind: "mcq",
        prompt: "A typical emergency fund target is…",
        options: [
          "One week of expenses",
          "3 to 6 months of expenses",
          "10 years of expenses",
          "There's no useful target",
        ],
        correctIndex: 1,
        explanation:
          "Enough runway to absorb a real setback without selling anything.",
      },
      {
        kind: "mcq",
        prompt: "Why build the emergency fund first?",
        options: [
          "It pays the highest interest",
          "So you don't have to sell investments at a bad moment",
          "It's legally required",
          "It removes all fees",
        ],
        correctIndex: 1,
        explanation:
          "Forced selling during a dip is exactly what the cushion prevents.",
      },
    ],
  },
  {
    id: "U1.4",
    unit: 1,
    order: 4,
    title: "Compound interest",
    summary: "Gains that earn their own gains, accelerating over time.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Interest that earns interest",
        body: "Compound interest means earning interest not only on your starting capital but also on interest already accumulated. Over time, the effect accelerates.",
        visual: {
          type: "formula",
          parts: [
            { value: "pc$1,000", label: "Capital", color: C_INDIGO },
            { op: "×" },
            { value: "(1 + 5%)", label: "Yearly rate", color: C_TEAL },
            { op: "^" },
            { value: "n", label: "Years", color: C_AMBER },
          ],
        },
      },
      {
        kind: "concept",
        title: "A concrete example",
        body: "pc$1,000 invested at 5% per year grows to pc$1,050 after 1 year. In year 2 the 5% applies to pc$1,050, not to pc$1,000. Over 20 years, the difference vs simple interest is huge.",
        visual: {
          type: "bars",
          unit: "pc$",
          max: 2653,
          series: [
            { label: "Start", value: 1000, color: C_SLATE },
            { label: "10 yr", value: 1629, color: C_INDIGO },
            { label: "20 yr", value: 2653, color: C_TEAL },
          ],
        },
      },
      {
        kind: "mcq",
        prompt: "What is compound interest?",
        options: [
          "Interest calculated only on the starting capital",
          "Interest that itself earns further interest over time",
          "A tax on savings",
          "A type of bank account",
        ],
        correctIndex: 1,
        explanation:
          "This is the key mechanism behind long-term savings growth: earnings themselves generate more earnings.",
      },
      {
        kind: "mcq",
        prompt:
          "pc$1,000 at 5% becomes pc$1,050 after a year. In year 2, the 5% applies to…",
        options: ["pc$1,000", "pc$1,050", "pc$50", "pc$0"],
        correctIndex: 1,
        explanation:
          "The base grows each year — that's the whole compounding effect.",
      },
      {
        kind: "mcq",
        prompt: "Compounding matters most when…",
        options: [
          "You invest for a few days",
          "You leave money invested for many years",
          "You withdraw every month",
          "You avoid investing entirely",
        ],
        correctIndex: 1,
        explanation:
          "The snowball needs time — decades is where it gets dramatic.",
      },
    ],
  },
  {
    id: "U1.5",
    unit: 1,
    order: 5,
    title: "Setting a savings goal",
    summary: "Concrete, dated targets beat vague intentions.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "A clear, quantified, dated goal",
        body: 'Saving "just to save" rarely motivates people for long. A concrete goal — say pc$3,000 in 2 years for a specific project — gives a clear target and lets you calculate what to set aside each month.',
        visual: {
          type: "formula",
          parts: [
            { value: "pc$3,000", label: "Goal", color: C_INDIGO },
            { op: "÷" },
            { value: "24", label: "Months", color: C_TEAL },
            { op: "=" },
            { value: "pc$125", label: "/ month", color: C_AMBER },
          ],
        },
      },
      {
        kind: "concept",
        title: "Automate to stay on track",
        body: "Setting up an automatic transfer right after payday is one of the most effective ways to save without thinking, and without being tempted to spend the money first.",
        visual: {
          type: "flow",
          steps: [
            {
              icon: "calendar",
              title: "Payday",
              sub: "Money hits your account",
              color: C_TEAL,
            },
            {
              icon: "arrow-right",
              title: "Auto-transfer",
              sub: "Same day, no thinking",
              color: C_INDIGO,
            },
            {
              icon: "piggy-bank",
              title: "Savings grow",
              sub: "Untouched, on autopilot",
              color: C_AMBER,
            },
          ],
        },
      },
      {
        kind: "mcq",
        prompt: "Which method helps you stick to a savings goal the most?",
        options: [
          "Saving whatever is left at month's end, if anything",
          "An automatic transfer scheduled right after payday",
          "Not setting an amount",
          "Saving only once a year",
        ],
        correctIndex: 1,
        explanation:
          "Automating savings right after payday removes the need to rely on daily willpower.",
      },
      {
        kind: "mcq",
        prompt: "A good savings goal is…",
        options: [
          "Vague and open-ended",
          "Concrete, quantified and dated",
          "Never written down",
          "Identical for everyone",
        ],
        correctIndex: 1,
        explanation:
          "A target you can measure is a target you can actually hit.",
      },
      {
        kind: "mcq",
        prompt: "Saving pc$3,000 over 24 months means setting aside about…",
        options: [
          "pc$125 / month",
          "pc$300 / month",
          "pc$30 / month",
          "pc$1,000 / month",
        ],
        correctIndex: 0,
        explanation: "pc$3,000 ÷ 24 months = pc$125 per month.",
      },
    ],
  },

  // ================= UNIT 2 — Discovering the market =================
  {
    id: "U2.1",
    unit: 2,
    order: 6,
    title: "What is a stock price?",
    summary: "The trading price of an asset at a given moment.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "A price is a moment in time",
        body: "A stock price is what an asset (stock, fund, or other security) trades for at a given moment. It moves constantly based on buys and sells from investors in the market.",
      },
      {
        kind: "mcq",
        prompt: "A stock price corresponds to…",
        options: [
          "A price set once a year",
          "The trading price of an asset at a given moment",
          "The CEO's salary",
          "A tax on savings",
        ],
        correctIndex: 1,
        explanation:
          "The price changes continuously based on supply and demand in the market.",
      },
      {
        kind: "mcq",
        prompt: "A stock price moves because of…",
        options: [
          "Buys and sells from investors",
          "A yearly government decision",
          "The CEO's mood",
          "Nothing — it's fixed",
        ],
        correctIndex: 0,
        explanation:
          "Every trade nudges the price; that's all a price really is.",
      },
      {
        kind: "mcq",
        prompt: "How often does a stock price change?",
        options: [
          "Once a year",
          "Constantly, while the market is trading",
          "Never",
          "Only on Mondays",
        ],
        correctIndex: 1,
        explanation: "It updates continuously as new trades happen.",
      },
    ],
  },
  {
    id: "U2.2",
    unit: 2,
    order: 7,
    title: "Stocks, bonds, funds",
    summary: "Ownership, lending, and pooling — three different things.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Three different instruments",
        body: "A stock is a share of ownership in a company. A bond is a loan you give to a company or government, repaid with interest. A fund pools several assets to spread risk.",
      },
      {
        kind: "mcq",
        prompt: "When you buy a stock, you become…",
        options: [
          "A creditor of the company",
          "A part-owner of the company",
          "An employee of the company",
          "A supplier to the company",
        ],
        correctIndex: 1,
        explanation:
          "A stock represents a share of the company's capital: you become a shareholder.",
      },
      {
        kind: "mcq",
        prompt: "A bond is…",
        options: [
          "A share of ownership",
          "A loan you give, repaid with interest",
          "A type of stock exchange",
          "A savings account",
        ],
        correctIndex: 1,
        explanation: "Bondholders are lenders, not owners.",
      },
      {
        kind: "mcq",
        prompt: "A fund is useful because it…",
        options: [
          "Guarantees returns",
          "Pools several assets to spread risk",
          "Avoids all fees",
          "Cannot lose value",
        ],
        correctIndex: 1,
        explanation: "Pooling many holdings is what spreads the risk.",
      },
    ],
  },
  {
    id: "U2.3",
    unit: 2,
    order: 8,
    title: "Reading a chart",
    summary: "Charts describe the past — never guarantee the future.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "What a chart actually tells you",
        body: "A price chart shows an asset's evolution over a chosen period (1 day, 1 month, 1 year). A rising line means the price went up, a falling line means it went down — but past performance never guarantees future results.",
      },
      {
        kind: "mcq",
        prompt: "A line chart trending up over 1 year tells you…",
        options: [
          "The price will definitely keep rising",
          "The price has generally increased over that past period",
          "You must sell immediately",
          "Nothing at all",
        ],
        correctIndex: 1,
        explanation:
          "Charts describe the past. It's useful information, but not a guaranteed prediction.",
      },
      {
        kind: "mcq",
        prompt: "A price chart shows…",
        options: [
          "The future price",
          "An asset's past evolution over a period",
          "The company's staff count",
          "Management fees",
        ],
        correctIndex: 1,
        explanation: "It's a record of what already happened.",
      },
      {
        kind: "mcq",
        prompt: "Past performance…",
        options: [
          "Guarantees future results",
          "Never guarantees future results",
          "Is illegal to display",
          "Is always a flat line",
        ],
        correctIndex: 1,
        explanation: "This is why every real disclosure repeats it.",
      },
    ],
  },
  {
    id: "U2.4",
    unit: 2,
    order: 9,
    title: "Supply and demand",
    summary: "The basic mechanism behind every price move.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Buyers versus sellers",
        body: "When more investors want to buy an asset than sell it, the price rises. Conversely, when more people want to sell than buy, the price falls. That's the basic mechanism behind every price move.",
      },
      {
        kind: "mcq",
        prompt:
          "If demand for an asset far exceeds supply, the price tends to…",
        options: [
          "Rise",
          "Fall",
          "Stay frozen by law",
          "Depend only on the government",
        ],
        correctIndex: 0,
        explanation: "More buyers than available sellers pushes the price up.",
      },
      {
        kind: "mcq",
        prompt: "When more people want to sell than buy, the price tends to…",
        options: ["Rise", "Fall", "Freeze", "Double"],
        correctIndex: 1,
        explanation: "Excess sellers push the price down — the mirror image.",
      },
      {
        kind: "mcq",
        prompt: "Supply and demand is…",
        options: [
          "A tax rule",
          "The basic mechanism behind every price move",
          "Something only bonds have",
          "A type of order",
        ],
        correctIndex: 1,
        explanation: "Every price move traces back to it.",
      },
    ],
  },

  // ================= UNIT 3 — Becoming a shareholder =================
  {
    id: "U3.1",
    unit: 3,
    order: 10,
    title: "How to buy",
    summary: "Placing an order through a brokerage platform.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Placing your first order",
        body: "To buy an asset, you place an order through a brokerage platform: pick the asset, the amount or number of shares, then confirm. The asset then appears in your portfolio.",
      },
      {
        kind: "mcq",
        prompt: "To buy a stock, you have to…",
        options: [
          "Contact the company directly",
          "Place an order through a brokerage platform",
          "Wait for a lottery",
          "None of the above",
        ],
        correctIndex: 1,
        explanation:
          'Brokerage platforms ("brokers") are the standard intermediary to buy financial assets.',
      },
      {
        kind: "mcq",
        prompt: "When placing an order you choose…",
        options: [
          "Only the asset name",
          "The asset and the amount or number of shares",
          "The company's CEO",
          "The tax rate",
        ],
        correctIndex: 1,
        explanation: "What to buy and how much — then confirm.",
      },
      {
        kind: "mcq",
        prompt: "After a buy order executes, the asset…",
        options: [
          "Disappears until you sell",
          "Appears in your portfolio",
          "Is physically mailed to you",
          "Becomes a bond",
        ],
        correctIndex: 1,
        explanation: "Your portfolio is the running record of what you own.",
      },
    ],
  },
  {
    id: "U3.2",
    unit: 3,
    order: 11,
    title: "Gains and losses",
    summary: "Nothing is realized until you actually sell.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Realized versus unrealized",
        body: "A gain is realized when you sell an asset for more than you paid. A loss is when you sell it for less. As long as you have not sold, the gain or loss is only 'unrealized'.",
      },
      {
        kind: "mcq",
        prompt: "You buy a share at pc$100 and sell it at pc$120. You realize…",
        options: [
          "A pc$20 loss",
          "A pc$20 gain",
          "No gain or loss",
          "A pc$100 gain",
        ],
        correctIndex: 1,
        explanation:
          "Sell price minus buy price — pc$120 − pc$100 = pc$20 gain.",
      },
      {
        kind: "mcq",
        prompt: "As long as you have not sold, a gain or loss is…",
        options: [
          "Realized",
          "Only unrealized",
          "Taxed immediately",
          "Impossible",
        ],
        correctIndex: 1,
        explanation: "It's on paper until the sale actually happens.",
      },
      {
        kind: "mcq",
        prompt: "You buy at pc$100 and sell at pc$80. You realize…",
        options: ["A pc$20 gain", "A pc$20 loss", "Nothing", "A pc$80 gain"],
        correctIndex: 1,
        explanation: "Selling below your purchase price locks in the loss.",
      },
    ],
  },
  {
    id: "U3.3",
    unit: 3,
    order: 12,
    title: "Average purchase price",
    summary: "The weighted average across all your buys.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Your true reference price",
        body: "If you buy the same asset several times at different prices, the average purchase price is the weighted average of all your purchases. That price, not the very first, is the reference for your gain or loss.",
      },
      {
        kind: "mcq",
        prompt: "The average purchase price is used to…",
        options: [
          "Set the asset's future price",
          "Calculate your real gain or loss across all your purchases",
          "Pay less in fees",
          "Nothing in particular",
        ],
        correctIndex: 1,
        explanation:
          "It's the reference for knowing whether your position is overall a win or a loss.",
      },
      {
        kind: "mcq",
        prompt:
          "If you buy the same asset at several prices, your reference price is…",
        options: [
          "The very first price you paid",
          "The weighted average of all your purchases",
          "The lowest price you paid",
          "Always today's price",
        ],
        correctIndex: 1,
        explanation: "Every purchase pulls the average toward its own price.",
      },
      {
        kind: "mcq",
        prompt: "Buying more of an asset at a lower price than before will…",
        options: [
          "Raise your average purchase price",
          "Lower your average purchase price",
          "Leave it unchanged",
          "Reset it to zero",
        ],
        correctIndex: 1,
        explanation: "Cheaper buys drag the weighted average down.",
      },
    ],
  },
  {
    id: "U3.4",
    unit: 3,
    order: 13,
    title: "Fees and their impact",
    summary: "Small percentages, compounded, matter a lot.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "The quiet drag on returns",
        body: "Each buy or sell can generate fees (transaction fees, annual management fees for funds). Even if they look small, they reduce your real return — especially when applied every year over the long term.",
      },
      {
        kind: "mcq",
        prompt: "Annual management fees of 2% instead of 0.2% over 20 years…",
        options: [
          "Have no notable impact",
          "Can significantly reduce final returns",
          "Automatically increase your gains",
          "Only concern bonds",
        ],
        correctIndex: 1,
        explanation:
          "Higher fees, repeated every year, eat away a large share of compounded gains over the long term.",
      },
      {
        kind: "mcq",
        prompt: "Fees can be charged…",
        options: [
          "Only when you buy",
          "On transactions and as annual management fees",
          "Only when you lose money",
          "Never on funds",
        ],
        correctIndex: 1,
        explanation: "Both per-trade costs and ongoing annual charges apply.",
      },
      {
        kind: "mcq",
        prompt: "Why do small annual fees matter so much over time?",
        options: [
          "They are charged twice a day",
          "They repeat every year and eat into compounded gains",
          "They are added to your taxes",
          "They only apply after 50 years",
        ],
        correctIndex: 1,
        explanation:
          "Compounding works against you when it's applied to a fee.",
      },
    ],
  },

  // ================= UNIT 4 — Building a portfolio =================
  {
    id: "U4.1",
    unit: 4,
    order: 14,
    title: "Diversification",
    summary: "Don't depend on any single asset.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Spread the risk",
        body: "Diversifying means spreading your money across several different assets (sectors, regions, asset types) instead of betting everything on one. If one asset drops, the others can offset it.",
      },
      {
        kind: "mcq",
        prompt: "Diversifying your portfolio mainly helps to…",
        options: [
          "Guarantee gains",
          "Reduce risk by not depending on a single asset",
          "Pay lower fees",
          "Avoid any loss",
        ],
        correctIndex: 1,
        explanation:
          "Diversification reduces overall risk without ever guaranteeing gains or fully eliminating risk.",
      },
      {
        kind: "mcq",
        prompt: "You can diversify across…",
        options: [
          "Only one company at a time",
          "Sectors, regions and asset types",
          "Only bonds",
          "Only the day of the week you buy",
        ],
        correctIndex: 1,
        explanation:
          "Spreading along several dimensions is what makes it work.",
      },
      {
        kind: "mcq",
        prompt: "Can diversification eliminate all risk?",
        options: [
          "Yes, completely",
          "No — some market-wide risk always remains",
          "Yes, if you own 10 assets",
          "Only for bonds",
        ],
        correctIndex: 1,
        explanation:
          "It reduces asset-specific risk, not the market's own swings.",
      },
    ],
  },
  {
    id: "U4.2",
    unit: 4,
    order: 15,
    title: "Risk and return",
    summary: "Higher potential reward travels with higher potential loss.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "No free lunch",
        body: "In general, the higher an asset's potential return, the higher its potential loss. A 'risk-free' investment offers a low return; a volatile asset can gain — or lose — a lot.",
      },
      {
        kind: "mcq",
        prompt: "The usual relationship between risk and potential return is…",
        options: [
          "No relationship",
          "More potential risk often goes with more potential return",
          "High risk guarantees a high return",
          "Risk only exists for bonds",
        ],
        correctIndex: 1,
        explanation:
          "This is a central principle of investing, though a high return is never guaranteed.",
      },
      {
        kind: "mcq",
        prompt: "A very low-risk investment typically offers…",
        options: [
          "The highest returns available",
          "A comparatively low return",
          "Guaranteed doubling",
          "No return at all, ever",
        ],
        correctIndex: 1,
        explanation: "Safety is paid for with lower expected reward.",
      },
      {
        kind: "mcq",
        prompt: "A volatile asset can…",
        options: [
          "Only gain",
          "Gain a lot or lose a lot",
          "Only lose",
          "Never change price",
        ],
        correctIndex: 1,
        explanation:
          "Volatility cuts in both directions — that's the whole point.",
      },
    ],
  },
  {
    id: "U4.3",
    unit: 4,
    order: 16,
    title: "Index funds and ETFs",
    summary: "One purchase, instant diversification.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "A basket in one trade",
        body: "An ETF (exchange-traded fund) automatically replicates the performance of an index — for example the largest companies in a market. It offers instant diversification with generally low fees.",
      },
      {
        kind: "mcq",
        prompt: "An ETF tracking an index lets you…",
        options: [
          "Invest in a single company at a time",
          "Instantly diversify across many companies",
          "Avoid all fees",
          "Guarantee a fixed return",
        ],
        correctIndex: 1,
        explanation:
          "By replicating a broad index, an ETF automatically diversifies your investment.",
      },
      {
        kind: "mcq",
        prompt: "An ETF's job is to…",
        options: [
          "Beat the market every year",
          "Replicate the performance of an index",
          "Pay a fixed monthly dividend",
          "Eliminate volatility",
        ],
        correctIndex: 1,
        explanation: "It tracks — it doesn't try to outguess.",
      },
      {
        kind: "mcq",
        prompt: "A common reason people like index funds is…",
        options: [
          "Guaranteed returns",
          "Broad diversification and generally low fees",
          "They never fall in value",
          "They pay daily interest",
        ],
        correctIndex: 1,
        explanation: "Diversification plus low cost is the core appeal.",
      },
    ],
  },
  {
    id: "U4.4",
    unit: 4,
    order: 17,
    title: "Investing regularly",
    summary: "Fixed amounts on a schedule smooth out timing.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Dollar-cost averaging",
        body: "Investing a fixed amount each month (rather than a lump sum at once) smooths your average purchase price and reduces the impact of bad timing. This is called dollar-cost averaging.",
      },
      {
        kind: "mcq",
        prompt: "One benefit of investing a fixed amount each month is…",
        options: [
          "Guaranteeing you always buy at the lowest price",
          "Smoothing your average purchase price over time",
          "Eliminating all risk",
          "Paying no fees",
        ],
        correctIndex: 1,
        explanation:
          "Dollar-cost averaging reduces the impact of a single mistimed buy.",
      },
      {
        kind: "mcq",
        prompt: "With a fixed amount, when prices are low you buy…",
        options: ["Fewer units", "More units", "The same units", "No units"],
        correctIndex: 1,
        explanation: "The same money stretches further when things are cheap.",
      },
      {
        kind: "mcq",
        prompt: "Dollar-cost averaging mainly protects you against…",
        options: [
          "All possible losses",
          "The impact of badly timing a single large purchase",
          "Management fees",
          "Inflation entirely",
        ],
        correctIndex: 1,
        explanation: "It spreads timing risk across many purchases.",
      },
    ],
  },

  // ================= UNIT 5 — Analyzing an asset =================
  {
    id: "U5.1",
    unit: 5,
    order: 18,
    title: "Market capitalization",
    summary: "Price × supply — how to compare asset sizes.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Sizing an asset",
        body: "Market capitalization is the total value of an asset (price × circulating supply). It's used to rank assets by size and gives a sense of their weight in the market.",
      },
      {
        kind: "mcq",
        prompt: "Market capitalization is calculated as…",
        options: [
          "The price alone",
          "The price times the circulating supply",
          "Annual revenue",
          "The number of investors",
        ],
        correctIndex: 1,
        explanation:
          "It's the standard measure to compare the size of two different assets.",
      },
      {
        kind: "mcq",
        prompt: "Market cap is mainly useful to…",
        options: [
          "Predict tomorrow's price",
          "Rank and compare assets by size",
          "Calculate your fees",
          "Choose a broker",
        ],
        correctIndex: 1,
        explanation: "It puts two very different assets on a comparable scale.",
      },
      {
        kind: "mcq",
        prompt: "Two assets with the same price…",
        options: [
          "Always have the same market cap",
          "Can have very different market caps",
          "Cannot be compared",
          "Must be in the same sector",
        ],
        correctIndex: 1,
        explanation:
          "Supply differs, so identical prices say nothing about size.",
      },
    ],
  },
  {
    id: "U5.2",
    unit: 5,
    order: 19,
    title: "Return and volume",
    summary: "Historical performance and how easily it trades.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Two different signals",
        body: "The average annual return shows an asset's historical performance over several years. Volume (often measured over 24h) shows how many shares were traded: high volume signals a liquid asset, easy to buy or sell quickly.",
      },
      {
        kind: "mcq",
        prompt: "High trading volume over 24h generally indicates…",
        options: [
          "The asset is hard to buy or sell",
          "The asset is liquid, easy to trade quickly",
          "The price won't move anymore",
          "The asset is only for professionals",
        ],
        correctIndex: 1,
        explanation:
          "The higher the volume, the easier it is to find a counterparty to buy or sell.",
      },
      {
        kind: "mcq",
        prompt: "Average annual return describes…",
        options: [
          "Guaranteed future performance",
          "Historical performance over several years",
          "The number of shareholders",
          "The fee schedule",
        ],
        correctIndex: 1,
        explanation: "It's a backward-looking summary, not a forecast.",
      },
      {
        kind: "mcq",
        prompt: "Low trading volume can make an asset…",
        options: [
          "Easier to sell instantly",
          "Harder to buy or sell quickly",
          "Immune to price changes",
          "Free of fees",
        ],
        correctIndex: 1,
        explanation:
          "Thin volume means fewer counterparties waiting on the other side.",
      },
    ],
  },
  {
    id: "U5.3",
    unit: 5,
    order: 20,
    title: "Circulating supply",
    summary: "How many units actually exist and trade.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "What's actually out there",
        body: "Circulating supply is the total number of shares or units in existence and available on the market. It directly influences the market cap and gives a sense of an asset's relative scarcity.",
      },
      {
        kind: "mcq",
        prompt: "Circulating supply corresponds to…",
        options: [
          "The number of units available on the market",
          "The number of active investors",
          "The management fees",
          "The listing currency",
        ],
        correctIndex: 0,
        explanation:
          "It's a key piece of data — combined with price — to compute market cap.",
      },
      {
        kind: "mcq",
        prompt: "Circulating supply directly influences…",
        options: [
          "The market capitalization",
          "The trading hours",
          "The broker you must use",
          "Your tax rate",
        ],
        correctIndex: 0,
        explanation: "Market cap is literally price × circulating supply.",
      },
      {
        kind: "mcq",
        prompt: "A smaller circulating supply suggests…",
        options: [
          "Greater relative scarcity",
          "Guaranteed price rises",
          "Lower fees",
          "More investors",
        ],
        correctIndex: 0,
        explanation:
          "Fewer units in existence means each one is relatively scarcer.",
      },
    ],
  },
  {
    id: "U5.4",
    unit: 5,
    order: 21,
    title: "Highs and price ranges",
    summary: "Context for where the current price sits.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Putting today's price in context",
        body: "The all-time high (ATH) is the highest price an asset ever reached. A price range over a period (e.g. 52 weeks) shows the gap between the recent low and high — useful to place the current price in context.",
      },
      {
        kind: "mcq",
        prompt: 'The ATH ("all-time high") refers to…',
        options: [
          "The average price over 1 year",
          "The lowest price ever reached",
          "The highest price ever reached",
          "Tomorrow's expected price",
        ],
        correctIndex: 2,
        explanation:
          "The ATH is a historical marker, not a prediction of future price.",
      },
      {
        kind: "mcq",
        prompt: "A 52-week range shows…",
        options: [
          "The gap between the year's low and high",
          "The number of trades",
          "The dividend schedule",
          "The management fee",
        ],
        correctIndex: 0,
        explanation:
          "Low to high over the period, giving you a band for context.",
      },
      {
        kind: "mcq",
        prompt: "Knowing the ATH tells you…",
        options: [
          "The price will return there",
          "Where the price has been, not where it's going",
          "The asset is a good buy",
          "The exact fair value",
        ],
        correctIndex: 1,
        explanation: "It's history — useful context, never a forecast.",
      },
    ],
  },
  {
    id: "U5.5",
    unit: 5,
    order: 22,
    title: "Trading activity",
    summary: "Buying versus selling pressure, short term.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Who's pushing harder",
        body: "The buy/sell ratio (buying vs selling pressure) indicates the short-term dynamic on an asset: more active buyers than sellers can precede a rise, and vice versa.",
      },
      {
        kind: "mcq",
        prompt: "Strong buying pressure on an asset signals…",
        options: [
          "No more trades are possible",
          "A dynamic where buyers temporarily dominate sellers",
          "The asset will definitely fall",
          "Fees will increase",
        ],
        correctIndex: 1,
        explanation:
          "It's a short-term market dynamic indicator, not a guarantee of future trend.",
      },
      {
        kind: "mcq",
        prompt: "The buy/sell ratio describes…",
        options: [
          "A long-term valuation",
          "Short-term buying versus selling pressure",
          "The company's profit",
          "The dividend yield",
        ],
        correctIndex: 1,
        explanation: "It's a snapshot of near-term pressure, nothing more.",
      },
      {
        kind: "mcq",
        prompt: "Is strong buying pressure a guarantee the price will rise?",
        options: [
          "Yes, always",
          "No — it's an indicator, not a guarantee",
          "Only for bonds",
          "Only on Fridays",
        ],
        correctIndex: 1,
        explanation:
          "Indicators describe pressure; they don't promise outcomes.",
      },
    ],
  },
  {
    id: "U5.6",
    unit: 5,
    order: 23,
    title: "Understanding what you buy",
    summary: "Read what actually sits behind the ticker.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Know what you own",
        body: "Before investing in an asset, it helps to read its description: what project, company or index sits behind it? Understanding what you own helps you invest with more peace of mind for the long run.",
      },
      {
        kind: "mcq",
        prompt: "Why read the description of an asset before investing?",
        options: [
          "To find the account password",
          "To understand what you actually own",
          "It's never useful",
          "To avoid fees",
        ],
        correctIndex: 1,
        explanation:
          "Understanding what the asset represents helps you invest more thoughtfully and calmly.",
      },
      {
        kind: "mcq",
        prompt: "Knowing what sits behind an asset mainly helps you…",
        options: [
          "Predict the exact price",
          "Hold with more confidence over the long run",
          "Skip all fees",
          "Trade without a broker",
        ],
        correctIndex: 1,
        explanation:
          "Conviction comes from understanding, and it's what stops panic selling.",
      },
      {
        kind: "mcq",
        prompt: "Buying an asset you don't understand tends to…",
        options: [
          "Guarantee losses",
          "Make it harder to stay calm when the price swings",
          "Reduce fees",
          "Improve returns",
        ],
        correctIndex: 1,
        explanation:
          "Without understanding, every dip feels like a reason to bail.",
      },
    ],
  },

  // ================= UNIT 6 — Using the market =================
  {
    id: "U6.1",
    unit: 6,
    order: 24,
    title: "Order book and spread",
    summary: "Bids, asks, and the gap between them.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Where prices actually meet",
        body: "The order book lists open buy orders (bids) and sell orders (asks) with their prices. The spread is the gap between the best bid and best ask: the smaller it is, the more liquid the asset.",
      },
      {
        kind: "mcq",
        prompt: "The bid-ask spread refers to…",
        options: [
          "Total management fees",
          "The gap between the best bid and best ask",
          "The 24h change",
          "The number of pending orders",
        ],
        correctIndex: 1,
        explanation:
          "A tight spread generally signals a liquid market with lots of buyers and sellers close in price.",
      },
      {
        kind: "mcq",
        prompt: "The order book lists…",
        options: [
          "Only completed trades",
          "Open buy and sell orders with their prices",
          "The company's accounts",
          "Historical dividends",
        ],
        correctIndex: 1,
        explanation:
          "It's the live queue of what people are willing to trade at.",
      },
      {
        kind: "mcq",
        prompt: "A very tight spread usually means…",
        options: [
          "The asset is illiquid",
          "The asset is liquid",
          "Trading is suspended",
          "Fees are higher",
        ],
        correctIndex: 1,
        explanation:
          "Lots of buyers and sellers close together narrows the gap.",
      },
    ],
  },
  {
    id: "U6.2",
    unit: 6,
    order: 25,
    title: "Candlestick charts",
    summary: "Open, close, high and low in one mark.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "More than a line",
        body: "Each candle summarizes the price move over a period: open, close, high and low. A green candle signals a rise over the period, a red candle a fall.",
      },
      {
        kind: "mcq",
        prompt: "A candlestick represents…",
        options: [
          "A single instant price",
          "The open, close, high and low over a period",
          "Only traded volume",
          "The number of investors",
        ],
        correctIndex: 1,
        explanation:
          "A candlestick chart packs more information than a simple price line.",
      },
      {
        kind: "mcq",
        prompt: "Compared to a simple line chart, candlesticks show…",
        options: [
          "Less information",
          "More information per period",
          "Only the closing price",
          "Only volume",
        ],
        correctIndex: 1,
        explanation: "Four data points per candle instead of one.",
      },
      {
        kind: "mcq",
        prompt: "A candle showing a rise over its period is usually drawn…",
        options: [
          "In a colour signalling an increase",
          "As a flat line",
          "Upside down",
          "Without a body",
        ],
        correctIndex: 0,
        explanation: "Colour encodes direction at a glance.",
      },
    ],
  },
  {
    id: "U6.3",
    unit: 6,
    order: 26,
    title: "Market vs limit orders",
    summary: "Speed of execution versus control of price.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Two ways to place an order",
        body: "A market order executes immediately at the best available price. A limit order only executes at the price you set (or better) — more control over the price, but execution is not guaranteed.",
      },
      {
        kind: "mcq",
        prompt:
          "What is the main difference between a market order and a limit order?",
        options: [
          "There is no difference",
          "A market order executes immediately at the current price; a limit order waits for the chosen price",
          "A limit order is always faster",
          "A market order requires a preset price",
        ],
        correctIndex: 1,
        explanation:
          "A market order prioritizes speed; a limit order prioritizes price control.",
      },
      {
        kind: "mcq",
        prompt: "A limit order's main drawback is…",
        options: [
          "It always costs more in fees",
          "Execution is not guaranteed",
          "It executes too fast",
          "It can only be used to sell",
        ],
        correctIndex: 1,
        explanation:
          "If the price never reaches your limit, the order simply doesn't fill.",
      },
      {
        kind: "mcq",
        prompt: "If you care most about getting filled right now, you'd use…",
        options: [
          "A limit order",
          "A market order",
          "A stop-loss",
          "No order at all",
        ],
        correctIndex: 1,
        explanation: "Market orders trade price certainty for speed.",
      },
    ],
  },
  {
    id: "U6.4",
    unit: 6,
    order: 27,
    title: "Stop-loss and take-profit",
    summary: "Automatic exits, up and down.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Deciding in advance",
        body: "A stop-loss automatically sells if the price falls below a defined threshold, to cap a loss. A take-profit automatically sells if the price reaches a preset gain target.",
      },
      {
        kind: "mcq",
        prompt: "A stop-loss is used to…",
        options: [
          "Guarantee a minimum gain",
          "Automatically cap a loss at a defined threshold",
          "Increase the number of shares purchased",
          "Reduce management fees",
        ],
        correctIndex: 1,
        explanation: "It's an automatic safety net against a large price drop.",
      },
      {
        kind: "mcq",
        prompt: "A take-profit order sells when…",
        options: [
          "The price falls below a threshold",
          "The price reaches a preset gain target",
          "The market closes",
          "Fees are charged",
        ],
        correctIndex: 1,
        explanation: "It's the mirror image of a stop-loss, on the upside.",
      },
      {
        kind: "mcq",
        prompt: "The main appeal of these orders is that they…",
        options: [
          "Guarantee profits",
          "Let you decide your exit in advance, without watching constantly",
          "Remove all fees",
          "Predict the market",
        ],
        correctIndex: 1,
        explanation: "Deciding calmly in advance beats deciding in a panic.",
      },
    ],
  },
  {
    id: "U6.5",
    unit: 6,
    order: 28,
    title: "Fees and slippage",
    summary: "Maker vs taker, and the price you actually get.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "The gap between expected and actual",
        body: "'Maker' fees (you add liquidity, e.g. a pending limit order) are often lower than 'taker' fees (you take existing liquidity, e.g. a market order). Slippage is the gap between the expected price and the actually executed price.",
      },
      {
        kind: "mcq",
        prompt: "Slippage refers to…",
        options: [
          "A type of fixed fee",
          "The gap between the expected price and the actually executed price",
          "The bid-ask spread",
          "A welcome bonus",
        ],
        correctIndex: 1,
        explanation:
          "In a fast-moving or illiquid market, the executed price can differ from the displayed price when the order was placed.",
      },
      {
        kind: "mcq",
        prompt: "'Maker' fees are usually…",
        options: [
          "Higher than taker fees",
          "Lower than taker fees",
          "Identical to taker fees",
          "Never charged",
        ],
        correctIndex: 1,
        explanation: "Adding liquidity is rewarded with a cheaper rate.",
      },
      {
        kind: "mcq",
        prompt: "Slippage tends to be worst when the market is…",
        options: [
          "Calm and liquid",
          "Fast-moving or illiquid",
          "Closed",
          "Fee-free",
        ],
        correctIndex: 1,
        explanation:
          "Thin or fast markets move away from your expected price fastest.",
      },
    ],
  },
  {
    id: "U6.6",
    unit: 6,
    order: 29,
    title: "Your investment plan",
    summary: "Goals, horizon and discipline beat timing.",
    reward: R,
    steps: [
      {
        kind: "concept",
        title: "Putting it all together",
        body: "A good investment plan reflects your goals, your time horizon, and your risk tolerance. It combines diversification, regularity, and discipline — far more useful than trying to guess the best moment to buy.",
      },
      {
        kind: "mcq",
        prompt: "A solid personal investment plan is built above all on…",
        options: [
          "Perfectly guessing the best moment to invest",
          "Your goals, your time horizon, and steady discipline",
          "Investing everything at once in a single asset",
          "Ignoring risk completely",
        ],
        correctIndex: 1,
        explanation:
          "Consistency and alignment with your goals matter far more than perfect timing.",
      },
      {
        kind: "mcq",
        prompt: "Your time horizon matters because…",
        options: [
          "It sets your fee rate",
          "Money needed soon shouldn't sit in volatile assets",
          "It determines your broker",
          "It has no effect",
        ],
        correctIndex: 1,
        explanation: "Short horizons can't ride out a downturn.",
      },
      {
        kind: "mcq",
        prompt: "Compared to timing the market, discipline and regularity are…",
        options: [
          "Far less useful",
          "Generally far more useful",
          "Exactly equivalent",
          "Only for professionals",
        ],
        correctIndex: 1,
        explanation: "Reliable habits outperform guesswork for most people.",
      },
    ],
  },
];

// ---------- Lookups ----------

export const lessonById = (id: LessonId): LessonDef | undefined =>
  lessons.find((l) => l.id === id);

export const lessonsByUnit = (unit: UnitNumber): LessonDef[] =>
  lessons.filter((l) => l.unit === unit).sort((a, b) => a.order - b.order);

export const isLessonUnlocked = (
  lesson: LessonDef,
  completed: string[],
): boolean => {
  if (lesson.order === 1) return true;
  const prev = lessons.find((l) => l.order === lesson.order - 1);
  if (!prev) return true;
  return completed.includes(prev.id);
};

export const nextLesson = (completed: string[]): LessonDef | undefined =>
  lessons
    .slice()
    .sort((a, b) => a.order - b.order)
    .find((l) => !completed.includes(l.id));
