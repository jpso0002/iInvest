// Portfolio screen. Which assets exist here is driven entirely by unlocks —
// at the start there is exactly one thing to look at, which is the point.

import { ChevronRight } from "lucide-react";
import { Sparkline } from "@/components/simulate/Sparkline";
import { PriceChangeTag } from "@/components/simulate/PriceChangeTag";
import { PracticeMoneyBadge } from "@/components/simulate/PracticeMoneyBadge";
import { pcMoney } from "@/lib/format";
import { SLICE_ASSETS } from "../content";
import { useSliceStore, usePortfolioValue } from "../useSliceStore";
import { LockedSlot } from "../components/Guidance";

export function SimulatorScreen({
  onOpenAsset,
}: {
  onOpenAsset: (id: string) => void;
}) {
  const has = useSliceStore((s) => s.has);
  const prices = useSliceStore((s) => s.prices);
  const series = useSliceStore((s) => s.series);
  const positions = useSliceStore((s) => s.positions);
  const cash = useSliceStore((s) => s.cash);
  const total = usePortfolioValue();

  // The demo never shows a wall of choice — each stage adds exactly what the
  // preceding lesson earned.
  const ids = ["BRIGHT"];
  if (has("twoAssets")) ids.push("HELIO", "STEADY");
  if (has("fund")) ids.push("BROAD");
  const invested = total - cash;

  return (
    <div className="space-y-5 px-5 pb-8 pt-5">
      <header>
        <PracticeMoneyBadge />
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Your portfolio
        </h1>
      </header>

      <section
        data-slice-target="portfolio-card"
        className="rounded-3xl border border-border bg-card p-5 shadow-sm"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Total value
        </p>
        <p className="mt-1 text-3xl font-bold tabular tracking-tight">
          {pcMoney(total)}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>
            Cash{" "}
            <span className="tabular text-foreground">{pcMoney(cash)}</span>
          </span>
          <span>
            Invested{" "}
            <span className="tabular text-foreground">{pcMoney(invested)}</span>
          </span>
        </div>
      </section>

      <section data-slice-target="holdings-list" className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {ids.length > 1 ? "Available to you" : "Your first company"}
        </h2>

        {ids.map((id) => {
          const a = SLICE_ASSETS[id];
          const price = prices[id] ?? a.startPrice;
          const s = series[id] ?? [];
          const first = s[0] ?? price;
          const changePct = first ? ((price - first) / first) * 100 : 0;
          const pos = positions[id];
          const isPair = id === "HELIO" || id === "STEADY";

          return (
            <button
              key={id}
              type="button"
              onClick={() => onOpenAsset(id)}
              data-slice-target={isPair ? "risk-pair" : `asset-${id}`}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/60"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{a.short}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {pos ? `You own ${pos.units.toFixed(2)} units` : a.blurb}
                </p>
              </div>
              <div className="h-8 w-14 flex-none">
                <Sparkline
                  data={s.slice(-24)}
                  width={56}
                  height={32}
                  positive={changePct >= 0}
                  className="h-full w-full"
                />
              </div>
              <div className="flex flex-none items-center gap-1">
                <div className="text-right">
                  <p className="text-base font-semibold tabular">
                    {pcMoney(price, { cents: true })}
                  </p>
                  <PriceChangeTag value={changePct} size="sm" />
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          );
        })}

        {/* What's still locked stays visible — it's the reason to keep going. */}
        {!has("twoAssets") && (
          <LockedSlot label="Two more companies" lesson={3} />
        )}
        {!has("fund") && <LockedSlot label="Broad Index Fund" lesson={4} />}
      </section>
    </div>
  );
}
