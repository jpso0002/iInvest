// Trading costs for the practice economy.
//
// Fees and slippage are real here: they're charged, they change the numbers on
// the confirmation screen, and the invest sheet's fee line is the true amount.
// Learners who ignore costs should see the difference in their balance, which
// is the whole point of showing them.

/** Charged on both sides, on the gross amount. */
export const FEE_RATE = 0.005;

/** Worst-case adverse move between placing a market buy and it filling. */
export const MAX_SLIPPAGE = 0.0015;

export const feeFor = (amount: number): number =>
  Math.max(0, amount) * FEE_RATE;

/**
 * Market buys fill at or slightly above the quoted price. Deliberately random
 * rather than seeded — an execution is a one-off event, and the price it filled
 * at is written into the trade record, so history stays stable afterwards.
 */
export const buyExecutionPrice = (quoted: number): number =>
  quoted * (1 + Math.random() * MAX_SLIPPAGE);

/** Displayed on the pro-details tier. */
export const MAKER_TAKER = {
  market: "0.20% / 0.20%",
  limit: "0.10% / 0.20%",
} as const;

export type OrderType = "market" | "limit";
