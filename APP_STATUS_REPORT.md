# iInvest — current state of the app

**Purpose of this document:** a complete, self-contained factual briefing on what the app is and does today, written to be handed to someone with no access to the codebase who needs to write a ~2 minute pitch. Everything below is verified against the running app, not aspirational. A section at the end separates what is genuinely built from what is stubbed, so the pitch doesn't claim something that isn't there.

**Date of report:** 30 July 2026.

---

## 1. What it is, in one line

A mobile learn-to-invest app: short interactive lessons paired with a practice-money trading simulator, where finishing lessons is what unlocks both the money and the features you use to trade.

The internal shorthand has been "Duolingo for investing", and the structure genuinely mirrors it — units, a winding lesson path, XP, streaks, a weekly league. The part that isn't Duolingo is the second half: a real trading simulator that the lessons feed directly into.

## 2. The core mechanic — this is the differentiator

Most investing-education products separate the teaching from the doing: read some articles, then go and open a real brokerage account. Most trading simulators do the reverse: hand you a full professional interface on day one and let you flail.

iInvest couples them. **Completing lessons is the only way to earn practice money, and it's also the only way to unlock features in the simulator.**

Concretely:

- Every lesson pays out **+20 XP and pc$500 practice cash**. Finishing a whole unit pays a **pc$2,000 bonus**. You start with pc$1,000.
- The asset detail screen has **ten sections**, revealed progressively against your completed-lesson count. At zero lessons you see a price and a chart. Your position appears at 1 lesson. Timeframes and the 52-week range at 9. Fund composition at 14. Market data at 19. All-time-high and supply at 21. The candlestick chart and live order book only at 25.
- The buy screen has **six tiers** on the same principle. Amount to invest from the start; fees and balance at 2 lessons; a post-purchase preview at 12; market-vs-limit order types at 26; stop-loss and take-profit at 27; execution price and slippage detail at 28.
- Assets themselves unlock in tiers — 3 at unit 1, 3 more at unit 3, the 2 most volatile at unit 5.
- Fractional shares unlock at unit 3. Before that your money buys whole units only and you get the change back.

Anything still locked is shown as a labelled placeholder with **"Unlocks in N lessons"** — so the learner always sees what's coming and what it costs to get there. The curriculum has 29 lessons and the deepest threshold is 28, so the two are deliberately calibrated to each other: finishing the course is what fully unlocks the platform.

**Pitch angle:** the product's answer to "why won't I just churn after three lessons" is that the lessons are the progression system for a thing you actually want to use.

## 3. What a user actually does

**Onboarding.** Landing screen → sign-up (first name and email, stored on-device only, no account server) → a **7-question placement quiz** that drops you at the right unit rather than making everyone start at zero.

**Lessons.** A vertical winding path of lesson nodes grouped into 6 units, with completed / current / locked states. Nodes scale up and the path pans sideways as you scroll, so the current lesson stays centred. Tapping one opens the lesson: an intro card with the reward on offer, then a sequence of steps. Two step types exist — **concept cards** (explanatory, some with custom diagrams) and **multiple-choice questions**. Across the curriculum there are **35 concept cards and 88 questions**. Finishing shows a completion screen with XP earned, practice cash earned, and a coach mascot with a one-line takeaway.

**Simulate.** Portfolio value with a live sparkline, cash and holdings split out, a link to full transaction history, then the asset list. Each row shows a mini price chart and a colour-coded % change. Locked tiers are shown as "Unlock more assets — reach Unit 3."

**Asset detail.** Live price that visibly ticks, a moving chart, and up to ten sections depending on progress (position, timeframe charts with a 52-week range marker, purchase price and management fees, fund composition bars, purchase history with a tip, market data, supply and all-time high, buyer/seller split with an About write-up, candlestick chart and order book).

**Trading.** Buy by pc$ amount with quick-amount buttons; the sheet shows the transaction fee, your balance, and a preview of the resulting position. Sell by 25/50/100% of your holding. Both charge a **0.5% fee**, and market buys apply up to **0.15% slippage**, so the executed price is never quite the quoted one. A purchase confirmation screen breaks down units, position value, new average price, execution price, fees paid and total debited.

**Orders that wait.** Limit buys, stop-losses and take-profits rest until the market reaches them and fill on a later price tick. Cash for a limit buy is reserved at placement and refunded exactly if you cancel. A stop-loss deliberately fills at the *market* price, not the trigger — so if the price gaps straight through your stop you get the worse fill, which is the actual lesson a stop-loss teaches. Fills raise a notification ("Stop-loss triggered — sold 0.6250 VOLT at pc$150.97").

**News.** 8 fictional market-news articles with sources, tags, an illustrative % move and full body copy, plus a scrolling market ticker.

**League.** A weekly XP leaderboard across four tiers (Bronze / Silver / Gold / Platinum, at 0 / 100 / 250 / 500 weekly XP), with a countdown to the weekly reset.

**Profile.** Stats, appearance settings including a full dark mode, reset progress, and a standing disclaimer.

## 4. The safety framing

This matters for positioning and it's built into the product, not bolted on:

- All money is displayed as **pc$**, never $ — a distinct token that can't be mistaken for currency.
- A **"Practice money"** badge appears on every trading surface.
- The first time you open the simulator each session, a dialog states: *"Nothing here connects to real markets or a real broker. Every price is made up so you can safely try things out."*
- **All eight assets are invented** — SaverBond Fund, Tidewater Broad Index, Civic Growth ETF, Helio Energy Co., Northline Dividend ETF, Aura Consumer Goods, Pyra Frontier Tech, Volt Digital Basket. None maps to a real ticker and there is no market-data feed anywhere in the app.
- News articles are explicitly fictional and carry their own disclaimers.
- The profile carries a permanent notice that the app is education-only, gives no financial advice, and is not connected to any brokerage.

**Pitch angle:** in a category with obvious regulatory sensitivity, the product has no real-money surface at all, and says so repeatedly and prominently.

## 5. How the market works under the hood

Worth knowing because it's a genuine engineering answer to "is this just random noise?"

- Prices follow a **seeded random walk**, one tick every 3 seconds, with per-asset drift and volatility — so a bond fund moves gently and the digital-asset basket swings hard, by design.
- All the historical data on the detail screen — sparklines, five timeframe ranges, 52-week high/low, 30 daily candlesticks, all-time high, market cap, 24h volume, buyer/seller ratio and the six-deep order book — is **generated deterministically from each asset's seed**. It's identical on every reload and on every device, with no server and no API call.
- Assets carry hand-written descriptions, management fees, average annual returns and fund composition breakdowns, so the educational content on each one is real writing rather than lorem ipsum.

## 6. Technical position

- **Stack:** TanStack Start (React 19) + TypeScript + Tailwind v4 + shadcn/ui, built with Vite, package-managed by Bun.
- **State:** a single typed Zustand store, versioned and persisted to localStorage with graceful fallback to in-memory when storage is blocked.
- **Backend:** none. The app is entirely local-first and offline-capable. No account server, no database, no market feed.
- **Testing:** 28 automated tests covering the trading rules and order engine — fill conditions, fee maths, slippage bounds, cash reservation and refund, gapping behaviour, and a regression test for a since-fixed exploit.
- **Presentation:** renders inside a phone frame, so it demos as a mobile app in any desktop browser. Full light and dark theming.

## 7. Honest status — built vs. stubbed

**Fully working:**
- All 29 lessons with real content, placement quiz, XP, streaks, rewards
- Progressive disclosure, genuinely gated on lesson count
- Full trading loop: buy by amount, sell by fraction, fees, slippage, confirmation
- Resting orders (limit, stop-loss, take-profit) with a working fill engine
- Transaction history with per-trade origin, fees and running totals
- News, dark mode, profile, reset

**Simulated but presented honestly:**
- **The League ranks you against six generated bots**, not real users — there's no backend, so cross-user competition doesn't exist yet. The bot scores are deterministic per week so the board feels alive, but nobody else is really there.
- **Sign-up creates a local profile only.** There is no authentication, no password, no account recovery, and progress lives on one device in one browser.
- News is fixed editorial content, not a feed.

**Known gaps a sharp listener might probe:**
- No backend means no multi-device sync, no real leaderboard, and no analytics on real user behaviour.
- No monetisation is built or designed.
- No real-brokerage bridge — the "what happens after you've learned" step is currently just profile fields tracking whether a user says they've opened an account.
- The content is a fixed 29-lesson curriculum; there's no content pipeline for adding more without retuning the disclosure thresholds.

## 8. Suggested spine for a 2-minute pitch

1. **The problem (~20s).** Investing education and investing practice are separate products. People read and don't act, or act without understanding. Beginners open real accounts with real money as their first practical experience.
2. **The product (~20s).** Short lessons plus a practice-money simulator, on a phone.
3. **The mechanic that makes it different (~35s).** Lessons are the progression system. They pay the practice money and unlock the trading features. A beginner sees a price and a chart; someone 25 lessons in sees candlesticks and an order book. Show the "Unlocks in N lessons" placeholder — it makes the whole model legible in one frame.
4. **Proof there's substance (~25s).** Real order types that rest and fill on later ticks; a stop-loss that fills at market so gapping actually costs you; fees and slippage on every trade. This is a simulator that teaches how execution really behaves, not a toy that always fills at the quoted price.
5. **Safety and category positioning (~15s).** pc$, invented assets, no market feed, no real-money surface anywhere.
6. **Status and ask (~25s).** Fully playable end-to-end, 29 lessons, 8 assets, tested trading engine, local-first with no backend. Be straight that the League is bot-simulated and there are no real accounts yet — the next milestone is a backend for real identity and a real leaderboard.

**Two lines worth stealing verbatim** — both are in the product already:

> "Learn to invest, one bite at a time."

> "That's the whole loop: read the asset, size the order, pay the fee, hold the position. Same steps as a real platform — with none of the risk."
