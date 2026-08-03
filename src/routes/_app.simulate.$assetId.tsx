import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Info, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PracticeMoneyBadge } from "@/components/simulate/PracticeMoneyBadge";
import { PriceChangeTag } from "@/components/simulate/PriceChangeTag";
import { Sparkline } from "@/components/simulate/Sparkline";
import { Candlestick } from "@/components/simulate/Candlestick";
import { OrderBook } from "@/components/simulate/OrderBook";
import { RangeBar } from "@/components/simulate/RangeBar";
import { LockedTeaser } from "@/components/simulate/LockedTeaser";
import { PendingOrders } from "@/components/simulate/PendingOrders";
import { InvestSheet } from "@/components/simulate/InvestSheet";
import { SellSheet } from "@/components/simulate/SellSheet";
import { ProtectSheet } from "@/components/simulate/ProtectSheet";
import { PurchaseConfirmation } from "@/components/simulate/PurchaseConfirmation";
import { assetById, kindLabel } from "@/content/assets";
import { assetDetail, TIMEFRAMES, type Timeframe } from "@/content/assetDetail";
import { useAppStore, type BuyExecution } from "@/store/useAppStore";
import { useLivePrice } from "@/hooks/use-live-price";
import { unitForCompleted } from "@/lib/xp";
import { canUseTargetOrders } from "@/lib/guards";
import {
  ASSET_DISCLOSURE_LEVELS,
  isUnlocked,
  nextLockedLevel,
  nextUnlock,
} from "@/lib/disclosure";
import {
  compactNumber,
  formatDate,
  num,
  pcCompact,
  pcDelta,
  pcMoney,
  pct,
  shares as fmtShares,
} from "@/lib/format";

export const Route = createFileRoute("/_app/simulate/$assetId")({
  head: ({ params }) => {
    const asset = assetById(params.assetId);
    return {
      meta: [
        { title: asset ? `${asset.name} · iInvest` : "Asset · iInvest" },
        {
          name: "description",
          content:
            "Practice-money asset detail. Prices are invented — no real market data.",
        },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: AssetDetailScreen,
});

function AssetDetailScreen() {
  const { assetId } = Route.useParams();
  const asset = assetById(assetId);
  const detail = assetDetail(assetId);

  const storePrice = useAppStore(
    (s) => s.market.assets[assetId]?.last.price ?? asset?.startPrice ?? 0,
  );
  const completed = useAppStore((s) => s.user.completedLessons);
  const holding = useAppStore((s) => s.portfolio.holdings[assetId]);
  const history = useAppStore((s) => s.portfolio.history);
  const initMarket = useAppStore((s) => s.initMarket);

  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [sheet, setSheet] = useState<"buy" | "sell" | "protect" | null>(null);
  const [filled, setFilled] = useState<BuyExecution | null>(null);

  // Prices tick from the list screen, but the detail route can be deep-linked
  // into directly, so make sure the asset has a starting price either way.
  useEffect(() => {
    initMarket();
    const id = window.setInterval(() => useAppStore.getState().tick(), 3000);
    return () => window.clearInterval(id);
  }, [initMarket]);

  const live = useLivePrice(
    asset?.id,
    storePrice,
    asset?.volatility ?? 0.01,
    detail?.sparkline ?? [],
  );

  if (!asset || !detail) {
    return (
      <main className="space-y-4 px-5 pt-6">
        <Link
          to="/simulate"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <p className="text-sm text-muted-foreground">Asset not found.</p>
      </main>
    );
  }

  if (filled) {
    return (
      <PurchaseConfirmation
        asset={asset}
        execution={filled}
        price={live.price}
        onDone={() => setFilled(null)}
      />
    );
  }

  const completedCount = completed.length;
  const unlocked = (level: number) =>
    isUnlocked(completedCount, ASSET_DISCLOSURE_LEVELS, level);
  const teaser = nextLockedLevel(completedCount, ASSET_DISCLOSURE_LEVELS);

  const unit = unitForCompleted(completed);
  const locked = asset.unlockAfterUnit > unit;

  const units = holding?.units ?? 0;
  const hasPosition = units > 0;
  const gainLoss = hasPosition ? (live.price - holding!.avgCost) * units : 0;
  const gainLossPct = hasPosition
    ? ((live.price - holding!.avgCost) / holding!.avgCost) * 100
    : 0;

  const buys = history.filter((t) => t.assetId === assetId && t.side === "buy");

  return (
    <main className="flex min-h-full flex-col">
      <div className="space-y-4 px-5 pt-6">
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
              {asset.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {kindLabel[asset.kind]} · {asset.id}
            </p>
          </div>
        </div>

        {/* Tier 1 — price & live chart */}
        <Card>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold tabular tracking-tight">
              {pcMoney(live.price)}
            </span>
            <PriceChangeTag value={live.changePct} />
          </div>
          <div className="mt-3 h-20 w-full">
            <Sparkline
              data={live.series}
              width={320}
              height={80}
              positive={live.changePct >= 0}
              fill
              className="h-full w-full"
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Invented price on a random walk — not a real quote.
          </p>
        </Card>

        {/* Not tiered: an order you placed must always be visible and
            cancellable, whatever your lesson count. */}
        <PendingOrders asset={asset} price={live.price} />

        {/* Tier 2 — your position */}
        {unlocked(2) && (
          <Card>
            <SectionTitle>Your position</SectionTitle>
            {hasPosition ? (
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Units held" value={fmtShares(units)} />
                <Stat
                  label="Current value"
                  value={pcMoney(units * live.price)}
                />
                <Stat
                  label="Gain / loss"
                  value={pcDelta(gainLoss)}
                  sub={pct(gainLossPct)}
                  tone={gainLoss >= 0 ? "up" : "down"}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Invest to see your position appear here.
              </p>
            )}
            {/* Same tier that unlocks protections in the buy flow — but usable
                on a position you already hold, not just at the moment of buying. */}
            {hasPosition && canUseTargetOrders(completed) && (
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full rounded-full"
                onClick={() => setSheet("protect")}
              >
                <Shield className="mr-2 h-4 w-4" />
                Protect this position
              </Button>
            )}
          </Card>
        )}

        {/* Tier 3 — price history */}
        {unlocked(3) && (
          <Card>
            <SectionTitle>Price history</SectionTitle>
            <div className="grid grid-cols-5 gap-1.5">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={
                    "rounded-full py-1.5 text-xs font-semibold transition-colors " +
                    (timeframe === tf
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-secondary")
                  }
                >
                  {tf}
                </button>
              ))}
            </div>
            <div className="mt-3 h-24 w-full">
              <Sparkline
                data={detail.ranges[timeframe]}
                width={320}
                height={96}
                positive={detail.dayChangePct >= 0}
                fill
                className="h-full w-full"
              />
            </div>
            <div className="mt-3">
              <RangeBar
                low={detail.range52w.low}
                high={detail.range52w.high}
                current={live.price}
                label="52-week range"
              />
            </div>
          </Card>
        )}

        {/* Tier 4 — purchase price & fees */}
        {unlocked(4) && (
          <Card>
            <SectionTitle>Purchase & fees</SectionTitle>
            <Kv
              label="Your average purchase price"
              value={hasPosition ? pcMoney(holding!.avgCost) : "—"}
            />
            <Kv
              label="Management fee (annual)"
              value={
                asset.managementFeePct > 0
                  ? `${asset.managementFeePct.toFixed(2)}%`
                  : "None — single company"
              }
            />
          </Card>
        )}

        {/* Tier 5 — fund composition */}
        {unlocked(5) && asset.composition && (
          <Card>
            <SectionTitle>What's inside</SectionTitle>
            <div className="space-y-2">
              {asset.composition.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate pr-2">{c.name}</span>
                    <span className="tabular text-muted-foreground">
                      {c.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tier 6 — purchase history */}
        {unlocked(6) && (
          <Card>
            <SectionTitle>Purchase history</SectionTitle>
            {buys.length > 0 ? (
              <div className="space-y-1.5">
                {buys.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between text-xs tabular"
                  >
                    <span className="text-muted-foreground">
                      {formatDate(t.at)}
                    </span>
                    <span>{fmtShares(t.units)} units</span>
                    <span className="font-medium">{pcMoney(t.price)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No purchases yet.</p>
            )}
            <div className="mt-3 flex gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
              <Info
                className="h-4 w-4 flex-none text-info-text"
                strokeWidth={2}
              />
              <span>
                Investing a little regularly, instead of everything at once,
                smooths out your average purchase price over time.
              </span>
            </div>
          </Card>
        )}

        {/* Tier 7 — market data */}
        {unlocked(7) && (
          <Card>
            <SectionTitle>Market data</SectionTitle>
            <Kv label="Rank" value={`#${asset.rank}`} />
            <Kv label="Market cap" value={pcCompact(detail.marketCap)} />
            <Kv
              label="Average annual return"
              value={`${asset.avgAnnualReturnPct.toFixed(1)}%`}
            />
            <Kv label="24h volume" value={pcCompact(detail.volume24h)} />
          </Card>
        )}

        {/* Tier 8 — supply & all-time high */}
        {unlocked(8) && (
          <Card>
            <SectionTitle>Supply & all-time high</SectionTitle>
            <Kv
              label="Units in circulation"
              value={`${compactNumber(asset.circulatingSupply)} units`}
            />
            <Kv
              label="All-time high"
              value={`${pcMoney(detail.ath)} · ${formatDate(detail.athDate)}`}
            />
            <Kv
              label="24h range"
              value={`${pcMoney(detail.range24h.low)} – ${pcMoney(detail.range24h.high)}`}
            />
          </Card>
        )}

        {/* Tier 9 — trading activity & about */}
        {unlocked(9) && (
          <Card>
            <SectionTitle>Trading activity</SectionTitle>
            <div className="h-2 overflow-hidden rounded-full bg-market-down/30">
              <div
                className="h-full rounded-full bg-market-up"
                style={{ width: `${detail.buySellRatio.buyPct}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-xs">
              <span className="font-medium text-market-up-text">
                {detail.buySellRatio.buyPct}% buyers
              </span>
              <span className="font-medium text-market-down-text">
                {detail.buySellRatio.sellPct}% sellers
              </span>
            </div>

            <SectionTitle className="mt-5">About {asset.id}</SectionTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {asset.about}
            </p>
          </Card>
        )}

        {/* Tier 10 — candles & order book */}
        {unlocked(10) && (
          <Card>
            <SectionTitle>Candlestick chart</SectionTitle>
            <p className="mb-2 text-xs text-muted-foreground">
              Each candle is one day: the body spans open to close, the wick
              shows the day's high and low. {num(detail.candles.length)} days
              shown.
            </p>
            <Candlestick candles={detail.candles} />

            <SectionTitle className="mt-5">Order book</SectionTitle>
            <p className="mb-2 text-xs text-muted-foreground">
              Orders waiting to fill. Sellers above, buyers below.
            </p>
            <OrderBook
              bids={detail.orderBook.bids}
              asks={detail.orderBook.asks}
            />
          </Card>
        )}

        {teaser && (
          <LockedTeaser
            title={teaser.label}
            lessonsRemaining={nextUnlock(
              completedCount,
              ASSET_DISCLOSURE_LEVELS,
              teaser.level,
            )}
          />
        )}

        <PracticeMoneyBadge />
      </div>

      {/* Sticky, not fixed: `.phone-frame` is only `position: relative`, so a
          fixed bar anchors to the viewport and escapes the phone. Sticky pins
          it to the bottom of `.phone-content`, which is the scroll container,
          and `mt-auto` holds it down when the content is short. */}
      <div className="sticky bottom-0 z-20 mt-auto flex gap-2 border-t border-border bg-background/95 px-5 py-3 backdrop-blur">
        {locked ? (
          <Button
            type="button"
            className="w-full rounded-full py-6 text-base font-semibold"
            disabled
          >
            Unlocks at Unit {asset.unlockAfterUnit}
          </Button>
        ) : (
          <>
            {hasPosition && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-full py-6 text-base font-semibold"
                onClick={() => setSheet("sell")}
              >
                Sell
              </Button>
            )}
            <Button
              type="button"
              className="flex-1 rounded-full py-6 text-base font-semibold"
              onClick={() => setSheet("buy")}
            >
              {hasPosition ? "Invest more" : "Invest"}
            </Button>
          </>
        )}
      </div>

      <InvestSheet
        asset={asset}
        open={sheet === "buy"}
        onOpenChange={(o) => !o && setSheet(null)}
        onFilled={(execution) => {
          setSheet(null);
          setFilled(execution);
        }}
      />

      {hasPosition && (
        <SellSheet
          asset={asset}
          open={sheet === "sell"}
          onOpenChange={(o) => !o && setSheet(null)}
        />
      )}

      {hasPosition && (
        <ProtectSheet
          asset={asset}
          open={sheet === "protect"}
          onOpenChange={(o) => !o && setSheet(null)}
        />
      )}
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      {children}
    </section>
  );
}

function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={
        "mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground " +
        (className ?? "")
      }
    >
      {children}
    </h2>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "up" | "down";
}) {
  const toneClass =
    tone === "up"
      ? "text-market-up-text"
      : tone === "down"
        ? "text-market-down-text"
        : "";
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={"mt-0.5 text-sm font-semibold tabular " + toneClass}>
        {value}
      </p>
      {sub && <p className={"text-[11px] tabular " + toneClass}>{sub}</p>}
    </div>
  );
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular font-medium">{value}</span>
    </div>
  );
}
