import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PracticeMoneyBadge } from "@/components/simulate/PracticeMoneyBadge";
import type { AssetDef } from "@/content/assets";
import { useAppStore } from "@/store/useAppStore";
import { canUseFractional } from "@/lib/guards";
import { unitForCompleted } from "@/lib/xp";
import { pcMoney, pct, shares as fmtShares } from "@/lib/format";
import { FEE_RATE, feeFor } from "@/lib/trading";
import { track } from "@/lib/analytics";
import { toast } from "sonner";

const FRACTIONS = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "100%", value: 1 },
];

export function SellSheet({
  asset,
  open,
  onOpenChange,
}: {
  asset: AssetDef;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const price = useAppStore(
    (s) => s.market.assets[asset.id]?.last.price ?? asset.startPrice,
  );
  const holding = useAppStore((s) => s.portfolio.holdings[asset.id]);
  const unit = useAppStore((s) => unitForCompleted(s.user.completedLessons));
  const sell = useAppStore((s) => s.sell);

  const [fraction, setFraction] = useState(0.25);

  useEffect(() => {
    if (open) setFraction(0.25);
  }, [open, asset.id]);

  const held = holding?.units ?? 0;
  // A learner who can't hold fractions can't sell one either — round down, and
  // let 100% still clear the position.
  const raw = held * fraction;
  const units =
    canUseFractional(unit) || fraction === 1 ? raw : Math.floor(raw);

  const gross = units * price;
  const fee = feeFor(gross);
  const net = gross - fee;

  const onConfirm = () => {
    const result = sell(asset.id, units);
    if (!result.ok) {
      toast.error(result.reason ?? "Sale failed");
      return;
    }
    track({
      type: "trade_executed",
      assetId: asset.id,
      side: "sell",
      units,
      price,
    });
    toast.success(`Sold ${fmtShares(units)} ${asset.id} for ${pcMoney(net)}`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-border"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl">Sell {asset.id}</SheetTitle>
          <SheetDescription>
            You hold <span className="tabular">{fmtShares(held)}</span> units at{" "}
            <span className="tabular">{pcMoney(price)}</span> each
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-5 px-4 pb-8">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Units to sell
            </span>
            <p className="mt-1 text-3xl font-bold tabular tracking-tight">
              {fmtShares(units)}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {FRACTIONS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setFraction(f.value)}
                  className={
                    "rounded-full border py-2 text-sm font-semibold transition-colors " +
                    (fraction === f.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-secondary/60")
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-muted/50 p-4 text-sm">
            <Row
              label="Estimated value"
              value={pcMoney(gross, { cents: true })}
            />
            <Row
              label={`Transaction fee (${pct(FEE_RATE * 100, { withSign: false })})`}
              value={`−${pcMoney(fee, { cents: true })}`}
            />
            <Row
              label="Net amount received"
              value={pcMoney(net, { cents: true })}
              strong
            />
          </div>

          <PracticeMoneyBadge />

          <Button
            type="button"
            variant="destructive"
            className="w-full rounded-full py-6 text-base font-semibold"
            onClick={onConfirm}
            disabled={units <= 0}
          >
            Confirm sale
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={"tabular " + (strong ? "font-semibold text-foreground" : "")}
      >
        {value}
      </span>
    </div>
  );
}
