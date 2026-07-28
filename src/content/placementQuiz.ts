// Placement quiz — 6 questions. Score → starting unit.
// "Brand new" opt-out on splash forces Unit 1 regardless of score.

import type { UnitNumber } from "@/store/schema";

export interface PlacementOption {
  label: string;
  /** Higher score = more experienced. */
  score: number;
}

export interface PlacementQuestion {
  id: string;
  prompt: string;
  options: PlacementOption[];
}

export const placementQuestions: PlacementQuestion[] = [
  {
    id: "q1",
    prompt: "Have you ever bought a stock, ETF, or index fund?",
    options: [
      { label: "Never", score: 0 },
      { label: "Once or twice", score: 1 },
      { label: "A handful of times", score: 2 },
      { label: "Regularly", score: 3 },
    ],
  },
  {
    id: "q2",
    prompt: "When you own a share of a company, you own…",
    options: [
      { label: "A loan to the company", score: 0 },
      { label: "A tiny slice of the company", score: 2 },
      { label: "A guaranteed payout", score: 0 },
      { label: "Not sure", score: 0 },
    ],
  },
  {
    id: "q3",
    prompt: "What's an index fund, roughly?",
    options: [
      { label: "A single hot stock", score: 0 },
      { label: "A basket that tracks a market", score: 2 },
      { label: "A savings account", score: 0 },
      { label: "Not sure", score: 0 },
    ],
  },
  {
    id: "q4",
    prompt: "Why do people talk about diversification?",
    options: [
      { label: "To guarantee returns", score: 0 },
      { label: "To spread risk across things", score: 2 },
      { label: "To pay less tax", score: 0 },
      { label: "Not sure", score: 0 },
    ],
  },
  {
    id: "q5",
    prompt: "Prices going up and down over time is called…",
    options: [
      { label: "Volatility", score: 2 },
      { label: "Inflation", score: 0 },
      { label: "Liquidity", score: 1 },
      { label: "Not sure", score: 0 },
    ],
  },
  {
    id: "q6",
    prompt: "How confident do you feel making an investing decision today?",
    options: [
      { label: "Not at all", score: 0 },
      { label: "A little", score: 1 },
      { label: "Somewhat", score: 2 },
      { label: "Very", score: 3 },
    ],
  },
];

export const maxPlacementScore = placementQuestions.reduce(
  (sum, q) => sum + Math.max(...q.options.map((o) => o.score)),
  0,
);

/**
 * Deliberately conservative: even a strong score only skips ahead to unit 4,
 * never straight to the advanced material. Nothing is marked complete — this
 * just picks where the lesson path opens.
 */
export const scoreToUnit = (score: number, maxScore = maxPlacementScore): UnitNumber => {
  if (maxScore <= 0) return 1;
  const pct = score / maxScore;
  if (pct >= 0.7) return 4;
  if (pct >= 0.35) return 2;
  return 1;
};
