// Asset detail — the screen that visibly grows as lessons are completed.
//
// This is where the product's whole argument lives: the same screen at lesson 1
// and at lesson 8 looks completely different, and every difference is earned.

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Sparkline } from "@/components/simulate/Sparkline";
import { Candlestick } from "@/components/simulate/Candlestick";
import { PriceChangeTag } from "@/components/simulate/PriceChangeTag";
import { RangeBar } from "@/components/simulate/RangeBar";
import { pcMoney } from "@/lib/format";
import { buildCandles } from "@/lib/market";
import { SLICE_ASSETS } from "../content";
import { useSliceStore } from "../useSliceStore";
import { LockedSlot } from "../components/Guidance";

const TIMEFRAMES = ["1D", "1M", "1Y", "5Y"] as const;

export function AssetDetailScreen({
  assetId,
  onBack,
  onBuy,
  onLimit,
}: {
  assetId: string;
  onBack: () => void;
  onBuy: (id: string) => void;
  onLimit: (id: string) => void;
}) {
  const a = SLICE_ASSETS[assetId];
  const has = useSliceStore((s) => s.has);
  const price = useSliceStore((s) => s.prices[assetId] ?? a.startPrice);
  const series = useSliceStore((s) => s.series[assetId] ?? []);
  const pos = useSliceStore((s) => s.positions[assetId]);
  const order = useSliceStore((s) => s.order);
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]>("1D");

  const first = series[0] ?? price;
  const changePct = first ? ((price - first) / first) * 100 : 0;

  // Longer timeframes zoom out — the whole point of lesson 5.
  const longSeries =
    tf === "1D"
      ? series
      : Array.from({ length: 60 }, (_, i) => {
          const t = i / 59;
          const growth = tf === "5Y" ? 0.55 : tf === "1Y" ? 0.22 : 0.06;
          const wobble = Math.sin(i / 3.1) * a.startPrice * 0.05;
          return (
            a.startPrice * (1 - growth) + a.startPrice * growth * t + wobble
          );
        });

  const candles = buildCandles(
    assetId.length * 977,
    price * 0.94,
    24,
    0.05,
    "2026-07-23",
  );
  const gain = pos ? (price - pos.avgCost) * pos.units : 0;

  return (
    <div className="space-y-4 px-5 pb-28 pt-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight">
            {a.name}
          </h1>
          <p className="text-xs text-muted-foreground">{a.kind}</p>
        </div>
      </div>

      {/* Always visible — price is the one thing you get for free. */}
      <Card target="price-chart">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold tabular tracking-tight">
            {pcMoney(price, { cents: true })}
          </span>
          <PriceChangeTag value={changePct} />
        </div>
        {has("liveChart") ? (
          <>
            <div className="mt-3 h-24 w-full">
              <Sparkline
                data={(tf === "1D" ? series : longSeries).slice(-40)}
                width={320}
                height={96}
                positive={changePct >= 0}
                fill
                className="h-full w-full"
              />
            </div>
            {has("timeframes") && (
              <div
                data-slice-target="timeframes"
                className="mt-3 grid grid-cols-4 gap-1.5"
              >
                {TIMEFRAMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTf(t)}
                    className={
                      "rounded-full py-1.5 text-xs font-semibold transition-colors " +
                      (tf === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground")
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="mt-3">
            <LockedSlot label="Live price chart" lesson={2} />
          </div>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">
          Invented price — not a real quote.
        </p>
      </Card>

      {pos && (
        <Card target="position-card">
          <Title>You own a piece of {a.short}</Title>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Units" value={pos.units.toFixed(2)} />
            <Stat label="Worth" value={pcMoney(pos.units * price)} />
            <Stat
              label="Gain / loss"
              value={`${gain >= 0 ? "+" : "−"}${pcMoney(Math.abs(gain), { cents: true })}`}
              tone={gain >= 0 ? "up" : "down"}
            />
          </div>
        </Card>
      )}

      {order && order.assetId === assetId && (
        <Card target="order-book">
          <Title>
            {order.filled ? "Order filled" : "Waiting in the order book"}
          </Title>
          <div className="space-y-1">
            {[2, 1].map((n) => (
              <BookRow
                key={`a${n}`}
                price={price + n * 0.22}
                qty={40 * n}
                tone="down"
              />
            ))}
            <div className="rounded-lg bg-secondary px-2 py-1 text-center text-[11px] text-muted-foreground">
              market {pcMoney(price, { cents: true })}
            </div>
            <div
              className={
                "flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold " +
                (order.filled
                  ? "bg-success-surface text-success-text"
                  : "bg-accent text-accent-foreground")
              }
            >
              <span>
                Your limit · {pcMoney(order.trigger, { cents: true })}
              </span>
              <span>{order.filled ? "FILLED ✓" : "waiting…"}</span>
            </div>
            {[1, 2].map((n) => (
              <BookRow
                key={`b${n}`}
                price={order.trigger - n * 0.25}
                qty={30 * n}
                tone="up"
              />
            ))}
          </div>
        </Card>
      )}

      {has("range52w") && (
        <Card>
          <Title>52-week range</Title>
          <RangeBar
            low={a.range52w.low}
            high={a.range52w.high}
            current={price}
            label="Where today sits"
          />
        </Card>
      )}

      {has("range52w") && a.composition && (
        <Card>
          <Title>What's inside this fund</Title>
          <div className="space-y-2">
            {a.composition.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-xs">
                  <span>{c.name}</span>
                  <span className="tabular text-muted-foreground">
                    {c.pct}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.pct}%`, background: c.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {has("candles") && (
        <Card>
          <Title>Candlesticks</Title>
          <p className="mb-2 text-xs text-muted-foreground">
            Each candle is one day: open, close, high and low.
          </p>
          <Candlestick candles={candles} />
        </Card>
      )}

      <Card>
        <Title>About</Title>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {a.about}
        </p>
      </Card>

      {/* Sticky action bar. `sticky`, never `fixed` — fixed anchors to the
          viewport and escapes the phone frame. */}
      {has("buy") && (
        <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-border bg-background/95 px-5 py-3 backdrop-blur">
          {has("limitOrders") && (
            <button
              type="button"
              data-slice-target="buy-button"
              onClick={() => onLimit(assetId)}
              className="flex-1 rounded-full bg-primary py-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
            >
              Set a limit order
            </button>
          )}
          {!has("limitOrders") && (
            <button
              type="button"
              data-slice-target="buy-button"
              onClick={() => onBuy(assetId)}
              className="flex-1 rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
            >
              {pos ? "Buy more" : `Own a piece of ${a.short}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Card({
  children,
  target,
}: {
  children: React.ReactNode;
  target?: string;
}) {
  return (
    <section
      data-slice-target={target}
      className="animate-unlock-reveal rounded-3xl border border-border bg-card p-5 shadow-sm"
    >
      {children}
    </section>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={
          "mt-0.5 text-sm font-semibold tabular " +
          (tone === "up"
            ? "text-market-up-text"
            : tone === "down"
              ? "text-market-down-text"
              : "")
        }
      >
        {value}
      </p>
    </div>
  );
}

function BookRow({
  price,
  qty,
  tone,
}: {
  price: number;
  qty: number;
  tone: "up" | "down";
}) {
  return (
    <div className="relative flex items-center justify-between overflow-hidden rounded-md px-2 py-1 text-xs">
      <div
        className={
          "absolute inset-y-0 left-0 opacity-15 " +
          (tone === "up" ? "bg-market-up" : "bg-market-down")
        }
        style={{ width: `${Math.min(100, qty)}%` }}
      />
      <span
        className={
          "relative tabular " +
          (tone === "up" ? "text-market-up-text" : "text-market-down-text")
        }
      >
        {pcMoney(price, { cents: true })}
      </span>
      <span className="relative tabular text-muted-foreground">{qty}</span>
    </div>
  );
}
