import type { OrderBookData } from "@/lib/market";
import { num, pct, pcMoney } from "@/lib/format";

/** Asks above, bids below, spread in the middle — the standard reading order.
 * Bar width shows resting size relative to the deepest level on either side. */
export function OrderBook({ bids, asks }: OrderBookData) {
  if (bids.length === 0 || asks.length === 0) return null;

  const maxQty = Math.max(...bids.map((b) => b.qty), ...asks.map((a) => a.qty));
  const spread = asks[0].price - bids[0].price;
  const spreadPct = (spread / bids[0].price) * 100;

  return (
    <div className="space-y-1">
      <div className="space-y-0.5">
        {[...asks].reverse().map((a) => (
          <Row
            key={a.price}
            price={a.price}
            qty={a.qty}
            maxQty={maxQty}
            tone="sell"
          />
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-muted/60 px-2 py-1.5 text-[11px] text-muted-foreground">
        <span>Spread</span>
        <span className="tabular">
          {pcMoney(spread)} · {pct(spreadPct, { withSign: false })}
        </span>
      </div>

      <div className="space-y-0.5">
        {bids.map((b) => (
          <Row
            key={b.price}
            price={b.price}
            qty={b.qty}
            maxQty={maxQty}
            tone="buy"
          />
        ))}
      </div>
    </div>
  );
}

function Row({
  price,
  qty,
  maxQty,
  tone,
}: {
  price: number;
  qty: number;
  maxQty: number;
  tone: "buy" | "sell";
}) {
  const isBuy = tone === "buy";
  return (
    <div className="relative flex items-center justify-between overflow-hidden rounded-md px-2 py-1 text-xs">
      <div
        className={
          "absolute inset-y-0 left-0 opacity-15 " +
          (isBuy ? "bg-primary" : "bg-destructive")
        }
        style={{ width: `${(qty / maxQty) * 100}%` }}
        aria-hidden="true"
      />
      <span
        className={
          "relative tabular font-medium " +
          (isBuy ? "text-primary" : "text-destructive")
        }
      >
        {pcMoney(price)}
      </span>
      <span className="relative tabular text-muted-foreground">{num(qty)}</span>
    </div>
  );
}
