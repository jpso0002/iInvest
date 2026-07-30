import { useMemo } from "react";
import { X } from "lucide-react";
import type { AssetDef } from "@/content/assets";
import type { OrderKind } from "@/store/schema";
import { useAppStore } from "@/store/useAppStore";
import { pcMoney, pct, shares as fmtShares } from "@/lib/format";
import { toast } from "sonner";

const LABELS: Record<OrderKind, string> = {
  "limit-buy": "Limit buy",
  "stop-loss": "Stop-loss",
  "take-profit": "Take-profit",
};

/**
 * Open orders for one asset. Rendered above the position card so a learner can
 * see the thing that's about to spend their money — an order you can't find is
 * an order you can't cancel.
 */
export function PendingOrders({
  asset,
  price,
}: {
  asset: AssetDef;
  price: number;
}) {
  // Select the stable array reference and narrow it here. Filtering *inside*
  // the selector allocates a new array on every store read, which never equals
  // the previous one under zustand's Object.is check — an infinite render loop.
  const allOrders = useAppStore((s) => s.portfolio.orders);
  const cancelOrder = useAppStore((s) => s.cancelOrder);
  const orders = useMemo(
    () => (allOrders ?? []).filter((o) => o.assetId === asset.id),
    [allOrders, asset.id],
  );

  if (orders.length === 0) return null;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Waiting orders
      </h2>
      <div className="space-y-2">
        {orders.map((o) => {
          // Signed so the direction reads correctly: a stop sits below, a
          // take-profit above, and the sign says which way the market must move.
          const awayPct = price > 0 ? ((o.trigger - price) / price) * 100 : 0;
          return (
            <div
              key={o.id}
              className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {LABELS[o.kind]} at{" "}
                  <span className="tabular">
                    {pcMoney(o.trigger, { cents: true })}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground tabular">
                  {o.kind === "limit-buy"
                    ? `${pcMoney(o.size)} reserved`
                    : `${fmtShares(o.size)} units`}{" "}
                  · {pct(awayPct)} from market
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  cancelOrder(o.id);
                  toast.success(
                    o.kind === "limit-buy"
                      ? `Order cancelled — ${pcMoney(o.size)} back in your balance`
                      : "Order cancelled",
                  );
                }}
                aria-label={`Cancel ${LABELS[o.kind]} at ${pcMoney(o.trigger)}`}
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
