import { beforeEach, describe, expect, test } from "bun:test";
import { useAppStore } from "./useAppStore";
import { initialAppState } from "./schema";
import { lessons } from "@/content/lessons";
import { assetById } from "@/content/assets";
import { FEE_RATE } from "@/lib/trading";

// VOLT: unlocks at unit 5, so the fixture completes the whole curriculum.
const ASSET = "VOLT";
const ALL_LESSONS = lessons.map((l) => l.id);

/** Deterministic starting point: full curriculum, known cash, known price. */
function reset(price: number, cash = 1000) {
  const base = initialAppState();
  useAppStore.setState({
    ...base,
    user: {
      ...base.user,
      onboarded: true,
      cash,
      completedLessons: ALL_LESSONS,
    },
    market: {
      assets: { [ASSET]: { last: { price, at: Date.now() }, seed: 1 } },
    },
    pendingLessonComplete: null,
    pendingOrderFills: [],
  });
}

/** Move the market without running the tick engine's own random walk. */
function setPrice(price: number) {
  useAppStore.setState((s) => ({
    market: {
      ...s.market,
      assets: {
        ...s.market.assets,
        [ASSET]: { last: { price, at: Date.now() }, seed: 1 },
      },
    },
  }));
}

const store = () => useAppStore.getState();

beforeEach(() => reset(200));

describe("placeOrder validation", () => {
  test("REGRESSION: a limit far below market is rejected, not filled", () => {
    // This is the bug that motivated the whole feature: a pc$0.01 limit on a
    // pc$200 asset used to mint ~9,950 units for pc$100.
    const res = store().placeOrder(ASSET, "limit-buy", 0.01, 100);

    expect(res.ok).toBe(false);
    expect(res.reason).toContain("Too far below market");
    expect(store().user.cash).toBe(1000);
    expect(store().portfolio.holdings[ASSET]).toBeUndefined();
    expect(store().portfolio.orders).toHaveLength(0);
  });

  test("a limit at or above market is rejected — that's just a market buy", () => {
    expect(store().placeOrder(ASSET, "limit-buy", 200, 100).ok).toBe(false);
    expect(store().placeOrder(ASSET, "limit-buy", 250, 100).ok).toBe(false);
  });

  test("a limit just inside the band is accepted and reserves the cash", () => {
    const res = store().placeOrder(ASSET, "limit-buy", 190, 100);

    expect(res.ok).toBe(true);
    expect(store().user.cash).toBe(900); // reserved, not spent
    expect(store().portfolio.orders).toHaveLength(1);
    expect(store().portfolio.holdings[ASSET]).toBeUndefined(); // nothing bought
  });

  test("a limit buy larger than the balance is rejected", () => {
    expect(store().placeOrder(ASSET, "limit-buy", 190, 5000).ok).toBe(false);
    expect(store().user.cash).toBe(1000);
  });

  test("protections need a position to protect", () => {
    const res = store().placeOrder(ASSET, "stop-loss", 180, 1);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain("don't own");
  });

  test("a stop above market and a target below it are both rejected", () => {
    useAppStore.setState((s) => ({
      portfolio: {
        ...s.portfolio,
        holdings: { [ASSET]: { units: 5, avgCost: 200 } },
      },
    }));
    expect(store().placeOrder(ASSET, "stop-loss", 210, 5).ok).toBe(false);
    expect(store().placeOrder(ASSET, "take-profit", 190, 5).ok).toBe(false);
  });

  test("open orders per asset are capped", () => {
    for (let i = 0; i < 3; i++) {
      expect(store().placeOrder(ASSET, "limit-buy", 190 - i, 10).ok).toBe(true);
    }
    const res = store().placeOrder(ASSET, "limit-buy", 180, 10);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain("open orders");
  });
});

describe("cancelOrder", () => {
  test("refunds a limit buy's reserved cash exactly", () => {
    store().placeOrder(ASSET, "limit-buy", 190, 100);
    expect(store().user.cash).toBe(900);

    store().cancelOrder(store().portfolio.orders[0].id);

    expect(store().user.cash).toBe(1000);
    expect(store().portfolio.orders).toHaveLength(0);
  });

  test("cancelling a protection doesn't touch cash", () => {
    useAppStore.setState((s) => ({
      portfolio: {
        ...s.portfolio,
        holdings: { [ASSET]: { units: 5, avgCost: 200 } },
      },
    }));
    store().placeOrder(ASSET, "stop-loss", 180, 5);
    const before = store().user.cash;

    store().cancelOrder(store().portfolio.orders[0].id);

    expect(store().user.cash).toBe(before);
  });
});

describe("fill engine", () => {
  test("a limit buy doesn't fill while the market stays above the trigger", () => {
    store().placeOrder(ASSET, "limit-buy", 190, 100);
    setPrice(195);
    store().tick();

    expect(store().portfolio.orders).toHaveLength(1);
    expect(store().portfolio.holdings[ASSET]).toBeUndefined();
  });

  test("a limit buy fills at its trigger, not at the lower market price", () => {
    store().placeOrder(ASSET, "limit-buy", 190, 100);
    setPrice(150); // gapped well below the trigger
    store().tick();

    const holding = store().portfolio.holdings[ASSET];
    const expectedUnits = (100 - 100 * FEE_RATE) / 190;

    expect(holding.units).toBeCloseTo(expectedUnits, 8);
    expect(holding.avgCost).toBe(190);
    expect(store().portfolio.orders).toHaveLength(0);
    expect(store().portfolio.history[0].orderType).toBe("limit-buy");
  });

  test("filling a limit buy doesn't debit cash twice", () => {
    store().placeOrder(ASSET, "limit-buy", 190, 100);
    expect(store().user.cash).toBe(900); // reserved

    setPrice(180);
    store().tick();

    // Fully spent at the trigger, so the reservation covers it and no more.
    expect(store().user.cash).toBeCloseTo(900, 8);
  });

  test("a stop-loss fills at the market, below its trigger, when price gaps", () => {
    useAppStore.setState((s) => ({
      portfolio: {
        ...s.portfolio,
        holdings: { [ASSET]: { units: 2, avgCost: 200 } },
      },
    }));
    store().placeOrder(ASSET, "stop-loss", 190, 2);

    setPrice(170); // straight through the stop
    store().tick();

    // `tick` advances the random walk *before* evaluating orders, so the fill
    // uses the freshly-walked price rather than the one seeded above.
    const market = store().market.assets[ASSET].last.price;
    const trade = store().portfolio.history[0];

    expect(trade.side).toBe("sell");
    expect(trade.price).toBe(market);
    expect(trade.price).toBeLessThan(190); // gapped through the stop
    expect(store().portfolio.holdings[ASSET]).toBeUndefined();
    expect(store().user.cash).toBeCloseTo(
      1000 + 2 * market * (1 - FEE_RATE),
      8,
    );
  });

  test("a take-profit fills at the market once the price rises through it", () => {
    useAppStore.setState((s) => ({
      portfolio: {
        ...s.portfolio,
        holdings: { [ASSET]: { units: 2, avgCost: 200 } },
      },
    }));
    store().placeOrder(ASSET, "take-profit", 220, 2);

    setPrice(235);
    store().tick();

    const market = store().market.assets[ASSET].last.price;
    expect(store().portfolio.history[0].price).toBe(market);
    expect(store().portfolio.history[0].price).toBeGreaterThan(220);
    expect(store().portfolio.orders).toHaveLength(0);
  });

  test("a stop is clamped to what's still held after a manual sell", () => {
    useAppStore.setState((s) => ({
      portfolio: {
        ...s.portfolio,
        holdings: { [ASSET]: { units: 4, avgCost: 200 } },
      },
    }));
    store().placeOrder(ASSET, "stop-loss", 190, 4);
    store().sell(ASSET, 3); // sold most of it by hand

    setPrice(170);
    store().tick();

    // Only the remaining unit is sold — the stale size doesn't go short.
    const stopFill = store().portfolio.history.find(
      (t) => t.orderType === "stop-loss",
    );
    expect(stopFill?.units).toBeCloseTo(1, 8);
    expect(store().portfolio.holdings[ASSET]).toBeUndefined();
  });

  test("fills are queued for notification", () => {
    store().placeOrder(ASSET, "limit-buy", 190, 100);
    setPrice(150);
    store().tick();

    const fills = store().consumeOrderFills();
    expect(fills).toHaveLength(1);
    expect(fills[0].kind).toBe("limit-buy");
    expect(store().pendingOrderFills).toHaveLength(0); // consumed once
  });
});

describe("buyWithAmount", () => {
  test("cannot be steered by a limit price any more", () => {
    // The old signature accepted orderType/limitPrice; the exploit lived there.
    const res = store().buyWithAmount(ASSET, 100);
    expect(res.ok).toBe(true);

    const def = assetById(ASSET)!;
    expect(def).toBeDefined();
    // Filled at market (plus slippage), never at some named price.
    expect(res.execution!.execPrice).toBeGreaterThanOrEqual(200);
    expect(res.execution!.execPrice).toBeLessThan(201);
  });

  test("attaches protections as resting orders", () => {
    const res = store().buyWithAmount(ASSET, 100, {
      stopLoss: 180,
      takeProfit: 260,
    });

    expect(res.ok).toBe(true);
    expect(
      store()
        .portfolio.orders.map((o) => o.kind)
        .sort(),
    ).toEqual(["stop-loss", "take-profit"]);
  });

  test("a bad protection warns but never unwinds the trade", () => {
    const res = store().buyWithAmount(ASSET, 100, { stopLoss: 9999 });

    expect(res.ok).toBe(true);
    expect(store().portfolio.holdings[ASSET]).toBeDefined();
    expect(res.warnings?.length).toBeGreaterThan(0);
    expect(store().portfolio.orders).toHaveLength(0);
  });
});
