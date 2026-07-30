import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LockedTeaser } from "@/components/simulate/LockedTeaser";
import { PracticeMoneyBadge } from "@/components/simulate/PracticeMoneyBadge";
import type { AssetDef } from "@/content/assets";
import { useAppStore, type BuyExecution } from "@/store/useAppStore";
import { canUseFractional } from "@/lib/guards";
import { unitForCompleted } from "@/lib/xp";
import {
  INVEST_DISCLOSURE_LEVELS,
  isUnlocked,
  nextLockedLevel,
  nextUnlock,
} from "@/lib/disclosure";
import { pcMoney, shares as fmtShares } from "@/lib/format";
import {
  FEE_RATE,
  MAKER_TAKER,
  MAX_SLIPPAGE,
  type OrderType,
} from "@/lib/trading";
import { pct } from "@/lib/format";
import { track } from "@/lib/analytics";
import { toast } from "sonner";

const QUICK_AMOUNTS = [50, 100, 250];

export function InvestSheet({
  asset,
  open,
  onOpenChange,
  onFilled,
}: {
  asset: AssetDef;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilled: (execution: BuyExecution) => void;
}) {
  const price = useAppStore(
    (s) => s.market.assets[asset.id]?.last.price ?? asset.startPrice,
  );
  const cash = useAppStore((s) => s.user.cash);
  const completed = useAppStore((s) => s.user.completedLessons);
  const holding = useAppStore((s) => s.portfolio.holdings[asset.id]);
  const buyWithAmount = useAppStore((s) => s.buyWithAmount);

  const completedCount = completed.length;
  const unit = unitForCompleted(completed);
  const fractional = canUseFractional(unit);
  const unlocked = (level: number) =>
    isUnlocked(completedCount, INVEST_DISCLOSURE_LEVELS, level);

  const [amount, setAmount] = useState(100);
  const [typedAmount, setTypedAmount] = useState("100");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  useEffect(() => {
    if (!open) return;
    const start = Math.min(100, Math.floor(cash));
    setAmount(start);
    setTypedAmount(String(start));
    setOrderType("market");
    setLimitPrice(price.toFixed(2));
    setStopLoss("");
    setTakeProfit("");
    // Re-seeded per opening; `price` and `cash` move constantly and must not
    // reset the form mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, asset.id]);

  const effectiveOrderType: OrderType = unlocked(4) ? orderType : "market";
  const limit = Number(limitPrice);
  const execPrice =
    effectiveOrderType === "limit" && Number.isFinite(limit) && limit > 0
      ? limit
      : price;

  const preview = useMemo(() => {
    const fee = amount * FEE_RATE;
    const invested = amount - fee;
    const raw = execPrice > 0 ? invested / execPrice : 0;
    const units = fractional ? raw : Math.floor(raw);
    const gross = units * execPrice;
    const prevUnits = holding?.units ?? 0;
    const prevAvg = holding?.avgCost ?? 0;
    const newTotal = prevUnits + units;
    return {
      fee,
      units,
      spent: gross + fee,
      newTotal,
      newAvg:
        newTotal > 0 ? (prevUnits * prevAvg + units * execPrice) / newTotal : 0,
    };
  }, [amount, execPrice, fractional, holding]);

  const insufficient = amount > cash;
  const noWholeUnit = !fractional && preview.units <= 0;
  const disabled = amount <= 0 || insufficient || noWholeUnit;

  const teaser = nextLockedLevel(completedCount, INVEST_DISCLOSURE_LEVELS);

  const commitAmount = (raw: string) => {
    const value = Number(raw.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(value) || value <= 0) {
      setTypedAmount(String(amount));
      return;
    }
    const clamped = Math.min(value, Math.floor(cash));
    setAmount(clamped);
    setTypedAmount(String(clamped));
  };

  const pick = (value: number) => {
    setAmount(value);
    setTypedAmount(String(value));
  };

  const onConfirm = () => {
    const result = buyWithAmount(asset.id, amount, {
      orderType: effectiveOrderType,
      limitPrice: effectiveOrderType === "limit" ? limit : undefined,
      stopLoss: unlocked(5) && stopLoss ? Number(stopLoss) : undefined,
      takeProfit: unlocked(5) && takeProfit ? Number(takeProfit) : undefined,
    });
    if (!result.ok || !result.execution) {
      toast.error(result.reason ?? "Purchase failed");
      return;
    }
    track({
      type: "trade_executed",
      assetId: asset.id,
      side: "buy",
      units: result.execution.units,
      price: result.execution.execPrice,
    });
    onOpenChange(false);
    onFilled(result.execution);
  };

  const maxAmount = Math.floor(cash);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-3xl border-t border-border"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl">Invest in {asset.id}</SheetTitle>
          <SheetDescription>
            <span className="tabular">{pcMoney(price)}</span> per unit ·
            practice money only
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-5 px-4 pb-8">
          {/* Tier 1 — amount */}
          <div>
            <label
              htmlFor="invest-amount"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Amount to invest
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
              <span className="text-2xl font-bold text-muted-foreground">
                pc$
              </span>
              <Input
                id="invest-amount"
                type="number"
                inputMode="decimal"
                min={1}
                max={maxAmount}
                value={typedAmount}
                onChange={(e) => setTypedAmount(e.target.value)}
                onBlur={(e) => commitAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="border-none bg-transparent px-0 text-2xl font-bold tabular shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Amount to invest in practice money"
              />
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((v) => (
                <QuickButton
                  key={v}
                  active={amount === v}
                  onClick={() => pick(v)}
                  disabled={v > maxAmount}
                >
                  {v}
                </QuickButton>
              ))}
              <QuickButton
                active={amount === maxAmount}
                onClick={() => pick(maxAmount)}
              >
                Max
              </QuickButton>
            </div>
            {!fractional && (
              <p className="mt-2 text-xs text-muted-foreground">
                {preview.units > 0 ? (
                  <>
                    Whole units only for now — you'll buy {preview.units} unit
                    {preview.units === 1 ? "" : "s"} for{" "}
                    <span className="tabular">
                      {pcMoney(preview.spent, { cents: true })}
                    </span>{" "}
                    of your <span className="tabular">{pcMoney(amount)}</span>,
                    and keep the change.
                  </>
                ) : (
                  <>
                    Whole units only for now — this amount doesn't reach one
                    unit.
                  </>
                )}{" "}
                Fractional shares unlock in Unit 3.
              </p>
            )}
          </div>

          {/* Tier 2 — fees & balance */}
          {unlocked(2) && (
            <div className="rounded-2xl bg-muted/50 p-4 text-sm">
              <Row
                label={`Transaction fee (${pct(FEE_RATE * 100, { withSign: false })})`}
                value={pcMoney(preview.fee, { cents: true })}
              />
              <Row
                label="Available balance"
                value={pcMoney(cash)}
                tone={insufficient ? "bad" : undefined}
              />
            </div>
          )}

          {/* Tier 3 — preview */}
          {unlocked(3) && amount > 0 && (
            <div className="rounded-2xl border border-border p-4 text-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Preview after purchase
              </p>
              <Row label="Units bought" value={fmtShares(preview.units)} />
              <Row
                label="Total units held"
                value={fmtShares(preview.newTotal)}
              />
              <Row
                label="New average price"
                value={pcMoney(preview.newAvg, { cents: true })}
                strong
              />
            </div>
          )}

          {/* Tier 4 — order type */}
          {unlocked(4) && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Order type
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <QuickButton
                  active={orderType === "market"}
                  onClick={() => setOrderType("market")}
                >
                  Market
                </QuickButton>
                <QuickButton
                  active={orderType === "limit"}
                  onClick={() => setOrderType("limit")}
                >
                  Limit
                </QuickButton>
              </div>
              {orderType === "limit" && (
                <Input
                  type="number"
                  inputMode="decimal"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder="Limit price (pc$)"
                  aria-label="Limit price"
                  className="mt-2 rounded-xl"
                />
              )}
            </div>
          )}

          {/* Tier 5 — protections */}
          {unlocked(5) && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Protections (optional)
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="Stop-loss"
                  aria-label="Stop-loss price"
                  className="rounded-xl"
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  placeholder="Take-profit"
                  aria-label="Take-profit price"
                  className="rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Tier 6 — pro details */}
          {unlocked(6) && (
            <div className="rounded-2xl bg-muted/50 p-4 text-sm">
              <Row
                label="Estimated execution price"
                value={pcMoney(execPrice, { cents: true })}
              />
              <Row
                label="Maker / taker fees"
                value={MAKER_TAKER[effectiveOrderType]}
              />
              <Row
                label="Slippage tolerance"
                value={`${pct(MAX_SLIPPAGE * 100, { withSign: false })} max`}
              />
            </div>
          )}

          {teaser && (
            <LockedTeaser
              title={teaser.label}
              lessonsRemaining={nextUnlock(
                completedCount,
                INVEST_DISCLOSURE_LEVELS,
                teaser.level,
              )}
            />
          )}

          <PracticeMoneyBadge />

          {insufficient && (
            <p role="status" className="text-center text-sm text-destructive">
              You only have {pcMoney(cash)}.
            </p>
          )}
          {noWholeUnit && !insufficient && (
            <p role="status" className="text-center text-sm text-destructive">
              Not enough for one whole unit at {pcMoney(execPrice)}.
            </p>
          )}

          <Button
            type="button"
            className="w-full rounded-full py-6 text-base font-semibold"
            onClick={onConfirm}
            disabled={disabled}
          >
            Confirm investment
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function QuickButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "rounded-full border py-2 text-sm font-semibold transition-colors disabled:opacity-40 " +
        (active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-secondary/60")
      }
    >
      {children}
    </button>
  );
}

function Row({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "bad";
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          "tabular " +
          (tone === "bad" ? "text-destructive " : "") +
          (strong ? "font-semibold text-foreground" : "")
        }
      >
        {value}
      </span>
    </div>
  );
}
