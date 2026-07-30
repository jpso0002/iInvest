# Prompt: port the full stock simulation from `starter-react-app` into `invest-app`

Paste everything below the line into the new chat.

---

## Context

This repo contains three app folders:

- **`invest-app/`** — the live app. This is the one to change. TanStack Start + React 19 + TypeScript + Tailwind v4 + shadcn/ui, state in Zustand (`src/store/useAppStore.ts`), persisted to localStorage.
- **`starter-react-app/`** — a reference-only earlier MVP (mixed `.jsx`/`.js`). **Do not modify it.** It's the source of the simulation features I want.
- **`learn-invest/`** — another reference-only earlier MVP. Ignore it.

`invest-app` was previously built by combining both MVPs. Its lesson curriculum, gamification, news, league, and profile are already done. **The one area still thin is the trading simulator**, and that's the task.

Read `COMBINED_APP_PLAN.md` in the repo root for background on how the merge was done.

## Goal

Port the **full functionality and feature set of the stock simulation** from `starter-react-app` into `invest-app`, adapted to `invest-app`'s conventions.

### What `invest-app` has today (the "from" state)

- `src/routes/_app.simulate.tsx` — a flat list of unlocked assets plus a portfolio summary. Tapping an asset opens a trade sheet directly. **There is no asset-detail screen at all.**
- `src/components/simulate/` — `AssetRow.tsx`, `PortfolioSummary.tsx`, `PracticeMoneyBadge.tsx`, `TradeSheet.tsx`
- `src/content/assets.ts` — 8 fictional assets (`SAVR`, `TIDE`, `CIVIC`, `HELIO`, `NORTHLINE`, `AURA`, `PYRA`, `VOLT`). Each has only: `id`, `name`, `kind`, `unlockAfterUnit`, `startPrice`, `drift`, `volatility`, `seed`, `blurb`.
- `src/lib/market.ts` — `nextPrice()` / `nextSeed()` seeded random walk; the store's `tick()` advances all prices every 3s.
- `src/store/useAppStore.ts` — `trade(assetId, side, units)`. Buys/sells by **whole or fractional unit count**. Holdings are `{ units, avgCost }`. **No fees, no slippage, no order types.**
- `src/lib/guards.ts` — `unlockedAssets(unit)`, `canUseFractional(unit)` (unit ≥ 3), `canUseTargetOrders(unit)` (unit ≥ 5 — **currently defined but never used anywhere**).
- `src/lib/format.ts` — `pcMoney()`, `num()`, `pcDelta()`.
- Curriculum: **6 units, 29 lessons**, ids `U1.1`…`U6.6` in `src/content/lessons.ts`. Current unit is derived by `unitForCompleted(completedLessons)` in `src/lib/xp.ts`.

### What to bring over from `starter-react-app` (the "to" state)

Source files worth reading in full before you start:

| File | What it gives you |
|---|---|
| `src/data/assets.js` | Deterministic PRNG (`mulberry32`, `seedFromString`) generating per-asset: `sparkline`, multi-timeframe `ranges` (1D/1W/1M/1Y/All), `range52w`, 30 daily OHLC `candles`, `ath` + `athDate`, `range24h`, `marketCap`, `volume24h`, `circulatingSupply`, `buySellRatio`, and a 6-deep `orderBook` of bids/asks. Also per-asset `managementFeePct`, `rank`, `avgAnnualReturnPct`, `about` text, and `composition` breakdown for funds. |
| `src/screens/AssetDetail.jsx` (+`.css`) | The asset detail screen — 10 progressively-revealed sections. |
| `src/screens/InvestSheet.jsx` (+`.css`) | Buy flow: **amount-based** input with quick amounts (50/100/250/Max), fee line, available balance, post-purchase preview (new total shares + new average price), market-vs-limit order type, optional stop-loss / take-profit, and "pro details" (execution price, maker/taker fees, slippage tolerance). |
| `src/screens/SellSheet.jsx` | Sell flow using 25%/50%/100% fraction buttons. |
| `src/screens/PurchaseConfirmation.jsx` (+`.css`) | Post-buy confirmation screen with a recap (shares held, position value, new average price, execution price, fees paid). |
| `src/data/disclosure.js` | `ASSET_DISCLOSURE_LEVELS` (10 tiers) and `INVEST_DISCLOSURE_LEVELS` (6 tiers), each tier keyed to a completed-lesson-count threshold. |
| `src/hooks/useLivePrice.js` | Per-second live price wobble + rolling 44-point series for a moving chart. |
| `src/components/Candlestick.jsx`, `OrderBook.jsx`, `Sparkline.jsx`, `PriceChangeTag.jsx`, `CircularProgress.jsx`, `LockedTeaser.jsx` | The supporting visual primitives. |
| `src/utils/format.js` | `formatShares`, `formatPercent`, `formatCompactNumber`, `formatCompactLarge`, `formatDate` helpers. |

## Conventions you must respect in `invest-app`

1. **All money is practice money, written `pc$`.** Use the existing `pcMoney()` / `pcDelta()` from `src/lib/format.ts`. `starter-react-app` uses a `formatEUR` helper that actually renders USD — do not carry that over. Port only the genuinely missing formatters (`formatShares`, `formatCompactLarge`, etc.) into `src/lib/format.ts` in the app's `pc$` style.
2. **Assets are fictional and must never map to a real ticker or real market data.** No external API calls, ever. All generated data must come from the existing per-asset `seed` so it's deterministic and stable across reloads.
3. **TypeScript, not JS.** Everything ported becomes properly typed `.tsx`/`.ts`. No `@ts-ignore` on new code.
4. **Style with the app's theme tokens** (`bg-card`, `text-muted-foreground`, `border-border`, `--primary`, etc.), not the hardcoded hexes `starter-react-app` uses. Dark mode must work — there's a `.dark` palette in `src/styles.css`; check both themes.
5. **Reuse what exists** rather than porting duplicates: the app already has shadcn `Sheet` (see `TradeSheet.tsx`) instead of `BottomSheet.jsx`, `PracticeMoneyBadge.tsx` instead of `SimulationBadge.jsx`, and `recharts` is already a dependency.
6. **Respect `prefers-reduced-motion`** — there's a `usePrefersReducedMotion()` hook and a global CSS override. A per-second live-ticking chart should settle for reduced-motion users.
7. If you change the persisted state shape, **bump `STORAGE_VERSION`** in `src/store/schema.ts` (currently 4). There's no migration path — it wipes local data, which is fine.

## Decisions I want you to raise before writing much code

Please investigate, then **ask me** about these — don't just pick silently:

1. **Assets: enrich the existing 8, or import starter's 7?** `invest-app`'s current 8 synthetic assets are wired into unit-based unlock tiers (`unlockAfterUnit` 1/3/5) and referenced by the lesson content. `starter-react-app` has its own 7 (`WRLD`, `NVTC`, `OBLI10`, `CRYL`, `GRIM`, `QLS`, `SLWV`) with richer metadata including a crypto asset. My instinct is to **keep the existing 8 and generate the richer data for them** from their existing seeds — but tell me the trade-off.

2. **Progressive disclosure — actually wire it up, or reveal everything?** Note that in `starter-react-app` this feature is **stubbed off**: `getDisclosureLevel()` returns the max tier, `isUnlocked()` always returns `true`, and `nextUnlock()` returns `0`, so every section shows unconditionally despite the threshold tables existing. Decide with me whether to (a) genuinely gate sections against my 29-lesson curriculum — the thresholds go up to 28, which lines up almost exactly — or (b) faithfully reproduce the "everything visible" behaviour. I lean toward (a), since progressive reveal is a real feature and it makes the lessons matter.

3. **Buying by amount vs by units.** Current `trade()` takes a unit count; starter's invest sheet takes a **pc$ amount** and derives fractional shares. These interact awkwardly with the existing `canUseFractional(unit)` gate, since amount-based buying inherently produces fractional shares. Propose how to reconcile.

4. **Fees and slippage change the practice economy.** Starter charges a 0.5% transaction fee and applies buy-side slippage. Current trading is free. Tell me whether to introduce fees for realism (and whether lesson cash rewards need rebalancing) or keep it frictionless.

5. **Where does asset detail live in the IA?** There's currently no detail route. Suggest a path (e.g. `/simulate/$assetId`) and say whether the tab bar or any deep links need updating.

## Approach

- Read both codebases first and confirm the current state matches what's described above before changing anything.
- Track the work with a task list; it's a big change.
- Keep commits/edits coherent: data layer → store → components → routes → verification.
- Don't leave dead code behind. If something is superseded, delete it. (`canUseTargetOrders` in `guards.ts` is currently unused — this work should either use it or remove it.)

## Verification (required)

The dev server config lives at `.claude/launch.json` (name `invest-app`, port 8080) — use the browser preview tools, never a raw shell command, to run it.

Verify by actually driving the app: open a **fresh browser tab** for the final check and confirm **zero console errors**. Be aware that this project's HMR leaves *stale* error entries in the console buffer after a burst of edits — same message, frozen `?t=` timestamp. Don't chase those; confirm against a clean tab.

Walk the whole flow: onboarding → complete a lesson to unlock Simulate → asset list → asset detail (each disclosure section) → buy → confirmation → sell → portfolio updates. Check light **and** dark mode. Show me screenshots of the new screens.

Two type errors are **pre-existing and unrelated** — don't try to fix them unless you're touching that code anyway:
- `src/routes/__root.tsx` — `bottomBar` prop type, from the untyped `PhoneFrame.jsx`
- `src/routes/_app.lessons.$lessonId.tsx` — loader data typing from stale TanStack generated route types

Typecheck with:

```bash
cd invest-app && bun x tsc --noEmit -p tsconfig.json
```
