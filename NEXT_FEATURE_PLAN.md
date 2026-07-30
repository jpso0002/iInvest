# Next feature: finish the order system

## Recommendation

**Make limit orders and stop-loss / take-profit real — orders that rest and fill on a later tick, instead of resolving instantly at submit time.**

This is the recommendation over anything new because the simulator currently ships three order controls that don't do what they say, and one of them breaks the practice economy outright.

## Why this first — the evidence

### 1. Limit buys are an exploit, not a feature

`buyWithAmount` in `src/store/useAppStore.ts` takes the user's limit price and uses it directly as the execution price, with no bound against the market price and no resting order:

```ts
const execPrice =
  orderType === "limit" && Number.isFinite(limit) && (limit as number) > 0
    ? (limit as number)
    : buyExecutionPrice(quoted);
// ...
const rawUnits = invested / execPrice;
```

Driven through the real UI on VOLT with a limit price of `pc$0.01`:

| | |
|---|---|
| Cash spent | pc$100 |
| Units acquired | 9,950 |
| Recorded average cost | pc$0.01 |
| True market price | pc$144.24 |
| **Position value at market** | **pc$1,435,227** |

A **14,352×** instant return. Any learner who reaches the limit-order tier can mint unlimited practice money, which devalues the portfolio number, the League standing, and every lesson that teaches patience.

Severity is bounded by the disclosure gate — limit orders unlock at 26 completed lessons of 29 — so this is late-game, not day-one. It is still a correctness bug in shipped code.

### 2. Stop-loss and take-profit are decorative

They are collected in the sheet, passed through the store, and written onto the `Trade` record — and then never read. Nothing in `tick()` consults them:

- `InvestSheet.tsx` — two inputs, gated at tier 5
- `useAppStore.ts:372-373` — spread onto the trade record
- `schema.ts:72-73` — persisted fields
- **No consumer anywhere**

The app teaches "set a stop-loss to limit your downside", the learner sets one, the price then blows straight through it and nothing happens. That is worse than not offering the control.

### 3. It gives `canUseTargetOrders` a real job

The guard was dead code before this port; I rewired it to the disclosure table, but the feature it gates still doesn't function. This closes that loop properly.

## Design

### Data

New persisted slice, so pending orders survive reload:

```ts
export interface RestingOrder {
  id: string;
  assetId: AssetId;
  kind: "limit-buy" | "stop-loss" | "take-profit";
  /** Price at which it becomes eligible to fill. */
  trigger: number;
  /** limit-buy: pc$ to spend. stop/target: units to sell. */
  size: number;
  placedAt: string;
  status: "open" | "filled" | "cancelled";
}
```

Add `orders: RestingOrder[]` to `PortfolioState`; bump `STORAGE_VERSION` 5 → 6.

### Fill rules — evaluated inside `tick()`

Order matters: evaluate against the *new* price each tick, before recomputing portfolio value.

- **limit-buy** — fills when `price <= trigger`. Fills at `trigger` (favourable side), which is now honest because the market genuinely reached it.
- **stop-loss** — fills when `price <= trigger`. Sells at `price`, not `trigger` — gapping through a stop is a real and teachable behaviour.
- **take-profit** — fills when `price >= trigger`. Sells at `price`.

Cap open orders per asset (3 is plenty) so `tick()` stays cheap at a 3s cadence.

### Validation at submit — closes the exploit

- Limit buy must be **below** market (else it's just a market order) and within a sane band, e.g. `>= 50%` of quoted. Reject with a clear reason rather than silently clamping.
- Stop-loss must be below market; take-profit above. Both require an existing position.
- Reserve the cash for an open limit buy so it can't be double-spent — either deduct at placement, or exclude it from available balance.

### UI

- **Order type toggle** stays where it is; on choosing Limit the CTA becomes "Place limit order" rather than "Confirm investment" — it no longer buys anything today.
- **Pending orders card** on the asset detail screen, above "Your position": trigger price, size, distance from market, cancel button.
- **Fill notification** — reuse `sonner`; on fill, toast "Stop-loss triggered: sold 2.1 VOLT at pc$96.40".
- **Purchase history** already renders from `portfolio.history`, so filled orders appear there for free.

## Sequencing

1. ~~Schema + `STORAGE_VERSION` bump, `RestingOrder` type, store actions `placeOrder` / `cancelOrder`.~~ **Done.**
2. ~~Submit-time validation — **this alone kills the exploit**, ship it first even if fills land later.~~ **Done.**
3. ~~Fill engine in `tick()`, with the three rules above.~~ **Done.**
4. ~~Pending-orders UI + cancel + fill toasts.~~ **Done.**
5. ~~Verify.~~ **Done** — measurements in "Verification results" below.

### Deviations from the design above

- `RestingOrder` has no `status` field. Only open orders live in `portfolio.orders`; fills move to `history` and cancellations are removed. Keeps the tick scan short, which was the point of the cap.
- Cash for a limit buy is **deducted at placement** rather than excluded from the displayed balance. Refunded exactly on cancel, and any whole-unit change is returned at fill.
- `Trade.stopLoss` / `Trade.takeProfit` were deleted rather than kept — they were the decorative fields this work replaces. `Trade.orderType` widened to `"market" | OrderKind` so history records how a trade came about.
- **`<Toaster />` was never mounted anywhere in the app.** Every `toast.*()` call — including pre-existing ones in `SellSheet` — was a silent no-op. Mounted in `__root.tsx`; without it the whole fill-notification requirement was unimplementable.

## Verification results

| Check | Result |
|---|---|
| pc$0.01 limit on VOLT (the original exploit) | **Rejected.** Cash pc$1,000 unchanged, no order, no holding. Toast: "Too far below market. The lowest limit for VOLT is pc$65.80." |
| Limit buy at pc$115.69 (market pc$119.26) | Filled on a later tick at **the trigger**, 0.86006 units = (100 − 0.50 fee) ÷ 115.69 |
| Cash reservation | 1,000 → 900 at placement; not debited again at fill |
| Stop-loss, trigger pc$130.03 | Filled at **pc$126.40 — 2.79% below the trigger**, correctly modelling a gap-through |
| Cancel refund | 993.88 → 893.88 reserved → 993.88 refunded, exact |
| Fill toasts | Fire and render (amber for stop-loss, green for limit fill) |
| Console on a clean load | Zero errors |

## Still open after this work

- **Protections can only be attached at buy time.** There's no way to add or move a stop on a position you already hold. A "Protect this position" entry point on the detail screen is the obvious follow-up.
- **The purchase-confirmation screen can go stale.** If a stop fires while you're still reading the confirmation, it shows a position you no longer hold. Harmless but confusing.
- **Tests.** See below — still zero, and the fill engine is now the highest-value thing to cover.

## Testing — worth starting here

The repo has **zero tests**. The fill engine is the ideal first one: `tick()` and the fill rules are pure functions over `(price, orders)`, no DOM, no store. A dozen cases would cover trigger-above/below, gapping, cash reservation, and the exploit regression. That is a meaningful safety net for the exact code most likely to be got wrong, without committing to a full testing strategy.

## Alternatives considered

| Option | Why not now |
|---|---|
| **Wallet / transaction history screen** | `portfolio.history` is persisted and only surfaced as a per-asset list on the detail screen. A real screen is genuinely missing and cheap — but it *displays* state rather than fixing broken state. Good candidate immediately after. |
| **Real backend (Supabase) + cross-user League** | The largest open item in `COMBINED_APP_PLAN.md`, and the League is fake until it lands (deterministic bots in `lib/league.ts`). But it's a big infrastructure commitment, and shipping it on top of an economy where anyone can mint pc$1.4M would make the leaderboard meaningless. Fix the economy first. |
| **More lesson content** | Curriculum is 29 lessons across 6 units and the disclosure thresholds are tuned to exactly that. Adding lessons means retuning both tables in `lib/disclosure.ts`. Do it deliberately, not as filler. |
| **Auth / real accounts** | Login and signup are UI-only today. Only worth doing as part of the backend decision above, not standalone. |

## Known cosmetic issue, unrelated

The shadcn `Sheet` portals to `document.body`, so the invest and sell sheets render against the viewport rather than inside `.phone-frame`. Pre-existing behaviour of the component, visible whenever a sheet opens on a wide window. Not part of this work, but worth a look if the phone-frame illusion matters.
