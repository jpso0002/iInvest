import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PracticeMoneyBadge } from "@/components/simulate/PracticeMoneyBadge";
import type { AssetDef } from "@/content/assets";
import { useAppStore } from "@/store/useAppStore";
import { pcMoney, pct, shares as fmtShares } from "@/lib/format";
import { toast } from "sonner";

/** Preset distances from the current price, so a learner doesn't have to do
 * the arithmetic to place a sensible stop. */
const STOP_STEPS = [5, 10, 20];
const TARGET_STEPS = [10, 25, 50];

/**
 * Adds a stop-loss or take-profit to a position that already exists.
 *
 * Protections could previously only be set in the moment of buying, which is
 * the one moment you know least about how the position will behave.
 */
export function ProtectSheet({
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
  const placeOrder = useAppStore((s) => s.placeOrder);

  const [kind, setKind] = useState<"stop-loss" | "take-profit">("stop-loss");
  const [typed, setTyped] = useState("");

  const isStop = kind === "stop-loss";
  const steps = isStop ? STOP_STEPS : TARGET_STEPS;

  // Reseeded per opening so the default tracks the price you're looking at.
  useEffect(() => {
    if (!open) return;
    setKind("stop-loss");
    setTyped((price * 0.9).toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, asset.id]);

  const pickStep = (percent: number) => {
    const next = isStop
      ? price * (1 - percent / 100)
      : price * (1 + percent / 100);
    setTyped(next.toFixed(2));
  };

  const switchKind = (next: "stop-loss" | "take-profit") => {
    setKind(next);
    setTyped((next === "stop-loss" ? price * 0.9 : price * 1.1).toFixed(2));
  };

  const trigger = Number(typed);
  const held = holding?.units ?? 0;
  const valid = Number.isFinite(trigger) && trigger > 0;
  const awayPct = valid && price > 0 ? ((trigger - price) / price) * 100 : 0;

  const onConfirm = () => {
    const res = placeOrder(asset.id, kind, trigger, held);
    if (!res.ok) {
      toast.error(res.reason ?? "Couldn't place that order");
      return;
    }
    toast.success(
      `${isStop ? "Stop-loss" : "Take-profit"} set at ${pcMoney(trigger, { cents: true })}`,
    );
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-border"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl">Protect your {asset.id}</SheetTitle>
          <SheetDescription>
            {fmtShares(held)} units · market{" "}
            <span className="tabular">{pcMoney(price)}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-5 px-4 pb-8">
          <div className="grid grid-cols-2 gap-2">
            <KindButton
              active={isStop}
              onClick={() => switchKind("stop-loss")}
              label="Stop-loss"
              hint="Sell if it falls"
            />
            <KindButton
              active={!isStop}
              onClick={() => switchKind("take-profit")}
              label="Take-profit"
              hint="Sell if it rises"
            />
          </div>

          <div>
            <label
              htmlFor="protect-trigger"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Trigger price
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
              <span className="text-2xl font-bold text-muted-foreground">
                pc$
              </span>
              <Input
                id="protect-trigger"
                type="number"
                inputMode="decimal"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="border-none bg-transparent px-0 text-2xl font-bold tabular shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Trigger price"
              />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {steps.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => pickStep(s)}
                  className="rounded-full border border-border bg-card py-2 text-sm font-semibold transition-colors hover:bg-secondary/60"
                >
                  {isStop ? "−" : "+"}
                  {s}%
                </button>
              ))}
            </div>
            {valid && (
              <p className="mt-2 text-xs text-muted-foreground tabular">
                {pct(awayPct)} from the current price
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-muted/50 p-4 text-xs text-muted-foreground">
            {isStop
              ? "A stop-loss is a trigger, not a guarantee. If the price jumps straight past it you'll sell at whatever the market is then — which can be lower."
              : "A take-profit closes the whole position the first time it trades at or above your price."}
          </div>

          <PracticeMoneyBadge />

          <Button
            type="button"
            className="w-full rounded-full py-6 text-base font-semibold"
            onClick={onConfirm}
            disabled={!valid || held <= 0}
          >
            Set {isStop ? "stop-loss" : "take-profit"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function KindButton({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-2xl border p-3 text-left transition-colors " +
        (active
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:bg-secondary/60")
      }
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="block text-[11px] text-muted-foreground">{hint}</span>
    </button>
  );
}
