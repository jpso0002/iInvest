// Synthetic assets — seeded per unlock tier. All prices in pc$.
// Names are invented — never map to a real ticker.

import type { AssetId, UnitNumber } from "@/store/schema";

export type AssetKind = "index" | "stock" | "bond" | "etf" | "volatile";

export const kindLabel: Record<AssetKind, string> = {
  bond: "Bond fund",
  index: "Index fund",
  etf: "Index fund (ETF)",
  stock: "Stock",
  volatile: "High-volatility basket",
};

/** One line of a fund's holdings breakdown. Single companies have none. */
export interface CompositionSlice {
  name: string;
  pct: number;
}

export interface AssetDef {
  id: AssetId;
  name: string;
  kind: AssetKind;
  /** Unlocks when the user reaches this curriculum unit. */
  unlockAfterUnit: UnitNumber;
  startPrice: number;
  drift: number; // per tick
  volatility: number; // per tick (approx stdev)
  seed: number;
  blurb: string;
  /** Annual management fee, %. Zero for single companies — you don't pay a
   * manager to hold one share. */
  managementFeePct: number;
  /** Made-up popularity rank, shown on the market-data tier. */
  rank: number;
  avgAnnualReturnPct: number;
  /** Longer prose for the "About" tier. */
  about: string;
  /** Holdings breakdown for funds; `null` for single companies. */
  composition: CompositionSlice[] | null;
  /** Units in circulation — drives market cap and the supply tier. */
  circulatingSupply: number;
}

export const assets: AssetDef[] = [
  // ---------- Unit 1 — safest, simple ----------
  {
    id: "SAVR",
    name: "SaverBond Fund",
    kind: "bond",
    unlockAfterUnit: 1,
    startPrice: 25,
    drift: 0.0002,
    volatility: 0.003,
    seed: 11,
    blurb: "Low-volatility bond fund. Small, steady moves.",
    managementFeePct: 0.12,
    rank: 14,
    avgAnnualReturnPct: 3.2,
    about:
      "A fund of government and high-grade company bonds. Bonds are loans: you lend money and get paid interest. That makes SaverBond the calmest thing on this list — small moves, modest returns, rarely a nasty surprise.",
    composition: [
      { name: "Government bonds, 10-year", pct: 42 },
      { name: "Government bonds, short-dated", pct: 26 },
      { name: "High-grade company bonds", pct: 21 },
      { name: "Cash and equivalents", pct: 11 },
    ],
    circulatingSupply: 3_100_000,
  },
  {
    id: "TIDE",
    name: "Tidewater Broad Index",
    kind: "index",
    unlockAfterUnit: 1,
    startPrice: 100,
    drift: 0.0005,
    volatility: 0.008,
    seed: 22,
    blurb: "A wide market index — many companies in one basket.",
    managementFeePct: 0.07,
    rank: 1,
    avgAnnualReturnPct: 7.9,
    about:
      "Tracks a broad basket of large companies across every sector. One purchase spreads your money over hundreds of businesses, so no single company can sink you. The cheapest fund here to hold, and the usual starting point.",
    composition: [
      { name: "CloudCore Systems", pct: 7.9 },
      { name: "Meridian Health", pct: 6.4 },
      { name: "Anvil Industrial", pct: 5.1 },
      { name: "Bright Harbor Retail", pct: 4.6 },
      { name: "Kestrel Financial", pct: 4.2 },
      { name: "Others (486 companies)", pct: 71.8 },
    ],
    circulatingSupply: 42_000_000,
  },
  {
    id: "CIVIC",
    name: "Civic Growth ETF",
    kind: "etf",
    unlockAfterUnit: 1,
    startPrice: 50,
    drift: 0.0006,
    volatility: 0.012,
    seed: 33,
    blurb: "Growth-tilted ETF. A little more movement than an index.",
    managementFeePct: 0.35,
    rank: 5,
    avgAnnualReturnPct: 9.6,
    about:
      "An ETF weighted towards companies expected to grow revenue quickly. The tilt means bigger gains in good years and deeper drops in bad ones than a plain broad index — and a higher fee for the extra selection work.",
    composition: [
      { name: "Software and cloud", pct: 31 },
      { name: "Healthcare innovation", pct: 22 },
      { name: "Clean energy", pct: 18 },
      { name: "Consumer technology", pct: 16 },
      { name: "Other growth sectors", pct: 13 },
    ],
    circulatingSupply: 18_500_000,
  },

  // ---------- Unit 3 — individual stocks & fractional ----------
  {
    id: "HELIO",
    name: "Helio Energy Co.",
    kind: "stock",
    unlockAfterUnit: 3,
    startPrice: 80,
    drift: 0.0004,
    volatility: 0.02,
    seed: 44,
    blurb: "Single company. Bigger swings than a basket.",
    managementFeePct: 0,
    rank: 9,
    avgAnnualReturnPct: 11.4,
    about:
      "Helio Energy builds and operates solar and wind farms. One company means one set of fortunes: a good contract sends it up, a bad quarter sends it down, and there is nothing else in the basket to cushion either.",
    composition: null,
    circulatingSupply: 2_400_000,
  },
  {
    id: "NORTHLINE",
    name: "Northline Dividend ETF",
    kind: "etf",
    unlockAfterUnit: 3,
    startPrice: 40,
    drift: 0.0004,
    volatility: 0.01,
    seed: 55,
    blurb: "Dividend-focused ETF. Modest moves.",
    managementFeePct: 0.28,
    rank: 11,
    avgAnnualReturnPct: 6.1,
    about:
      "Holds established companies that pay out part of their profits as dividends. Growth is slower than a growth fund, but the payouts arrive whether or not the share price is having a good year.",
    composition: [
      { name: "Utilities", pct: 27 },
      { name: "Consumer staples", pct: 24 },
      { name: "Telecoms", pct: 19 },
      { name: "Established financials", pct: 17 },
      { name: "Other dividend payers", pct: 13 },
    ],
    circulatingSupply: 26_800_000,
  },
  {
    id: "AURA",
    name: "Aura Consumer Goods",
    kind: "stock",
    unlockAfterUnit: 3,
    startPrice: 60,
    drift: 0.0003,
    volatility: 0.018,
    seed: 66,
    blurb: "Consumer-goods stock. Steadier than tech, still bouncy.",
    managementFeePct: 0,
    rank: 16,
    avgAnnualReturnPct: 7.2,
    about:
      "Aura makes household products people buy in good times and bad, which keeps its revenue steadier than most single companies. Steadier is not the same as safe — it is still one company, and it still swings.",
    composition: null,
    circulatingSupply: 4_700_000,
  },

  // ---------- Unit 5 — volatile ----------
  {
    id: "PYRA",
    name: "Pyra Frontier Tech",
    kind: "volatile",
    unlockAfterUnit: 5,
    startPrice: 120,
    drift: 0.001,
    volatility: 0.04,
    seed: 77,
    blurb: "Frontier tech name. Can jump — or drop — fast.",
    managementFeePct: 0,
    rank: 3,
    avgAnnualReturnPct: 18.9,
    about:
      "Pyra designs chips for advanced computing. Its price moves on expectations rather than today's profits, which is why it climbs hardest in good years and falls hardest when sentiment turns. High average return, and a very bumpy road to it.",
    composition: null,
    circulatingSupply: 1_900_000,
  },
  {
    id: "VOLT",
    name: "Volt Digital Basket",
    kind: "volatile",
    unlockAfterUnit: 5,
    startPrice: 200,
    drift: 0.0008,
    volatility: 0.05,
    seed: 88,
    blurb: "Highly volatile digital-asset basket. Big swings normal.",
    managementFeePct: 0.95,
    rank: 2,
    avgAnnualReturnPct: 24.3,
    about:
      "A basket of digital assets, and the most volatile thing you can hold here. Double-digit moves in a single day are ordinary rather than exceptional. The high management fee eats into returns whichever way the price goes.",
    composition: [
      { name: "Large-cap digital assets", pct: 58 },
      { name: "Mid-cap digital assets", pct: 24 },
      { name: "Emerging protocols", pct: 12 },
      { name: "Cash buffer", pct: 6 },
    ],
    circulatingSupply: 19_400_000,
  },
];

export const assetById = (id: AssetId): AssetDef | undefined =>
  assets.find((a) => a.id === id);
