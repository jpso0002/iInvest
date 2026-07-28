import { Lock } from "lucide-react";
import type { AssetDef } from "@/content/assets";
import { useAppStore } from "@/store/useAppStore";
import { num, pcMoney } from "@/lib/format";

const kindLabel: Record<AssetDef["kind"], string> = {
  bond: "Bond",
  index: "Index",
  etf: "ETF",
  stock: "Stock",
  volatile: "Volatile",
};

export function AssetRow({
  asset,
  onOpen,
}: {
  asset: AssetDef;
  onOpen: (id: string) => void;
}) {
  const price = useAppStore(
    (s) => s.market.assets[asset.id]?.last.price ?? asset.startPrice,
  );
  const holding = useAppStore((s) => s.portfolio.holdings[asset.id]);

  return (
    <button
      type="button"
      onClick={() => onOpen(asset.id)}
      className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="min-w-0 flex-1 pr-3">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">{asset.name}</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
            {kindLabel[asset.kind]}
          </span>
        </div>
        {holding && holding.units > 0 ? (
          <p className="mt-0.5 text-xs text-muted-foreground tabular">
            {num(holding.units)} units · avg {pcMoney(holding.avgCost)}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">{asset.blurb}</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-base font-semibold tabular">{pcMoney(price)}</p>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tap to trade</p>
      </div>
    </button>
  );
}

export function LockedAssetTeaser({ nextUnit }: { nextUnit: 3 | 5 }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
      <Lock className="h-4 w-4 flex-none" strokeWidth={1.75} />
      Unlock more assets — reach Unit {nextUnit}.
    </div>
  );
}
