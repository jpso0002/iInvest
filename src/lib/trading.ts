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

// -------- Resting-order limits --------
// A limit price is a *request*, never an execution price. Without a band, a
// limit of pc$0.01 on a pc$144 asset would mint units out of nothing, so the
// trigger has to stay within touching distance of the real market.

/** A limit buy may sit at most this far below the quoted price. */
export const MIN_LIMIT_FRACTION = 0.5;

/** And a stop/target at most this far the other side, so orders stay meaningful. */
export const MAX_TARGET_FRACTION = 4;

/** Per asset. Keeps the 3-second tick loop scanning a short list. */
export const MAX_OPEN_ORDERS_PER_ASSET = 3;

/**
 * Is this order eligible to fill at `price`?
 *
 * Pure and side-effect free so the rules can be reasoned about (and tested)
 * without a store, a tick, or a DOM.
 */
export const shouldFill = (
  kind: "limit-buy" | "stop-loss" | "take-profit",
  trigger: number,
  price: number,
): boolean => {
  switch (kind) {
    // Buy when the market falls to your price, sell when it falls to your stop.
    case "limit-buy":
    case "stop-loss":
      return price <= trigger;
    case "take-profit":
      return price >= trigger;
  }
};

/**
 * The price an eligible order actually fills at.
 *
 * A limit buy fills at its trigger: the market reached the price you named, so
 * that's what you pay. A stop or target fills at the *market* price instead —
 * if the price gapped straight through your stop you get the worse fill, which
 * is exactly the lesson a stop-loss is meant to teach.
 */
export const fillPrice = (
  kind: "limit-buy" | "stop-loss" | "take-profit",
  trigger: number,
  price: number,
): number => (kind === "limit-buy" ? trigger : price);
