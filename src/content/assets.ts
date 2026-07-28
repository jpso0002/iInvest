// Synthetic assets — seeded per unlock tier. All prices in pc$.
// Names are invented — never map to a real ticker.

import type { AssetId, UnitNumber } from "@/store/schema";

export type AssetKind = "index" | "stock" | "bond" | "etf" | "volatile";

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
  },
];

export const assetById = (id: AssetId): AssetDef | undefined =>
  assets.find((a) => a.id === id);
