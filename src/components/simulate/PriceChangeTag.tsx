import { TrendingDown, TrendingUp } from "lucide-react";
import { pct } from "@/lib/format";

export function PriceChangeTag({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md";
}) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  const small = size === "sm";

  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full font-semibold tabular " +
        (small ? "px-1.5 py-0.5 text-[11px] " : "px-2 py-1 text-xs ") +
        (positive
          ? "bg-primary/10 text-primary"
          : "bg-destructive/10 text-destructive")
      }
    >
      <Icon className={small ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={2.3} />
      {pct(value)}
    </span>
  );
}
