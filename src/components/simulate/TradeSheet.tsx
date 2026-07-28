import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Minus, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assetById } from "@/content/assets";
import { useAppStore } from "@/store/useAppStore";
import { canUseFractional } from "@/lib/guards";
import { unitForCompleted } from "@/lib/xp";
import { num, pcMoney } from "@/lib/format";
import { toast } from "sonner";
import { track } from "@/lib/analytics";

type Side = "buy" | "sell";

export function TradeSheet({
  assetId,
  open,
  onOpenChange,
}: {
  assetId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const asset = assetId ? assetById(assetId) : undefined;
  const price = useAppStore((s) =>
    assetId ? (s.market.assets[assetId]?.last.price ?? asset?.startPrice ?? 0) : 0,
  );
  const cash = useAppStore((s) => s.user.cash);
  const heldUnits = useAppStore((s) =>
    assetId ? (s.portfolio.holdings[assetId]?.units ?? 0) : 0,
  );
  const unit = useAppStore((s) => unitForCompleted(s.user.completedLessons));
  const trade = useAppStore((s) => s.trade);

  const fractional = canUseFractional(unit);
  const step = fractional ? 0.1 : 1;

  const [side, setSide] = useState<Side>("buy");
  const [units, setUnits] = useState<number>(step);
  const [typedUnits, setTypedUnits] = useState<string>(num(step, { whole: !fractional }));
  const inputRef = useRef<HTMLInputElement>(null);

  const formatUnits = useCallback(
    (value: number) => num(value, { whole: !fractional }),
    [fractional],
  );

  const normalize = useCallback(
    (raw: string): number | null => {
      const cleaned = raw.replace(/,/g, "").trim();
      const value = Number(cleaned);
      if (!Number.isFinite(value) || value <= 0) return null;
      if (!fractional && !Number.isInteger(value)) return null;
      const rounded = fractional ? Number(value.toFixed(2)) : Math.round(value);
      return Math.max(rounded, step);
    },
    [fractional, step],
  );

  useEffect(() => {
    if (open) {
      setSide("buy");
      setUnits(step);
      setTypedUnits(num(step, { whole: !fractional }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, assetId]);

  const total = useMemo(() => units * price, [units, price]);

  const { disabled, reason } = useMemo(() => {
    if (!asset) return { disabled: true, reason: "Unknown asset" };
    if (units <= 0) return { disabled: true, reason: "Enter units above 0" };
    if (side === "buy" && total > cash) {
      return { disabled: true, reason: `You need ${pcMoney(total - cash)} more` };
    }
    if (side === "sell" && units > heldUnits) {
      return {
        disabled: true,
        reason:
          heldUnits === 0
            ? "You don't own this asset yet"
            : `You only own ${num(heldUnits)} units`,
      };
    }
    return { disabled: false, reason: "" };
  }, [asset, units, side, total, cash, heldUnits]);

  const bump = (delta: number) => {
    setUnits((u) => {
      const next = Number((u + delta).toFixed(fractional ? 2 : 0));
      const clamped = next < step ? step : next;
      setTypedUnits(formatUnits(clamped));
      return clamped;
    });
  };

  const onConfirm = () => {
    if (!asset) return;
    const result = trade(asset.id, side, units);
    if (!result.ok) {
      toast.error(result.reason ?? "Trade failed");
      return;
    }
    track({ type: "trade_executed", assetId: asset.id, side, units, price });
    toast.success(
      `${side === "buy" ? "Bought" : "Sold"} ${num(units)} ${asset.id} @ ${pcMoney(price)}`,
    );
    onOpenChange(false);
  };

  if (!asset) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-t border-border">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl">{asset.name}</SheetTitle>
          <SheetDescription>
            <span className="tabular">{pcMoney(price)}</span> per unit · practice money only
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5 px-4 pb-6">
          {/* Buy / Sell segmented */}
          <div
            role="tablist"
            aria-label="Trade side"
            className="grid grid-cols-2 rounded-full border border-border bg-muted p-1 text-sm font-semibold"
          >
            {(["buy", "sell"] as Side[]).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={side === s}
                onClick={() => setSide(s)}
                className={
                  "rounded-full py-2 capitalize transition-colors " +
                  (side === s
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground")
                }
              >
                {s}
              </button>
            ))}
          </div>

          {/* Unit stepper */}
          <div>
            <label
              htmlFor="units-input"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Units {fractional ? "(0.1 step)" : "(whole)"}
            </label>
            <div className="mt-2 flex items-center justify-between rounded-2xl border border-border bg-card p-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => bump(-step)}
                aria-label="Decrease units"
                disabled={units <= step}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="units-input"
                ref={inputRef}
                type="number"
                inputMode="decimal"
                step={step}
                min={step}
                value={typedUnits}
                onChange={(e) => setTypedUnits(e.target.value)}
                onBlur={() => {
                  const normalized = normalize(typedUnits);
                  if (normalized === null) {
                    setTypedUnits(formatUnits(units));
                    return;
                  }
                  setUnits(normalized);
                  setTypedUnits(formatUnits(normalized));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    inputRef.current?.blur();
                  }
                }}
                className="w-32 border-none bg-transparent text-center text-2xl font-bold tabular shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Units to trade"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => bump(step)}
                aria-label="Increase units"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-2xl bg-muted/50 p-4 text-sm">
            <Row label="Price" value={pcMoney(price)} />
            <Row label="Units" value={num(units, { whole: !fractional })} />
            <Row label="Total" value={pcMoney(total)} strong />
            <Row
              label={side === "buy" ? "Cash after" : "Cash after"}
              value={pcMoney(side === "buy" ? cash - total : cash + total)}
            />
          </div>

          {disabled && reason && (
            <p role="status" className="text-center text-sm text-destructive">
              {reason}
            </p>
          )}

          <Button
            type="button"
            className="w-full rounded-full py-6 text-base font-semibold"
            onClick={onConfirm}
            disabled={disabled}
          >
            Confirm {side}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={"tabular " + (strong ? "font-semibold text-foreground" : "")}>
        {value}
      </span>
    </div>
  );
}
