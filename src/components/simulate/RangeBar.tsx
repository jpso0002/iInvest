import { pcMoney } from "@/lib/format";

/** Where the current price sits inside a low–high band (52-week, 24h, …).
 * The marker is clamped: the live price random-walks and can wander outside the
 * generated historical band, which shouldn't push the dot off the track. */
export function RangeBar({
  low,
  high,
  current,
  label,
}: {
  low: number;
  high: number;
  current: number;
  label: string;
}) {
  const span = high - low;
  const raw = span > 0 ? ((current - low) / span) * 100 : 50;
  const position = Math.min(100, Math.max(0, raw));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <span className="tabular text-xs text-muted-foreground">
          {pcMoney(low)}
        </span>
        <div className="relative h-1.5 flex-1 rounded-full bg-muted">
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow-sm"
            style={{ left: `${position}%` }}
            aria-hidden="true"
          />
        </div>
        <span className="tabular text-xs text-muted-foreground">
          {pcMoney(high)}
        </span>
      </div>
      <p className="text-center text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
