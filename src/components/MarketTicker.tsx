import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { assets } from "@/content/assets";
import { useAppStore } from "@/store/useAppStore";
import { pcMoney } from "@/lib/format";

/** Scrolling strip of the app's own synthetic pc$ assets — never a real
 * ticker, never a real price. Change is measured against each asset's
 * starting price, since that's the only baseline this simulator has. */
export function MarketTicker() {
  const marketAssets = useAppStore((s) => s.market.assets);

  const quotes = assets.map((a) => {
    const price = marketAssets[a.id]?.last.price ?? a.startPrice;
    const changePct = ((price - a.startPrice) / a.startPrice) * 100;
    return { id: a.id, name: a.name, price, changePct };
  });

  const items = [...quotes, ...quotes].map((q, i) => ({
    ...q,
    key: `${q.id}-${i}`,
  }));

  return (
    <div
      className="overflow-hidden border-y border-border bg-card"
      aria-label="Simulated market quotes"
    >
      <div className="flex w-max animate-[ticker-scroll_32s_linear_infinite] gap-6 whitespace-nowrap px-4 py-2 motion-reduce:animate-none">
        {items.map((item) => {
          const isPositive = item.changePct >= 0;
          return (
            <div key={item.key} className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-foreground">{item.name}</span>
              <span className="tabular text-muted-foreground">
                {pcMoney(item.price)}
              </span>
              <span
                className={
                  "flex items-center gap-0.5 tabular font-medium " +
                  (isPositive ? "text-primary" : "text-destructive")
                }
              >
                {isPositive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {isPositive ? "+" : ""}
                {item.changePct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
