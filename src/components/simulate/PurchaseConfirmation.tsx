import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PracticeMoneyBadge } from "@/components/simulate/PracticeMoneyBadge";
import type { AssetDef } from "@/content/assets";
import type { BuyExecution } from "@/store/useAppStore";
import { pcMoney, shares as fmtShares } from "@/lib/format";

/** Shown in place of the detail screen straight after a fill, so the numbers
 * that actually applied — execution price, fee — are the first thing seen. */
export function PurchaseConfirmation({
  asset,
  execution,
  price,
  onDone,
}: {
  asset: AssetDef;
  execution: BuyExecution;
  price: number;
  onDone: () => void;
}) {
  return (
    <main className="flex min-h-full flex-col items-center px-5 pb-10 pt-10 text-center">
      <CircleCheck className="h-14 w-14 text-primary" strokeWidth={1.3} />

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Purchase confirmed
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You bought {fmtShares(execution.units)} units of {asset.name} (
        {asset.id}).
      </p>

      <div className="mt-6 w-full rounded-3xl border border-border bg-card p-5 text-sm">
        <Row
          label="Total units held"
          value={fmtShares(execution.newTotalUnits)}
        />
        <Row
          label="Position value"
          value={pcMoney(execution.newTotalUnits * price, { cents: true })}
        />
        <Row
          label="New average price"
          value={pcMoney(execution.newAvgCost, { cents: true })}
        />
        <Row
          label="Execution price"
          value={pcMoney(execution.execPrice, { cents: true })}
        />
        <Row
          label="Fees paid"
          value={pcMoney(execution.fee, { cents: true })}
        />
        <Row
          label="Total debited"
          value={pcMoney(execution.spent, { cents: true })}
          strong
        />
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        That's the whole loop: read the asset, size the order, pay the fee, hold
        the position. Same steps as a real platform — with none of the risk.
      </p>

      <PracticeMoneyBadge className="mt-5" />

      <Button
        type="button"
        className="mt-6 w-full rounded-full py-6 text-base font-semibold"
        onClick={onDone}
      >
        Back to asset
      </Button>
    </main>
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
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={"tabular " + (strong ? "font-semibold text-foreground" : "")}
      >
        {value}
      </span>
    </div>
  );
}
