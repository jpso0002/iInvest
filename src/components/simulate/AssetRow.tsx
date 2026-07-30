import { ChevronRight, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { AssetDef } from "@/content/assets";
import { assetDetail } from "@/content/assetDetail";
import { useAppStore } from "@/store/useAppStore";
import { pcMoney, shares as fmtShares } from "@/lib/format";
import { Sparkline } from "@/components/simulate/Sparkline";
import { PriceChangeTag } from "@/components/simulate/PriceChangeTag";

const kindBadge: Record<AssetDef["kind"], string> = {
  bond: "Bond",
  index: "Index",
  etf: "ETF",
  stock: "Stock",
  volatile: "Volatile",
};

export function AssetRow({ asset }: { asset: AssetDef }) {
  const price = useAppStore(
    (s) => s.market.assets[asset.id]?.last.price ?? asset.startPrice,
  );
  const holding = useAppStore((s) => s.portfolio.holdings[asset.id]);
  const detail = assetDetail(asset.id);
  const up = (detail?.dayChangePct ?? 0) >= 0;

  return (
    <Link
      to="/simulate/$assetId"
      params={{ assetId: asset.id }}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{asset.name}</p>
        {/* Badge sits under the name rather than beside it — at 390px the row
            has to fit a sparkline and a price, and a name like "Northline
            Dividend ETF" loses too much to the badge otherwise. */}
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
          <span className="flex-none rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
            {kindBadge[asset.kind]}
          </span>
          {holding && holding.units > 0 ? (
            <span className="truncate text-xs text-muted-foreground tabular">
              {fmtShares(holding.units)} units · avg {pcMoney(holding.avgCost)}
            </span>
          ) : (
            <span className="truncate text-xs text-muted-foreground">
              {asset.blurb}
            </span>
          )}
        </div>
      </div>

      {detail && (
        <div className="h-8 w-14 flex-none">
          <Sparkline
            data={detail.sparkline}
            width={56}
            height={32}
            positive={up}
            className="h-full w-full"
          />
        </div>
      )}

      <div className="flex flex-none items-center gap-1">
        <div className="text-right">
          <p className="text-base font-semibold tabular">{pcMoney(price)}</p>
          {detail && <PriceChangeTag value={detail.dayChangePct} size="sm" />}
        </div>
        <ChevronRight
          className="h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    </Link>
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
