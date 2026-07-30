import { useEffect } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { pcMoney, shares as fmtShares } from "@/lib/format";

/**
 * Announces resting orders that fired on a tick.
 *
 * Mounted once in the app layout rather than per screen: `tick()` runs while
 * the simulator is open, and a fill that happened silently is indistinguishable
 * from a bug when the balance later doesn't add up.
 */
export function useOrderFillToasts() {
  const fills = useAppStore((s) => s.pendingOrderFills);
  const consume = useAppStore((s) => s.consumeOrderFills);

  useEffect(() => {
    if (fills.length === 0) return;
    for (const f of consume()) {
      const at = `${fmtShares(f.units)} ${f.assetId} at ${pcMoney(f.price, { cents: true })}`;
      if (f.kind === "limit-buy") {
        toast.success(`Limit order filled — bought ${at}`);
      } else if (f.kind === "stop-loss") {
        toast.warning(`Stop-loss triggered — sold ${at}`);
      } else {
        toast.success(`Take-profit hit — sold ${at}`);
      }
    }
  }, [fills, consume]);
}
