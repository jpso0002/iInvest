import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { PracticeMoneyBadge } from "@/components/simulate/PracticeMoneyBadge";
import { assetById } from "@/content/assets";
import { useAppStore } from "@/store/useAppStore";
import type { Trade } from "@/store/schema";
import { formatDate, pcMoney, shares as fmtShares } from "@/lib/format";

export const Route = createFileRoute("/_app/simulate/history")({
  head: () => ({
    meta: [
      { title: "Transaction history · iInvest" },
      {
        name: "description",
        content:
          "Every practice trade you've made, with fees and how it filled.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HistoryScreen,
});

/** How a trade came about, in words. */
const ORIGIN: Record<string, string> = {
  market: "Market order",
  "limit-buy": "Limit order filled",
  "stop-loss": "Stop-loss triggered",
  "take-profit": "Take-profit hit",
};

function HistoryScreen() {
  const history = useAppStore((s) => s.portfolio.history);

  // Newest first is how it's stored; group by calendar day for scanning.
  const days = useMemo(() => {
    const map = new Map<string, Trade[]>();
    for (const t of history) {
      const day = t.at.slice(0, 10);
      const list = map.get(day);
      if (list) list.push(t);
      else map.set(day, [t]);
    }
    return [...map.entries()];
  }, [history]);

  const totalFees = useMemo(
    () => history.reduce((sum, t) => sum + (t.fee ?? 0), 0),
    [history],
  );

  return (
    <main className="space-y-4 px-5 pb-10 pt-6">
      <div className="flex items-center gap-3">
        <Link
          to="/simulate"
          aria-label="Back to simulate"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight">
            Transaction history
          </h1>
          <p className="text-xs text-muted-foreground">
            {history.length} trade{history.length === 1 ? "" : "s"} ·{" "}
            <span className="tabular">
              {pcMoney(totalFees, { cents: true })}
            </span>{" "}
            paid in fees
          </p>
        </div>
      </div>

      <PracticeMoneyBadge />

      {history.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-muted/40 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No trades yet. Buy something in the simulator and it'll show up
            here.
          </p>
        </div>
      ) : (
        days.map(([day, trades]) => (
          <section key={day} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {formatDate(day)}
            </h2>
            <div className="space-y-2">
              {trades.map((t) => (
                <TradeRow key={t.id} trade={t} />
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}

function TradeRow({ trade }: { trade: Trade }) {
  const asset = assetById(trade.assetId);
  const isBuy = trade.side === "buy";
  const gross = trade.units * trade.price;
  // A buy costs you the gross plus the fee; a sell nets you the gross minus it.
  const net = isBuy ? gross + trade.fee : gross - trade.fee;
  const Icon = isBuy ? ArrowDownLeft : ArrowUpRight;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <div
        className={
          "flex h-9 w-9 flex-none items-center justify-center rounded-full " +
          (isBuy
            ? "bg-market-up/10 text-market-up-text"
            : "bg-market-down/10 text-market-down-text")
        }
      >
        <Icon className="h-4 w-4" strokeWidth={2.2} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {isBuy ? "Bought" : "Sold"} {asset?.id ?? trade.assetId}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground tabular">
          {fmtShares(trade.units)} @ {pcMoney(trade.price, { cents: true })}
        </p>
        {/* On its own line: at 390px this is the first thing to get truncated
            away, and how an order filled is the point of the screen. */}
        {trade.orderType && (
          <span className="mt-1 inline-block rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {ORIGIN[trade.orderType] ?? trade.orderType}
          </span>
        )}
      </div>

      <div className="flex-none text-right">
        <p
          className={
            "text-sm font-semibold tabular " +
            (isBuy ? "text-foreground" : "text-market-up-text")
          }
        >
          {isBuy ? "−" : "+"}
          {pcMoney(net, { cents: true })}
        </p>
        <p className="text-[11px] text-muted-foreground tabular">
          fee {pcMoney(trade.fee, { cents: true })}
        </p>
      </div>
    </div>
  );
}
