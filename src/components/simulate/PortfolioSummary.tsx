import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { useAppStore } from "@/store/useAppStore";
import { pcDelta, pcMoney } from "@/lib/format";
import { assets } from "@/content/assets";

export function PortfolioSummary() {
  const cash = useAppStore((s) => s.user.cash);
  const holdings = useAppStore((s) => s.portfolio.holdings);
  const market = useAppStore((s) => s.market.assets);
  const series = useAppStore((s) => s.market.sessionSeries ?? []);

  let holdingsValue = 0;
  let unrealized = 0;
  for (const a of assets) {
    const h = holdings[a.id];
    if (!h || h.units <= 0) continue;
    const price = market[a.id]?.last.price ?? a.startPrice;
    holdingsValue += h.units * price;
    unrealized += h.units * (price - h.avgCost);
  }
  const total = cash + holdingsValue;
  const pnlPositive = unrealized >= 0;

  const chartData =
    series.length > 1
      ? series
      : [
          { at: 0, total },
          { at: 1, total },
        ];

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Portfolio value
          </p>
          <p className="mt-1 text-3xl font-bold tabular tracking-tight">
            {pcMoney(total)}
          </p>
          <p
            className={
              "mt-1 text-sm tabular " +
              (pnlPositive ? "text-market-up-text" : "text-market-down-text")
            }
          >
            {pcDelta(unrealized)} unrealized
          </p>
        </div>
        <div className="h-16 w-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 0, left: 0, bottom: 4 }}
            >
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Line
                type="monotone"
                dataKey="total"
                stroke={pnlPositive ? "var(--market-up)" : "var(--market-down)"}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>
          Cash <span className="tabular text-foreground">{pcMoney(cash)}</span>
        </span>
        <span>
          Holdings{" "}
          <span className="tabular text-foreground">
            {pcMoney(holdingsValue)}
          </span>
        </span>
      </div>
    </section>
  );
}
