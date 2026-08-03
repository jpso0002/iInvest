// Demo mode — a pitch-ready snapshot of a learner part-way through the course.
//
// Opening the app with `?demo` in the URL overwrites local progress with the
// state below and drops you straight into the lessons path. It's deliberately
// idempotent: hitting the same link again re-seeds, so after someone has poked
// around on the demo phone you just relaunch to get a pristine run.
//
// The 14 completed lessons are chosen, not arbitrary. At that count the asset
// screen has five of its ten sections unlocked and the sixth showing
// "Unlocks in 3 lessons" — so a single screenshot shows both what the learner
// has earned and what's still ahead, which is the whole product mechanic.

import { STORAGE_KEY, STORAGE_VERSION, type AppState } from "@/store/schema";
import { currentWeekId } from "@/lib/league";

/** Units 1–3 complete plus the first of unit 4. Puts the learner in unit 4:
 *  fractional shares on, six of eight assets unlocked, two still teased. */
const DEMO_LESSONS = [
  "U1.1",
  "U1.2",
  "U1.3",
  "U1.4",
  "U1.5",
  "U2.1",
  "U2.2",
  "U2.3",
  "U2.4",
  "U3.1",
  "U3.2",
  "U3.3",
  "U3.4",
  "U4.1",
];

const daysAgo = (n: number): string =>
  new Date(Date.now() - n * 86400000).toISOString();

const today = (): string => new Date().toISOString().slice(0, 10);

export function buildDemoState(): AppState {
  return {
    version: STORAGE_VERSION,
    user: {
      onboarded: true,
      placementUnit: 2,
      xp: DEMO_LESSONS.length * 20, // 280
      // Enough for Silver League, so the league screen shows a real tier
      // rather than the empty bottom rung.
      weeklyXp: 120,
      weekId: currentWeekId(),
      streak: { count: 5, lastActiveDay: today() },
      // Starting 1,000 + 14 lessons + 3 unit bonuses, less what's invested
      // below and the 300 reserved against the open limit order.
      cash: 2410.5,
      completedLessons: [...DEMO_LESSONS],
      realActions: {},
      joinedAt: daysAgo(23),
      profile: { name: "Alex", email: "alex@example.com", goal: "learn" },
    },
    portfolio: {
      // Prices start at each asset's startPrice, so these average costs give a
      // believable spread on load: two up, one down. They drift once the
      // market starts ticking.
      holdings: {
        TIDE: { units: 4.2, avgCost: 92.4 }, // starts 100 → up
        CIVIC: { units: 12.0, avgCost: 46.15 }, // starts 50 → up
        HELIO: { units: 3.1, avgCost: 86.2 }, // starts 80 → down
      },
      // One order still waiting, so the "Waiting orders" card and the cash
      // reservation are both visible without having to set one up live.
      orders: [
        {
          id: "demo-order-1",
          assetId: "NORTHLINE",
          kind: "limit-buy",
          trigger: 37.5,
          size: 300,
          placedAt: daysAgo(1),
        },
      ],
      // Mixed origins so the history screen shows its badges doing something.
      history: [
        {
          id: "d6",
          assetId: "HELIO",
          side: "buy",
          units: 3.1,
          price: 86.2,
          fee: 1.34,
          at: daysAgo(1),
          orderType: "market",
        },
        {
          id: "d5",
          assetId: "CIVIC",
          side: "sell",
          units: 2.0,
          price: 51.4,
          fee: 0.51,
          at: daysAgo(3),
          orderType: "take-profit",
        },
        {
          id: "d4",
          assetId: "CIVIC",
          side: "buy",
          units: 14.0,
          price: 46.15,
          fee: 3.23,
          at: daysAgo(8),
          orderType: "limit-buy",
        },
        {
          id: "d3",
          assetId: "TIDE",
          side: "buy",
          units: 1.7,
          price: 95.8,
          fee: 0.82,
          at: daysAgo(12),
          orderType: "market",
        },
        {
          id: "d2",
          assetId: "SAVR",
          side: "sell",
          units: 8.0,
          price: 25.6,
          fee: 1.02,
          at: daysAgo(16),
          orderType: "stop-loss",
        },
        {
          id: "d1",
          assetId: "TIDE",
          side: "buy",
          units: 2.5,
          price: 90.1,
          fee: 1.13,
          at: daysAgo(19),
          orderType: "market",
        },
      ],
    },
    // Left empty on purpose — the store seeds opening prices from each asset's
    // definition on first tick, so the demo always starts from a clean market.
    market: { assets: {}, sessionSeries: [] },
  };
}

/** True when the current URL asks for demo mode. Client-only. */
export function wantsDemo(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("demo");
}

/**
 * Write the demo snapshot straight to storage and hard-reload into the app.
 *
 * Storage rather than `setState` because the persisted copy is the source of
 * truth on reload — writing only to memory would be undone the moment Zustand
 * rehydrated. The reload also clears the once-per-session simulator dialog
 * flag, so the "This is practice money" moment plays on every demo run.
 */
export function applyDemoState(): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: buildDemoState(), version: STORAGE_VERSION }),
    );
    window.sessionStorage.clear();
  } catch {
    // Private browsing or storage disabled — fall through and let the app boot
    // normally rather than dying on the landing screen.
  }
  window.location.replace("/lessons");
}
